export interface CheckoutSessionConfig {
  priceId: string;
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
  referralCode?: string | null;
}

export interface WebhookResult {
  success: boolean;
  type?: string;
  data?: any;
  error?: string;
}

export interface BillingProvider {
  /**
   * Generates a checkout session or returns a URL to the provider's hosted checkout.
   */
  createCheckoutSession(config: CheckoutSessionConfig): Promise<string | { url: string }>;

  /**
   * Processes an incoming webhook securely.
   */
  handleWebhook(payload: any, signature: string): Promise<WebhookResult>;

  /**
   * Verifies the status of a specific transaction with the provider.
   */
  verifyTransaction(transactionId: string): Promise<boolean>;
}
