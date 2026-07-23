import { BillingProvider, CheckoutSessionConfig, WebhookResult } from "./billing";
import { PaddlePlaceholderData } from "../types/billing";
import Stripe from "stripe";

/**
 * Paddle Provider Implementation
 * Note: No secret keys should be exposed to the client. This service should ideally
 * interact with a secure server environment or act as an abstraction that delegates
 * to secure API routes where secrets like PADDLE_API_KEY and PADDLE_WEBHOOK_SECRET live.
 */
export class PaddleProvider implements BillingProvider {
  private environment: "sandbox" | "production";
  private sellerId: string;
  private clientSideToken: string;

  constructor() {
    // Rely exclusively on environment variables for configuration.
    // Client-safe configuration
    this.environment = (typeof process !== "undefined" && process.env.PADDLE_ENV) as "sandbox" | "production" || "sandbox";
    this.sellerId = typeof process !== "undefined" ? process.env.PADDLE_SELLER_ID || "" : "";
    this.clientSideToken = typeof process !== "undefined" ? process.env.PADDLE_CLIENT_TOKEN || "" : "";
  }

  async createCheckoutSession(config: CheckoutSessionConfig): Promise<string | { url: string }> {
    console.log(`[PaddleProvider/Stripe] Creating checkout session for user ${config.userId}`);
    
    // As requested, using Stripe for subscription payment processing
    const stripeKey = typeof process !== 'undefined' ? process.env.STRIPE_SECRET_KEY : '';
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is missing from the environment");
    }

    const stripe = new Stripe(stripeKey);

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: config.email,
        line_items: [
          {
            price: config.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: config.successUrl || 'http://localhost:3000/success',
        cancel_url: config.cancelUrl || 'http://localhost:3000/cancel',
        client_reference_id: config.userId,
      });

      return { url: session.url || "" };
    } catch (err: any) {
      console.error("[Stripe] Failed to create checkout session:", err);
      throw err;
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<WebhookResult> {
    console.log("[PaddleProvider] Processing Webhook payload");
    
    // In actual server-side implementation, verify the signature using Paddle Webhook Secret
    // const secret = process.env.PADDLE_WEBHOOK_SECRET;
    
    return Promise.resolve({
      success: true,
      type: payload?.meta?.event_name || 'unknown_event',
      data: payload?.data || {}
    });
  }

  async verifyTransaction(transactionId: string): Promise<boolean> {
    console.log(`[PaddleProvider] Verifying transaction ${transactionId}`);
    
    // Placeholder for server API call to Paddle to check transaction status
    // fetch(`https://api.paddle.com/transactions/${transactionId}`, { headers: { Authorization: `Bearer ${process.env.PADDLE_API_KEY}` }})
    
    return Promise.resolve(true); // Always true for placeholder
  }

  /**
   * Helper method to extract Paddle payload into our generic placeholder format
   */
  parsePaddleData(payloadData: any): PaddlePlaceholderData {
    return {
      customerId: payloadData?.customer_id || null,
      subscriptionId: payloadData?.subscription_id || null,
      checkoutId: payloadData?.checkout_id || null,
      transactionId: payloadData?.id || null,
      priceId: payloadData?.items?.[0]?.price?.id || null,
      productId: payloadData?.items?.[0]?.price?.product_id || null,
      status: payloadData?.status || null,
      billingInterval: payloadData?.items?.[0]?.price?.billing_cycle?.interval || null,
      nextBillingDate: payloadData?.next_billed_at || null,
      cancellationState: payloadData?.scheduled_change?.action === "cancel" ? "scheduled" : null,
      webhookAuditTrail: [`Received Paddle event at ${new Date().toISOString()}`]
    };
  }
}
