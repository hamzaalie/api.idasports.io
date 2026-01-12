import * as crypto from 'crypto';
import axios from 'axios';

export class PayDunyaHelper {
  private static readonly API_BASE_URL = 'https://app.paydunya.com/api/v1';

  /**
   * Verify PayDunya webhook signature
   * @param payload - The webhook payload
   * @param signature - The signature from PayDunya headers
   * @param secretKey - Your PayDunya secret/token key
   * @returns boolean - True if signature is valid
   */
  static verifyWebhookSignature(
    payload: any,
    signature: string,
    secretKey: string,
  ): boolean {
    try {
      // PayDunya uses HMAC SHA256 for webhook signatures
      const payloadString = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(payloadString)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature.toLowerCase()),
        Buffer.from(expectedSignature.toLowerCase()),
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify payment transaction with PayDunya API
   * @param invoiceToken - The invoice/transaction token from PayDunya
   * @param apiKey - Your PayDunya API key (Master Key)
   * @returns Promise<PayDunyaVerificationResponse> - Transaction verification data
   */
  static async verifyTransaction(
    invoiceToken: string,
    apiKey: string,
  ): Promise<PayDunyaVerificationResponse> {
    try {
      const response = await axios.get(
        `${this.API_BASE_URL}/checkout-invoice/confirm/${invoiceToken}`,
        {
          headers: {
            'PAYDUNYA-MASTER-KEY': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds timeout
        },
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Parse PayDunya payment status to internal payment status
   * @param paydunyaStatus - Status from PayDunya (completed, failed, cancelled, pending)
   * @returns string - Internal payment status
   */
  static parsePaymentStatus(paydunyaStatus: string): string {
    const statusMap: { [key: string]: string } = {
      completed: 'completed',
      failed: 'failed',
      cancelled: 'failed',
      pending: 'pending',
    };

    return statusMap[paydunyaStatus?.toLowerCase()] || 'pending';
  }

  /**
   * Validate amount and currency match
   * @param expectedAmount - Expected payment amount
   * @param actualAmount - Actual payment amount received
   * @param expectedCurrency - Expected currency code
   * @param actualCurrency - Actual currency code received
   * @returns boolean - True if amounts and currencies match
   */
  static validateAmountAndCurrency(
    expectedAmount: number,
    actualAmount: number,
    expectedCurrency: string,
    actualCurrency: string,
  ): boolean {
    // Allow 1% tolerance for currency conversion rounding
    const tolerance = expectedAmount * 0.01;
    const amountMatch = Math.abs(expectedAmount - actualAmount) <= tolerance;
    const currencyMatch =
      expectedCurrency.toUpperCase() === actualCurrency.toUpperCase();

    return amountMatch && currencyMatch;
  }

  /**
   * Extract invoice/transaction ID from PayDunya response
   * @param payload - PayDunya webhook payload
   * @returns string - Invoice/transaction ID
   */
  static extractInvoiceId(payload: any): string {
    // PayDunya may send invoice_token, token, or invoice_id
    return (
      payload.invoice_token ||
      payload.token ||
      payload.invoice_id ||
      payload.transaction_id ||
      ''
    );
  }
}

export interface PayDunyaVerificationResponse {
  success: boolean;
  data?: any;
  error?: string;
}
