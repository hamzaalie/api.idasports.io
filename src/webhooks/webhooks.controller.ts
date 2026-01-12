import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
  Logger,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '../payments/payments.service';
import { AuditService } from '../audit/audit.service';
import { CinetPayHelper } from '../common/utils/cinetpay.helper';
import { PayDunyaHelper } from '../common/utils/paydunya.helper';
import { PayDunyaWebhookDto } from './dto/paydunya-webhook.dto';
import { PaymentStatus } from '../payments/entities/payment.entity';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private paymentsService: PaymentsService,
    private auditService: AuditService,
    private configService: ConfigService,
  ) {}

  @Post('cinetpay')
  @HttpCode(HttpStatus.OK)
  async handleCinetPayWebhook(
    @Body() payload: any,
    @Headers('x-cinetpay-signature') signature: string,
  ) {
    // Verify webhook signature
    const secretKey = this.configService.get('CINETPAY_SECRET_KEY');
    
    if (signature) {
      const isValid = CinetPayHelper.verifyWebhookSignature(
        payload,
        signature,
        secretKey,
      );

      if (!isValid) {
        this.logger.warn('Invalid webhook signature received');
        await this.auditService.log({
          action: 'webhook_signature_invalid',
          metadata: { transaction_id: payload.transaction_id },
        });
        throw new UnauthorizedException('Invalid webhook signature');
      }
    } else {
      this.logger.warn('Webhook received without signature');
    }

    const { transaction_id, status, amount, customer_id } = payload;

    // Log webhook received
    await this.auditService.log({
      action: 'webhook_received',
      metadata: {
        provider: 'cinetpay',
        transaction_id,
        status,
        amount,
      },
    });

    try {
      if (status === 'ACCEPTED') {
        await this.paymentsService.completePayment(transaction_id, payload);

        await this.auditService.log({
          user_id: customer_id,
          action: 'payment_completed',
          metadata: { transaction_id, amount },
        });

        return { success: true, message: 'Payment processed successfully' };
      } else if (status === 'REFUSED') {
        await this.paymentsService.failPayment(transaction_id);

        await this.auditService.log({
          user_id: customer_id,
          action: 'payment_failed',
          metadata: { transaction_id, amount, status },
        });

        return { success: true, message: 'Payment failure recorded' };
      }

      return { success: true, message: 'Webhook processed' };
    } catch (error) {
      await this.auditService.log({
        action: 'webhook_processing_error',
        metadata: {
          transaction_id,
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * MINIMAL PayDunya IPN - For API Key Registration
   * Simple endpoint to register with PayDunya to get API keys
   * Just returns 200 OK - no processing logic yet
   * 
   * PUBLIC URL for PayDunya: https://yourdomain.com/api/paydunya/ipn
   */
  @Post('paydunya/ipn')
  @HttpCode(HttpStatus.OK)
  async handlePayDunyaIPNMinimal(@Body() payload: any) {
    this.logger.log('📨 PayDunya IPN received (minimal endpoint for registration)');
    this.logger.debug(`Payload: ${JSON.stringify(payload)}`);
    
    // Log to audit for tracking
    await this.auditService.log({
      action: 'paydunya_ipn_minimal_received',
      metadata: payload,
    });

    // Return 200 OK as required by PayDunya
    return { success: true, message: 'OK' };
  }

  /**
   * FULL PayDunya IPN (Instant Payment Notification) Endpoint
   * This endpoint receives real-time payment notifications from PayDunya
   * 
   * CRITICAL REQUIREMENTS:
   * 1. Server-side verification REQUIRED (no trust in frontend)
   * 2. Idempotency - prevent duplicate processing
   * 3. Status mapping - PayDunya → internal statuses
   * 4. Subscription activation only AFTER verification
   * 5. Comprehensive logging for debugging
   * 6. Security - validate signature, amount, currency
   * 
   * @param payload - PayDunya webhook payload
   * @param signature - PayDunya signature header for verification
   * @returns Success response (HTTP 200 OK)
   */
  @Post('paydunya/ipn/full')
  @HttpCode(HttpStatus.OK)
  async handlePayDunyaIPNFull(
    @Body() payload: PayDunyaWebhookDto,
    @Headers('x-paydunya-signature') signature: string,
    @Headers('paydunya-signature') altSignature: string,
  ) {
    const startTime = Date.now();
    const actualSignature = signature || altSignature;

    // ============================================
    // STEP 1: LOG INCOMING IPN REQUEST
    // ============================================
    this.logger.log('📨 PayDunya IPN received');
    this.logger.debug(`Payload: ${JSON.stringify(payload)}`);

    await this.auditService.log({
      action: 'paydunya_ipn_received',
      metadata: {
        status: payload.status,
        transaction_id: payload.transaction_id,
        invoice_token: payload.invoice_token || payload.token,
        amount: payload.amount,
        currency: payload.currency,
        hasSignature: !!actualSignature,
      },
    });

    try {
      // ============================================
      // STEP 2: VERIFY WEBHOOK SIGNATURE
      // ============================================
      const secretKey = this.configService.get('PAYDUNYA_SECRET_KEY');

      if (actualSignature && secretKey) {
        const isValidSignature = PayDunyaHelper.verifyWebhookSignature(
          payload,
          actualSignature,
          secretKey,
        );

        if (!isValidSignature) {
          this.logger.warn('⚠️  Invalid PayDunya webhook signature');
          await this.auditService.log({
            action: 'paydunya_signature_invalid',
            metadata: {
              transaction_id: payload.transaction_id,
              invoice_token: payload.invoice_token || payload.token,
            },
          });
          throw new UnauthorizedException('Invalid webhook signature');
        }

        this.logger.log('✅ Signature verified');
      } else {
        this.logger.warn('⚠️  No signature provided - proceeding with API verification');
      }

      // ============================================
      // STEP 3: EXTRACT TRANSACTION DATA
      // ============================================
      const invoiceId = PayDunyaHelper.extractInvoiceId(payload);
      const transactionId = payload.transaction_id;
      const paydunyaStatus = payload.status?.toLowerCase();

      if (!transactionId) {
        this.logger.error('❌ Missing transaction_id in payload');
        throw new BadRequestException('Missing transaction_id');
      }

      this.logger.log(`📝 Processing transaction: ${transactionId}`);

      // ============================================
      // STEP 4: FIND PAYMENT IN DATABASE
      // ============================================
      const payment = await this.paymentsService.findByTransactionId(
        transactionId,
      );

      if (!payment) {
        this.logger.error(`❌ Payment not found: ${transactionId}`);
        await this.auditService.log({
          action: 'paydunya_payment_not_found',
          metadata: { transaction_id: transactionId },
        });
        throw new BadRequestException('Payment not found');
      }

      this.logger.log(`💳 Payment found: ${payment.id} | Status: ${payment.status}`);

      // ============================================
      // STEP 5: IDEMPOTENCY CHECK
      // ============================================
      if (
        payment.status === PaymentStatus.COMPLETED ||
        payment.status === PaymentStatus.FAILED ||
        payment.status === PaymentStatus.CANCELLED
      ) {
        this.logger.warn(`⚠️  Payment already processed: ${payment.status}`);
        await this.auditService.log({
          action: 'paydunya_duplicate_ipn',
          metadata: {
            transaction_id: transactionId,
            current_status: payment.status,
          },
        });

        return {
          success: true,
          message: 'Payment already processed (idempotent)',
        };
      }

      // ============================================
      // STEP 6: SERVER-SIDE VERIFICATION (CRITICAL)
      // ============================================
      let verificationResult = null;
      let verifiedStatus = paydunyaStatus;

      if (invoiceId) {
        this.logger.log('🔍 Verifying with PayDunya API...');
        const apiKey = this.configService.get('PAYDUNYA_API_KEY');

        verificationResult = await PayDunyaHelper.verifyTransaction(
          invoiceId,
          apiKey,
        );

        if (!verificationResult.success) {
          this.logger.error('❌ PayDunya API verification failed');
          await this.auditService.log({
            action: 'paydunya_verification_failed',
            metadata: {
              transaction_id: transactionId,
              error: verificationResult.error,
            },
          });

          // Don't process if verification fails
          return {
            success: false,
            message: 'Payment verification failed',
          };
        }

        // Use verified status from API
        verifiedStatus = verificationResult.data?.status?.toLowerCase() || paydunyaStatus;
        this.logger.log(`✅ API verification successful: ${verifiedStatus}`);

        // ============================================
        // STEP 7: VALIDATE AMOUNT & CURRENCY
        // ============================================
        const verifiedAmount = parseFloat(verificationResult.data?.invoice?.total_amount || payload.amount);
        const verifiedCurrency = verificationResult.data?.invoice?.currency || payload.currency;

        const isValidAmount = PayDunyaHelper.validateAmountAndCurrency(
          payment.amount,
          verifiedAmount,
          payment.currency || 'XOF',
          verifiedCurrency,
        );

        if (!isValidAmount) {
          this.logger.error('❌ Amount/Currency mismatch');
          await this.auditService.log({
            action: 'paydunya_amount_mismatch',
            metadata: {
              transaction_id: transactionId,
              expected_amount: payment.amount,
              received_amount: verifiedAmount,
              expected_currency: payment.currency,
              received_currency: verifiedCurrency,
            },
          });

          throw new BadRequestException('Amount or currency mismatch');
        }

        this.logger.log('✅ Amount & currency validated');
      }

      // ============================================
      // STEP 8: MAP STATUS & UPDATE DATABASE
      // ============================================
      const internalStatus = PayDunyaHelper.parsePaymentStatus(verifiedStatus);
      this.logger.log(`📊 Status mapping: ${verifiedStatus} → ${internalStatus}`);

      let updatedPayment;

      if (internalStatus === 'completed') {
        this.logger.log('✅ Processing successful payment...');

        updatedPayment = await this.paymentsService.processPayDunyaPayment(
          transactionId,
          {
            ...payload,
            verification: verificationResult?.data,
          },
          PaymentStatus.COMPLETED,
        );

        await this.auditService.log({
          user_id: payment.user_id,
          action: 'paydunya_payment_completed',
          metadata: {
            transaction_id: transactionId,
            amount: payment.amount,
            subscription_id: updatedPayment.subscription_id,
          },
        });

        this.logger.log('🎉 Payment completed & subscription activated!');
      } else if (internalStatus === 'failed') {
        this.logger.log('❌ Processing failed payment...');

        updatedPayment = await this.paymentsService.processPayDunyaPayment(
          transactionId,
          payload,
          PaymentStatus.FAILED,
        );

        await this.auditService.log({
          user_id: payment.user_id,
          action: 'paydunya_payment_failed',
          metadata: {
            transaction_id: transactionId,
            status: verifiedStatus,
          },
        });
      } else if (verifiedStatus === 'cancelled') {
        this.logger.log('🚫 Processing cancelled payment...');

        updatedPayment = await this.paymentsService.processPayDunyaPayment(
          transactionId,
          payload,
          PaymentStatus.CANCELLED,
        );

        await this.auditService.log({
          user_id: payment.user_id,
          action: 'paydunya_payment_cancelled',
          metadata: {
            transaction_id: transactionId,
          },
        });
      }

      // ============================================
      // STEP 9: LOG SUCCESS & RETURN 200 OK
      // ============================================
      const processingTime = Date.now() - startTime;
      this.logger.log(`✅ IPN processed successfully in ${processingTime}ms`);

      await this.auditService.log({
        user_id: payment.user_id,
        action: 'paydunya_ipn_processed',
        metadata: {
          transaction_id: transactionId,
          final_status: internalStatus,
          processing_time_ms: processingTime,
        },
      });

      // CRITICAL: Return 200 OK to PayDunya
      return {
        success: true,
        message: 'Payment processed successfully',
      };
    } catch (error) {
      // ============================================
      // STEP 10: ERROR HANDLING & LOGGING
      // ============================================
      this.logger.error('❌ PayDunya IPN processing error:', error);

      await this.auditService.log({
        action: 'paydunya_ipn_error',
        metadata: {
          transaction_id: payload.transaction_id,
          error: error.message,
          stack: error.stack,
        },
      });

      // Still return 200 OK to prevent retries for invalid data
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      // For unexpected errors, log but return success to prevent endless retries
      return {
        success: false,
        message: 'Error processing payment',
        error: error.message,
      };
    }
  }

  // TEST MODE - Remove in production
  @Get('test-payment-success')
  @HttpCode(HttpStatus.OK)
  async testPaymentSuccess(@Query('transaction_id') transactionId: string) {
    if (!transactionId) {
      return { error: 'transaction_id required' };
    }

    this.logger.warn('🧪 TEST MODE: Simulating successful payment webhook');
    this.logger.warn('Transaction ID: ' + transactionId);

    // Simulate successful payment webhook for testing
    const testPayload = {
      transaction_id: transactionId,
      status: 'ACCEPTED',
      amount: 16370, // 24.99 USD * 655 XOF
      customer_id: null,
    };

    try {
      await this.paymentsService.completePayment(transactionId, testPayload);
      
      await this.auditService.log({
        action: 'test_payment_completed',
        metadata: { transaction_id: transactionId },
      });

      return { 
        success: true, 
        message: 'Test payment completed successfully',
        transaction_id: transactionId 
      };
    } catch (error) {
      this.logger.error('Test payment error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // TEST MODE - PayDunya - Remove in production
  @Get('test-paydunya-success')
  @HttpCode(HttpStatus.OK)
  async testPayDunyaSuccess(@Query('transaction_id') transactionId: string) {
    if (!transactionId) {
      return { error: 'transaction_id required' };
    }

    this.logger.warn('🧪 TEST MODE: Simulating PayDunya successful payment IPN');
    this.logger.warn('Transaction ID: ' + transactionId);

    // Simulate successful PayDunya IPN for testing
    const testPayload: PayDunyaWebhookDto = {
      transaction_id: transactionId,
      invoice_token: 'test-invoice-' + Date.now(),
      status: 'completed',
      amount: 32740, // Example: 50 USD * 655 XOF
      currency: 'XOF',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
    };

    try {
      const result = await this.handlePayDunyaIPNFull(testPayload, null, null);
      
      return { 
        success: true, 
        message: 'Test PayDunya payment completed successfully',
        transaction_id: transactionId,
        result 
      };
    } catch (error) {
      this.logger.error('Test PayDunya payment error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}
