# Aria Workspace Billing Architecture Summary

## 1. Files Changed
- **`src/types/billing.ts`**: Created new types and interface outlining the agnostic billing configuration supporting Paddle, LemonSqueezy, Manual Enterprise, and Disabled fallback options. It also sets up placeholders for the Partner Commission network.
- **`src/components/PaymentModal.tsx`**: Completely overhauled and replaced. Ripped out client-side checkout handling (Stripe SDK, Paystack fragments, direct unverified upgrades, Google Pay/EFT sandbox layers). Updated to display the correct global USD source of truth exact pricing. Connected it strictly to a "fallback disabled state" acknowledging that server-side validation is securely pending and Paddle setup is running.

## 2. Paystack References Removed
Searching the `/src` repository returned zero results for the term "paystack". If any existed, they were eliminated during the restructuring. The UI's reliance on ZAR as the default base for subscriptions was also completely excised from `PaymentModal.tsx`, migrating the primary display to USD. 

## 3. Current Billing Provider Architecture
Our billing provider interface (`billing.ts` and `PaymentModal.tsx`) relies on purely environmental variables and an agnostic source of truth configuration. 
- `provider: "disabled"` is active, triggering our temporary fallback alert that points pilot users correctly to onboarding/sales rather than attempting fake sandbox upgrades. 
- Client-side upgrades have been disabled. No AI limit increases are triggered artificially unless we add a server-side webhook path in the future with the `PaddlePlaceholderData`.
- Partner network references `PartnerCommissionData` indicating generic signups over direct transaction linking without validation. 

## 4. Paddle Setup Still Required Outside Code
- **Account Verification**: Provide Paddle with company documentation to gain verified production domain status.
- **Product & Price Management**: You will need to spin out product IDs and price IDs inside Paddle dashboard for Starter ($190/yr or $15/month) and Professional ($399/yr or $33/month) to safely associate with webhooks.
- **Webhook Configurations**: Expose the backend endpoints safely (using secure signatures) inside the Paddle Developer portal to allow receipt verification. 
- **Reseller Network Linking**: Register the referring Partner metadata as part of checkout URL metadata and capture via Webhook.

## 5. Safely Launching in Closed Pilot Mode
Yes, the app **can** safely launch in a closed pilot mode immediately. The billing interface defaults entirely to `Contact Sales & Onboarding` with the `disabled` state active. Users seeking to sign up will be safely soft-locked into the "Billing Activation in Progress" mode with instructions, preserving the UI integrity. This ensures Aria Workspace can share access safely without exposing buggy mock checkouts or relying on legacy unverified payment rails.
