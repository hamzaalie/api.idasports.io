import * as crypto from 'crypto';

export class CinetPayHelper {
  /**
   * Verify CinetPay webhook signature
   * @param payload - The webhook payload
   * @param signature - The signature from CinetPay headers
   * @param secretKey - Your CinetPay secret key
   * @returns boolean - True if signature is valid
   */
  static verifyWebhookSignature(
    payload: any,
    signature: string,
    secretKey: string,
  ): boolean {
    // CinetPay typically uses HMAC SHA256 for webhook signatures
    // The exact implementation depends on CinetPay's documentation
    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payloadString)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Generate payment signature for CinetPay API calls
   * @param data - Payment data
   * @param apiKey - CinetPay API key
   * @param siteId - CinetPay site ID
   * @returns string - Generated signature
   */
  static generatePaymentSignature(
    data: {
      amount: number;
      currency: string;
      transactionId: string;
    },
    apiKey: string,
    siteId: string,
  ): string {
    const signatureString = `${siteId}${data.amount}${data.currency}${data.transactionId}${apiKey}`;
    return crypto.createHash('sha256').update(signatureString).digest('hex');
  }

  /**
   * Parse CinetPay webhook status to internal payment status
   * @param cinetpayStatus - Status from CinetPay
   * @returns string - Internal payment status
   */
  static parsePaymentStatus(cinetpayStatus: string): string {
    const statusMap: { [key: string]: string } = {
      ACCEPTED: 'completed',
      REFUSED: 'failed',
      PENDING: 'pending',
      CANCELLED: 'failed',
    };

    return statusMap[cinetpayStatus] || 'pending';
  }
}
