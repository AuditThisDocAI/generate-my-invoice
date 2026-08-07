import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import Stripe from "stripe";
import crypto from "crypto";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
-import { extractDocument, generateAudit } from "./";
+import { extractDocument, generateAudit } from "./server/services/documentExtractor";

dotenv.config();

// Initialize Firebase Admin safely
let firestore: any = null;
try {
projectId: "auditthisdocai"
  firestore = getFirestore();
  
} catch (err) {
  console.warn("Failed to initialize Firebase Admin:", err);
}

export const app = express();

// Secure webhook verification receiver from Stripe (must be mounted before general json bodypars)
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    console.log("ℹ️ Stripe webhook signature verification skipped due to missing credentials. Processing simulated status event safely.");
    return res.json({ received: true, verified: false, simulation: true, status: "completed" });
  }

  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("Stripe secret key missing.");
    }
    const stripe = new Stripe(key);
    // Verify signatures securely
    const event = stripe.webhooks.constructEvent(req.body, String(sig), endpointSecret);
    console.log(`✅ Webhook verified successfully: ${event.type}`);

    // Track payment event details
    if (event.type === "charge.succeeded") {
      const charge = event.data.object as Stripe.Charge;
      console.log(`💸 Charge succeeded background verification: ${charge.id} for $${charge.amount / 100}`);
    } else if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.log(`💳 Payment intent succeeded background verification: ${intent.id} value of $${intent.amount / 100}`);
    } else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const email = sub.metadata?.email;
      if (email && firestore) {
         try {
           const usersRef = firestore.collection("users");
           const q = await usersRef.where("email", "==", email).get();
           if (!q.empty) {
             const userDoc = q.docs[0];
             await userDoc.ref.update({
               subscriptionType: sub.metadata?.payMethod === "debit_order" ? "debit_order" : "card",
               paymentTier: sub.metadata?.plan || "professional",
               isPro: true,
               debitOrderEnabled: sub.metadata?.payMethod === "debit_order",
               stripeSubscriptionId: sub.id,
               stripeCustomerId: sub.customer as string,
             });
             console.log(`✅ Updated Firebase user ${email} from webhook.`);
           }
         } catch(e) {
           console.error("Firebase update error from webhook:", e);
         }
      }

    res.json({ received: true, verified: true });
  } catch (err: any) {
    console.error(`❌ Webhook Signature Error: ${err.message}`);
    res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }
});
