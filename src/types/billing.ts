export type BillingProvider = 'paddle' | 'lemonSqueezy' | 'manualEnterprise' | 'disabled';

export interface BillingConfig {
  provider: BillingProvider;
  isTestMode: boolean;
  currency: string;
}

export interface PaddlePlaceholderData {
  customerId: string | null;
  subscriptionId: string | null;
  checkoutId: string | null;
  transactionId: string | null;
  priceId: string | null;
  productId: string | null;
  status: string | null;
  billingInterval: "monthly" | "annual" | null;
  nextBillingDate: string | null;
  cancellationState: string | null;
  webhookAuditTrail: string[];
}

export interface PartnerCommissionData {
  referralCode: string | null;
  signupDate: string | null;
  commissionGenerated: boolean;
  providerGenericRef: string | null; // e.g., paddle_txn_xyz once paid
}
