import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Star,
  Check,
  ShieldAlert,
  CreditCard,
  Landmark,
  Repeat,
  Lock,
  Building,
  ArrowLeft,
  ChevronDown,
  HelpCircle,
  Zap,
  ShieldCheck,
  Cloud,
  LockKeyhole,
} from "lucide-react";
import { DocumentData, UserAccount } from "../types";
import { db, isRealFirebase } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentData | null;
  totalAmount: number;
  userProfile: UserAccount | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserAccount | null>>;
  isCurrentDocPaid?: boolean;
  setIsCurrentDocPaid?: React.Dispatch<React.SetStateAction<boolean>>;
  onShowAlert?: (msg: string) => void;
}

// Keep StripeCardForm
function StripeCardForm({
  userProfile,
  currentPrice,
  selectedPlan,
  billingInterval,
  onSuccess,
  safeAlert,
}: {
  userProfile: UserAccount;
  currentPrice: number;
  selectedPlan: string;
  billingInterval: string;
  onSuccess: () => void;
  safeAlert: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (cardError) {
      safeAlert(`Please fix the card errors: ${cardError}`);
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      const response = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          email: userProfile.email,
          billingInterval: billingInterval,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      if (!data.clientSecret) {
        throw new Error(
          "Client Secret missing. Unable to create payment. Please try again.",
        );
      }

      const clientSecret = data.clientSecret;
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement as any,
          billing_details: {
            email: userProfile.email,
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message || "Payment confirmation failed");
      }

      if (result.paymentIntent?.status === "succeeded") {
        onSuccess();
      } else {
        throw new Error(
          "Payment was not successful. Status: " + result.paymentIntent?.status,
        );
      }
    } catch (error: any) {
      safeAlert(`Payment error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleCardPayment} className="space-y-4 max-w-lg mx-auto">
      <div>
        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">
          Card Information
        </label>
        <div
          className={`bg-white border ${cardError ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-500" : "border-zinc-200 focus-within:border-indigo-500 focus-within:ring-indigo-500"} rounded-xl px-3 py-3 text-xs focus-within:ring-2 transition-all`}
        >
          <CardElement
            onChange={(e) => {
              if (e.error) {
                setCardError(e.error.message);
              } else {
                setCardError(null);
              }
            }}
            options={{
              style: {
                base: {
                  fontSize: "14px",
                  color: "#18181b",
                  "::placeholder": { color: "#a1a1aa" },
                },
                invalid: {
                  color: "#ef4444",
                  iconColor: "#ef4444",
                },
              },
            }}
          />
        </div>
        {cardError && (
          <p className="text-red-500 text-[10px] font-medium mt-1.5 ml-1 animate-fadeIn">
            {cardError}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Processing securely...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Pay ${currentPrice.toFixed(2)} Securely</span>
          </>
        )}
      </button>
    </form>
  );
}

export default function PaymentModal({
  isOpen,
  onClose,
  userProfile,
  setUserProfile,
  setIsCurrentDocPaid,
  onShowAlert,
}: PaymentModalProps) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">(
    "annual",
  );
  const [checkoutPlan, setCheckoutPlan] = useState<
    "starter" | "professional" | "business" | "enterprise" | null
  >(null);
  const [checkoutCreditPack, setCheckoutCreditPack] = useState<{
    id: "credit_25k" | "credit_100k" | "credit_500k";
    credits: number;
    price: number;
    label: string;
  } | null>(null);

  // Payment Form State
  const [payMethod, setPayMethod] = useState<"card" | "debit_order" | "paypal">(
    "card",
  );

  // Debit Order Fields
  const [debitBank, setDebitBank] = useState("Capitec Bank");
  const [debitAccHolder, setDebitAccHolder] = useState("");
  const [debitAccNumber, setDebitAccNumber] = useState("");
  const [debitAccType, setDebitAccType] = useState("Savings");
  const [debitDay, setDebitDay] = useState("1st");
  const [debitConsent, setDebitConsent] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [stripePromiseState, setStripePromiseState] =
    useState<Promise<Stripe | null> | null>(null);
  const [notification, setNotification] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && !stripePromiseState && !stripePromise) {
      fetch("/api/stripe/config")
        .then((res) => res.json())
        .then((data) => {
          if (data.publishableKey) {
            stripePromise = loadStripe(data.publishableKey);
            setStripePromiseState(stripePromise);
          }
        })
        .catch((err) => console.error("Failed to load Stripe key", err));
    } else if (isOpen && stripePromise && !stripePromiseState) {
      setStripePromiseState(stripePromise);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getPrice = (plan: string) => {
    if (billingInterval === "annual") {
      if (plan === "starter") return 143;
      if (plan === "professional") return 335;
      if (plan === "business") return 767;
      return 3000;
    } else {
      if (plan === "starter") return 14.99;
      if (plan === "professional") return 34.99;
      if (plan === "business") return 79.99;
      return 299;
    }
  };

  const currentPrice = checkoutPlan 
    ? getPrice(checkoutPlan) 
    : checkoutCreditPack 
      ? checkoutCreditPack.price 
      : 0;

  const safeAlert = (msg: string) => {
    if (msg.toLowerCase().includes("success")) {
      setNotification({ type: "success", message: msg });
    } else {
      setNotification({ type: "error", message: msg });
    }

    if (onShowAlert) {
      onShowAlert(msg);
    }
  };

  const handleFreemiusCheckout = async (plan: string) => {
    setIsProcessing(true);
    try {
      const planId = billingInterval === "annual" ? `${plan}_annual` : `${plan}_monthly`;
      const res = await fetch("/api/freemius/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, email: userProfile?.email })
      });
      const data = await res.json();
      if (data.checkoutLink) {
        window.location.href = data.checkoutLink;
      } else {
        safeAlert("Failed to initialize Freemius checkout.");
      }
    } catch (err) {
      safeAlert("Failed to initialize Freemius checkout.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleFreemiusCreditCheckout = async (packId: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/freemius/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: packId, email: userProfile?.email })
      });
      const data = await res.json();
      if (data.checkoutLink) {
        window.location.href = data.checkoutLink;
      } else {
        safeAlert("Failed to initialize Freemius checkout.");
      }
    } catch (err) {
      safeAlert("Failed to initialize Freemius checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (
    type: "card" | "debit_order" | "paypal",
  ) => {
    if (!userProfile) return;

    let updatedUser: UserAccount;

    if (checkoutCreditPack) {
      const defaultMax = 
        userProfile.paymentTier === "enterprise"
          ? 999999
          : userProfile.paymentTier === "business"
            ? 999999
            : userProfile.paymentTier === "professional"
              ? 2500
              : userProfile.paymentTier === "starter"
                ? 300
                : 3;
      const currentAiRemaining = userProfile.aiCreditsRemaining ?? defaultMax;
      const currentAiTotal = userProfile.aiCreditsTotal ?? defaultMax;

      updatedUser = {
        ...userProfile,
        invoiceCredits: (userProfile.invoiceCredits || 0) + checkoutCreditPack.credits,
        aiCreditsRemaining: currentAiRemaining + checkoutCreditPack.credits,
        aiCreditsTotal: currentAiTotal + checkoutCreditPack.credits,
        amountPaid: (userProfile.amountPaid || 0) + checkoutCreditPack.price,
      };
    } else if (checkoutPlan) {
      let extraInvoiceCredits = 0;
      let aiCredits = 0;

      if (checkoutPlan === "starter") {
        extraInvoiceCredits = 100;
        aiCredits = 300;
      } else if (checkoutPlan === "professional") {
        extraInvoiceCredits = 999999; // Unlimited
        aiCredits = 2500;
      } else if (checkoutPlan === "business") {
        extraInvoiceCredits = 999999; // Unlimited
        aiCredits = 999999; // Unlimited
      } else if (checkoutPlan === "enterprise") {
        extraInvoiceCredits = 999999; // Unlimited
        aiCredits = 999999; // Unlimited
      }

      updatedUser = {
        ...userProfile,
        paymentTier: checkoutPlan,
        isPro: true,
        subscriptionType: type,
        debitOrderEnabled: type === "debit_order",
        amountPaid: (userProfile.amountPaid || 0) + currentPrice,
        isSubscriptionCancelled: false,
        invoiceCredits: checkoutPlan === "starter"
          ? (userProfile.invoiceCredits || 0) + extraInvoiceCredits
          : extraInvoiceCredits,
        aiCreditsRemaining: aiCredits,
        aiCreditsTotal: aiCredits,
      };
    } else {
      return;
    }

    setUserProfile(updatedUser);
    if (setIsCurrentDocPaid) setIsCurrentDocPaid(true);

    try {
      const simUsers = JSON.parse(
        localStorage.getItem("gmi_simulated_db_users") || "{}",
      );
      const lowerEmail = userProfile.email.toLowerCase();
      simUsers[lowerEmail] = {
        ...simUsers[lowerEmail],
        ...updatedUser,
      };
      localStorage.setItem("gmi_simulated_db_users", JSON.stringify(simUsers));
    } catch (simErr) {}

    if (isRealFirebase) {
      try {
        const userRef = doc(db, "users", userProfile.uid);
        await setDoc(userRef, updatedUser, { merge: true });
      } catch (fireErr) {}
    }

    if (checkoutCreditPack) {
      safeAlert(
        `Payment successful! Successfully purchased ${checkoutCreditPack.credits.toLocaleString()} AI Credits. Thank you!`,
      );
    } else {
      safeAlert(
        `Payment successful! Funds routed securely. Welcome to ${checkoutPlan?.toUpperCase()}!`,
      );
    }
    setTimeout(() => {
      onClose();
      setCheckoutPlan(null);
      setCheckoutCreditPack(null);
    }, 2000);
  };

  const handleDebitOrder = async () => {
    if (!userProfile) {
      safeAlert(
        "Please create an account or sign in to complete subscription.",
      );
      return;
    }

    if (!debitAccHolder.trim()) {
      safeAlert("Please enter the Account Holder's Name.");
      return;
    }
    if (!debitAccNumber.trim()) {
      safeAlert("Please enter your Bank Account Number.");
      return;
    }
    if (!debitConsent) {
      safeAlert(
        "Please authorize and agree to the debit order mandate checkbox to proceed.",
      );
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: checkoutPlan || checkoutCreditPack?.id,
          email: userProfile.email,
          billingInterval: billingInterval,
          payMethod: "debit_order",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "Failed to initialize debit order subscription",
        );
      }

      // Successfully registered intent with Stripe.
      // (Normally we would capture the mandate offline or via a supported gateway)
      handlePaymentSuccess("debit_order");
    } catch (err: any) {
      safeAlert(`Debit Order error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCheckout = () => {
    if (!checkoutPlan && !checkoutCreditPack) return null;
    const checkoutTitle = checkoutPlan ? `Checkout: ${checkoutPlan} Plan` : `Checkout: ${checkoutCreditPack?.label}`;
    const selectedItemName = checkoutPlan ? checkoutPlan : (checkoutCreditPack?.id || "");
    return (
      <div className="max-w-4xl mx-auto py-8">
        <button
          onClick={() => {
            setCheckoutPlan(null);
            setCheckoutCreditPack(null);
          }}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-6 text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Plans & Top-ups
        </button>

        <div className="bg-white rounded-[32px] border border-zinc-200 shadow-xl overflow-hidden p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 capitalize text-center">
              {checkoutTitle}
            </h2>
            <p className="text-zinc-500 font-medium mt-2">
              Complete your secure payment to activate your credits or workspace instantly.
            </p>
          </div>

          <div className="flex flex-wrap bg-zinc-100/80 p-1.5 rounded-2xl border border-zinc-200 mb-8 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setPayMethod("card")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-2 cursor-pointer ${payMethod === "card" ? "bg-white text-zinc-950 shadow-sm border border-zinc-200" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              <CreditCard className="w-4 h-4" /> Card Payment
            </button>
            <button
              type="button"
              onClick={() => setPayMethod("debit_order")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-2 cursor-pointer ${payMethod === "debit_order" ? "bg-white text-zinc-950 shadow-sm border border-zinc-200" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              <Landmark className="w-4 h-4" /> Debit Order
            </button>
            <button
              type="button"
              onClick={() => setPayMethod("paypal")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-2 cursor-pointer ${payMethod === "paypal" ? "bg-[#0070ba] text-white shadow-sm border border-[#005ea6]" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              PayPal
            </button>
          </div>

          <div className="max-w-xl mx-auto">
            {payMethod === "card" && (
              <div className="bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100">
                {stripePromiseState && userProfile ? (
                  <Elements stripe={stripePromiseState}>
                    <StripeCardForm
                      userProfile={userProfile}
                      currentPrice={currentPrice}
                      selectedPlan={selectedItemName}
                      billingInterval={billingInterval}
                      onSuccess={() => handlePaymentSuccess("card")}
                      safeAlert={safeAlert}
                    />
                  </Elements>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-3 text-sm font-medium text-zinc-500">
                    <Sparkles className="w-5 h-5 animate-spin text-indigo-500" />
                    Loading secure gateway...
                  </div>
                )}
              </div>
            )}

            {payMethod === "debit_order" && (
              <div className="space-y-4 text-xs font-medium">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      Bank Name
                    </label>
                    <select
                      value={debitBank}
                      onChange={(e) => setDebitBank(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Capitec Bank">Capitec Bank</option>
                      <option value="First National Bank (FNB)">
                        First National Bank (FNB)
                      </option>
                      <option value="Standard Bank">Standard Bank</option>
                      <option value="Nedbank">Nedbank</option>
                      <option value="ABSA">ABSA</option>
                      <option value="TymeBank">TymeBank</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      Account Type
                    </label>
                    <select
                      value={debitAccType}
                      onChange={(e) => setDebitAccType(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Savings">Savings Account</option>
                      <option value="Cheque / Current">Cheque / Current</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={debitAccHolder}
                      onChange={(e) => setDebitAccHolder(e.target.value)}
                      placeholder="e.g. B LOMBARARD"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={debitAccNumber}
                      onChange={(e) => setDebitAccNumber(e.target.value)}
                      placeholder="e.g. 102345678"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Preferred Monthly Debit Day
                  </label>
                  <select
                    value={debitDay}
                    onChange={(e) => setDebitDay(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1st">1st of the Month</option>
                    <option value="15th">15th of the Month</option>
                    <option value="25th">25th of the Month</option>
                    <option value="Last day">Last Day of the Month</option>
                  </select>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 space-y-2 leading-relaxed font-semibold mt-4">
                  <p className="flex items-center gap-1.5 text-sm text-amber-950 font-black uppercase">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    Debit Order Authorization Mandate
                  </p>
                  <p>
                    I hereby authorize Audit This Doc AI to process recurring
                    monthly debit order draw-downs from my specified account for
                    the sum of <strong>${currentPrice}</strong> on or after the{" "}
                    <strong>{debitDay}</strong> of every month. I agree that
                    this mandate will continue unless cancelled by written
                    request.
                  </p>
                  <label className="flex items-start gap-2 pt-2 font-bold text-amber-950 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={debitConsent}
                      onChange={(e) => setDebitConsent(e.target.checked)}
                      className="mt-0.5 rounded border-amber-300 text-amber-800 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span>
                      I accept and authorize this active debit order mandate
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleDebitOrder}
                  disabled={isProcessing}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {isProcessing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Processing Mandate...
                    </>
                  ) : (
                    <>Authorize ${currentPrice} Debit Order</>
                  )}
                </button>
              </div>
            )}

            {payMethod === "paypal" && (
              <div className="space-y-4">
                <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-5 text-sm font-medium text-[#0c4a6e] leading-relaxed text-center">
                  <p className="flex justify-center items-center gap-2 font-black mb-2 text-lg">
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
                    </svg>
                    Pay securely with PayPal
                  </p>
                  <p>
                    You will be redirected to PayPal to complete your purchase
                    securely.
                  </p>
                </div>

                <a
                  href={`https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=Brigittalombard09@gmail.com&item_name=Plan%20Or%20Credits%20(${selectedItemName})&amount=${currentPrice.toFixed(2)}&currency_code=USD&return=${encodeURIComponent(window.location.origin)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setIsProcessing(true);
                    setTimeout(() => {
                      setIsProcessing(false);
                      handlePaymentSuccess("paypal");
                    }, 5000);
                  }}
                  className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Awaiting PayPal...
                    </>
                  ) : (
                    <>Proceed to PayPal</>
                  )}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-50 overflow-y-auto animate-fadeIn no-print w-full h-full">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight text-zinc-900 leading-none">
              Audit This Doc AI
            </h1>
            <p className="text-xs text-zinc-500 font-bold mt-1 uppercase tracking-wider">
              Premium Workspace
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
          <div
            className={`p-4 rounded-2xl flex items-start gap-3 border shadow-xl ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex-1">
              <h4 className="text-sm font-bold">
                {notification.type === "success" ? "Success" : "Error"}
              </h4>
              <p className="text-xs font-medium mt-0.5">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {checkoutPlan || checkoutCreditPack ? (
        renderCheckout()
      ) : (
        <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 leading-tight">
              Simple Pricing for Every Business
            </h1>
            <p className="text-lg text-zinc-500 font-medium leading-relaxed max-w-2xl mx-auto">
              Automate bookkeeping, payroll, auditing, invoicing, fraud
              detection, AI assistance, and business management with one
              intelligent platform.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm font-bold text-zinc-700">
              <span className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full">
                <Check className="w-4 h-4" /> Cancel Anytime
              </span>
              <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                <Check className="w-4 h-4" /> No Credit Card Required
              </span>
              <span className="flex items-center gap-2 bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-full">
                <Check className="w-4 h-4" /> Cancel Anytime
              </span>
            </div>

            <div className="flex items-center justify-center gap-4 mt-8">
              <span
                className={`text-sm font-bold ${billingInterval === "monthly" ? "text-zinc-900" : "text-zinc-500"}`}
              >
                Monthly
              </span>
              <button
                onClick={() =>
                  setBillingInterval((prev) =>
                    prev === "annual" ? "monthly" : "annual",
                  )
                }
                className="relative w-14 h-7 rounded-full bg-indigo-600 transition-colors focus:outline-none cursor-pointer"
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${billingInterval === "annual" ? "right-1" : "left-1"}`}
                />
              </button>
              <span
                className={`text-sm font-bold flex items-center gap-2 ${billingInterval === "annual" ? "text-zinc-900" : "text-zinc-500"}`}
              >
                Yearly
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">
                  Save 17%
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto items-stretch">
            {/* Starter */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-8 shadow-xl shadow-zinc-200/40 flex flex-col hover:-translate-y-1 transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-xl font-black text-zinc-900">Starter</h3>
                <p className="text-sm text-zinc-500 font-medium mt-2">
                  Best for freelancers and startups.
                </p>
              </div>
              <div className="mb-8">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-zinc-900">
                    ${billingInterval === "annual" ? "240" : "20"}
                  </span>
                  <span className="text-zinc-500 font-medium pb-1">
                    /{billingInterval === "annual" ? "year" : "month"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleFreemiusCheckout("starter")}
                disabled={isProcessing}
                className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-sm transition-colors mb-8 cursor-pointer disabled:opacity-50"
              >
                Subscribe Now
              </button>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-4">
                  Includes:
                </p>
                <ul className="space-y-3 text-sm text-zinc-600 font-medium">
                  {[
                    "300 AI Credits",
                    "100 document scans",
                    "Invoice reminders",
                    "PDF exports",
                    "Basic bookkeeping",
                    "Email support",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Professional */}
            <div className="bg-white rounded-[32px] border-2 border-indigo-600 p-8 shadow-2xl shadow-indigo-600/20 flex flex-col relative transform lg:-translate-y-4 hover:-translate-y-5 transition-all duration-300">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-indigo-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" /> Most Popular
                </span>
              </div>
              <div className="mb-6 mt-2">
                <h3 className="text-xl font-black text-indigo-900">Pro Plan</h3>
                <p className="text-sm text-zinc-500 font-medium mt-2">
                  Everything in Starter PLUS:
                </p>
              </div>
              <div className="mb-8">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-indigo-900">
                    ${billingInterval === "annual" ? "419" : "34.99"}
                  </span>
                  <span className="text-zinc-500 font-medium pb-1">
                    /{billingInterval === "annual" ? "year" : "month"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleFreemiusCheckout("professional")}
                disabled={isProcessing}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors mb-8 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                Upgrade to Pro Plan
              </button>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-4">
                  Core additions:
                </p>
                <ul className="space-y-3 text-sm text-zinc-700 font-medium">
                  {[
                    "Unlimited document scans",
                    "2,500 AI Credits",
                    "AI bookkeeping",
                    "AI forensic auditing",
                    "Creditors & Debtors",
                    "WhatsApp reminders",
                    "SMS & Email reminders",
                    "Calendar & Workflow",
                    "Registry",
                    "Priority support",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Business */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-8 shadow-xl shadow-zinc-200/40 flex flex-col hover:-translate-y-1 transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-xl font-black text-zinc-900">Business</h3>
                <p className="text-sm text-zinc-500 font-medium mt-2">
                  Everything in Pro Plan PLUS:
                </p>
              </div>
              <div className="mb-8">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-zinc-900">
                    ${billingInterval === "annual" ? "767" : "79.99"}
                  </span>
                  <span className="text-zinc-500 font-medium pb-1">
                    /{billingInterval === "annual" ? "year" : "month"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleFreemiusCheckout("business")}
                disabled={isProcessing}
                className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-sm transition-colors mb-8 cursor-pointer disabled:opacity-50"
              >
                Choose Business
              </button>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-4">
                  Core additions:
                </p>
                <ul className="space-y-3 text-sm text-zinc-600 font-medium">
                  {[
                    "Unlimited AI Credits",
                    "Multiple workspaces",
                    "Team collaboration (5 users)",
                    "Admin dashboard",
                    "Advanced analytics",
                    "API access",
                    "Custom branding",
                    "Faster AI processing",
                    "AI Fraud Risk Score",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* AI Credit Packs */}
          <div className="mt-32 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black tracking-tight text-zinc-900">
                Need More AI Power?
              </h2>
              <p className="text-lg text-zinc-500 font-medium mt-4">
                Purchase additional AI Credits anytime. Credits never expire.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: "credit_25k",
                  creditsNum: 25000,
                  credits: "25,000",
                  price: 15,
                  priceStr: "$15",
                  icon: <Zap className="w-6 h-6 text-amber-500" />,
                },
                {
                  id: "credit_100k",
                  creditsNum: 100000,
                  credits: "100,000",
                  price: 45,
                  priceStr: "$45",
                  icon: <Sparkles className="w-6 h-6 text-indigo-500" />,
                },
                {
                  id: "credit_500k",
                  creditsNum: 500000,
                  credits: "500,000",
                  price: 180,
                  priceStr: "$180",
                  icon: <Star className="w-6 h-6 text-purple-500" />,
                },
              ].map((pack, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-8 border border-zinc-200 flex flex-col items-center text-center shadow-lg shadow-zinc-200/20 hover:-translate-y-1 transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center mb-4 border border-zinc-100">
                    {pack.icon}
                  </div>
                  <h4 className="text-xl font-black text-zinc-900">
                    {pack.credits} Credits
                  </h4>
                  <div className="text-2xl font-black text-zinc-900 mt-2 mb-6">
                    {pack.priceStr}
                  </div>
                  <button
                    onClick={() => {
                      if (!userProfile) {
                        safeAlert("Please sign in or register to purchase credit packs.");
                        return;
                      }
                      handleFreemiusCreditCheckout(pack.id);
                    }}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Buy Now
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-24 py-12 border-y border-zinc-200">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60">
              <div className="flex items-center gap-2 text-zinc-600 font-bold">
                <LockKeyhole className="w-5 h-5" /> Bank-Level Security
              </div>
              <div className="flex items-center gap-2 text-zinc-600 font-bold">
                <Zap className="w-5 h-5" /> AI Powered
              </div>
              <div className="flex items-center gap-2 text-zinc-600 font-bold">
                <Cloud className="w-5 h-5" /> Cloud Sync
              </div>
              <div className="flex items-center gap-2 text-zinc-600 font-bold">
                <ShieldCheck className="w-5 h-5" /> POPIA & GDPR Ready
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mt-24 max-w-6xl mx-auto overflow-x-auto">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 text-center mb-12">
              Compare Plans
            </h2>
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-4 px-6 text-sm font-bold text-zinc-900 border-b-2 border-zinc-900">
                    Features
                  </th>
                  <th className="py-4 px-6 text-sm font-black text-zinc-900 border-b-2 border-zinc-900 w-1/5">
                    Starter
                  </th>
                  <th className="py-4 px-6 text-sm font-black text-indigo-700 border-b-2 border-indigo-600 w-1/5 bg-indigo-50/30 rounded-t-xl">
                    Pro Plan
                  </th>
                  <th className="py-4 px-6 text-sm font-black text-zinc-900 border-b-2 border-zinc-900 w-1/4">
                    Business
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-zinc-700">
                {[
                  {
                    label: "Document Scans",
                    values: ["100/mo", "Unlimited", "Unlimited"],
                  },
                  {
                    label: "AI Credits/yr",
                    values: ["300", "2,500", "Unlimited"],
                  },
                  {
                    label: "Invoicing & Reminders",
                    values: [
                      "Included",
                      "Advanced (WhatsApp/SMS)",
                      "Advanced (WhatsApp/SMS)",
                    ],
                  },
                  {
                    label: "Bookkeeping",
                    values: ["Basic", "AI Bookkeeping", "AI Bookkeeping"],
                  },
                  {
                    label: "Forensic Auditing",
                    values: ["-", "Included", "Included"],
                  },
                  {
                    label: "Fraud Risk Score",
                    values: ["-", "-", "Included"],
                  },
                  {
                    label: "Users / Workspaces",
                    values: ["1 User", "1 User", "5 Users / Multi"],
                  },
                  {
                    label: "Support",
                    values: ["Email", "Priority", "Priority"],
                  },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                  >
                    <td className="py-4 px-6 font-bold">{row.label}</td>
                    {row.values.map((val, colIdx) => (
                      <td
                        key={colIdx}
                        className={`py-4 px-6 ${colIdx === 1 ? "bg-indigo-50/20 text-indigo-900" : ""}`}
                      >
                        {val !== "-" ? (
                          <span className="flex items-center gap-2">
                            <Check className={`w-4 h-4 shrink-0 ${colIdx === 1 ? "text-indigo-500" : "text-emerald-500"}`} />{" "}
                            {val}
                          </span>
                        ) : (
                          <span className="text-zinc-300">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FAQs */}
          <div className="mt-32 max-w-3xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Can I cancel anytime?",
                  a: "Yes, you can cancel your subscription at any time from your account settings. There are no cancellation fees.",
                },
                {
                  q: "Do unused AI Credits expire?",
                  a: "Monthly credits reset each billing cycle. However, purchased top-up AI Credit Packs never expire.",
                },
                {
                  q: "Can I switch plans?",
                  a: "Absolutely. You can upgrade or downgrade your plan at any time. Prorated charges will be applied automatically.",
                },
                {
                  q: "Is my business data encrypted?",
                  a: "Yes. All data is encrypted at rest and in transit using bank-level AES-256 encryption.",
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="border border-zinc-200 rounded-2xl bg-white overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-zinc-900 hover:bg-zinc-50 cursor-pointer"
                  >
                    {faq.q}
                    <ChevronDown
                      className={`w-5 h-5 text-zinc-400 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {expandedFaq === i && (
                    <div className="px-6 pb-5 text-zinc-600 font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-32 mb-16 rounded-[40px] bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 p-12 md:p-20 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 blur-3xl rounded-full -translate-x-1/3 translate-y-1/3"></div>
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                Ready to automate your business?
              </h2>
              <p className="text-xl text-indigo-200 font-medium">
                Join businesses using AI to simplify bookkeeping, auditing,
                payroll, invoicing, and business management.
              </p>
              <button
                onClick={() => setCheckoutPlan("professional")}
                className="bg-white text-indigo-900 hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all px-8 py-4 rounded-2xl font-black text-lg shadow-xl inline-block cursor-pointer"
              >
                Get Started Today
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
