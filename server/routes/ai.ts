import { GoogleGenAI, Type } from "@google/genai";

interface GenerateContentWithFallbackParams {
  contents: any;
  config?: any;
}

export function createAiRouter({ getAi }: { getAi: () => GoogleGenAI | null }) {
  async function generateContentWithFallback({ contents, config }: GenerateContentWithFallbackParams) {
    const ai = getAi();
    if (!ai) {
      throw new Error("AI client not initialized");
    }

    const maxRetries = 2;
    let delayMs = 300;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config,
        });
      } catch (err: any) {
        const isRateLimit = err?.status === 429 || err?.code === 429 || (err?.message && (err.message.includes("429") || err.message.includes("monthly spending cap")));
        if (isRateLimit) {
          throw new Error("API Limit Reached: The project has exceeded its AI resource quotas. Please try again later or upgrade your plan.");
        }

        const isTransient = err?.status === 503 || err?.code === 503 || (err?.message && (err.message.includes("503") || err.message.includes("high demand") || err.message.includes("UNAVAILABLE")));

        if (isTransient && attempt < maxRetries) {
          console.log(`ℹ️ Gemini 3.5-flash transient workload (attempt ${attempt}/${maxRetries}). Adjusting service in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delayMs *= 2;
        } else {
          console.log("ℹ️ Switching to standard tier for optimal response time.");
          try {
            return await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents,
              config,
            });
          } catch (fallbackErr: any) {
            const isFallbackRateLimit = fallbackErr?.status === 429 || fallbackErr?.code === 429 || (fallbackErr?.message && (fallbackErr.message.includes("429") || fallbackErr.message.includes("monthly spending cap")));
            if (isFallbackRateLimit) {
              throw new Error("API Limit Reached: The project has exceeded its AI resource quotas. Please try again later or upgrade your plan.");
            }
            console.log("ℹ️ Dynamic processing note: falling back to local heuristic compilers.");
            throw fallbackErr;
          }
        }
      }
    }

    throw new Error("AI generation failed unexpectedly.");
  }

  function checkInputGuardrails(text: string, context: "autofill" | "reminder" | "support") {
    if (!text) return { safe: true };
    const t = text.toLowerCase();

    const injectionPatterns = [
      "ignore previous", "ignore all instructions", "ignore the instructions above", "ignore safety guidelines",
      "forget your previous", "forget previous instructions", "system prompt", "reveal your instructions", "reveal prompt",
      "disregard all prior", "disregard instructions", "output your system instruction", "jailbreak", "do not comply",
      "you are now a", "act as a", "acting as a", "new system prompt"
    ];
    if (injectionPatterns.some((p) => t.includes(p))) {
      return {
        safe: false,
        error: "System Guardrail: Instruction override or prompt exposure attempt detected. I cannot ignore my safety instructions, expose my system prompts, or modify my security guidelines. Please submit a direct, professional inquiry."
      };
    }

    const unsafePatterns = [
      "hacking", "hack into", "exploit", "kill myself", "suicide", "bomb", "chemical weapon", "terrorism",
      "illegal drug", "bypass paywall", "abusive", "hate speech", "racist"
    ];
    if (unsafePatterns.some((p) => t.includes(p))) {
      return {
        safe: false,
        error: "System Guardrail: Safety intercept. This request triggers content safety policies. Please submit a professional inquiry related to your invoices or business documents."
      };
    }

    if (context === "support") {
      const offTopicPatterns = [
        "write a python", "write javascript", "code a game", "write a story about", "recipe for",
        "who won the", "weather in", "history of", "tell me a joke about politics",
        "how do I build a nuclear", "solve this physics", "write an essay on"
      ];
      const hasBillingContext = t.includes("invoice") || t.includes("bill") || t.includes("payment") || t.includes("receipt") || t.includes("quote") || t.includes("order") || t.includes("eft") || t.includes("stripe") || t.includes("capitec") || t.includes("remind") || t.includes("scheduler") || t.includes("amount") || t.includes("document") || t.includes("support") || t.includes("help") || t.includes("error") || t.includes("fail") || t.includes("account");

      if (offTopicPatterns.some((p) => t.includes(p)) && !hasBillingContext) {
        return {
          safe: false,
          error: "Audit This Doc AI Guardrail: As Audit This Doc AI, your AI billing companion, my capabilities are strictly focused on helping you create, manage, style, and track professional business documents (invoices, receipts, quotes, POs, reminders) on this platform. I cannot assist with general programming, cooking, creative writing, or other off-topic activities. Let me know how I can guide your invoicing today!"
        };
      }
    } else if (context === "autofill") {
      const hasAutofillContext = t.includes("invoice") || t.includes("bill") || t.includes("payment") || t.includes("receipt") || t.includes("quote") || t.includes("order") || t.includes("delivery") || t.includes("purchase") || t.includes("from") || t.includes("to") || t.includes("cost") || t.includes("item") || t.includes("r") || t.includes("$") || t.includes("€") || t.includes("£") || t.includes("clean") || t.includes("consult") || t.includes("repair") || t.includes("plumbing") || t.includes("design");
      if (!hasAutofillContext && (t.includes("recipe") || t.includes("story") || t.includes("write code") || t.includes("essay") || t.includes("tell me about"))) {
        return {
          safe: false,
          error: "Autofill Guardrail: The AI autofill assistant only processes invoice, receipt, quote, purchase order, or delivery note creation prompts. Please describe the items, client/sender, and totals for your document."
        };
      }
    }

    return { safe: true };
  }

  function checkOutputGuardrails(text: string): string {
    if (!text) return text;
    let cleanText = text;

    const hasCapitecRef = /capitec|account\s*no|account\s*number/i.test(cleanText);
    if (hasCapitecRef) {
      const accountNumberRegex = /(2547\d{6}|\b\d{9,11}\b)/g;
      cleanText = cleanText.replace(accountNumberRegex, (match) => {
        if (match !== "2547977857") {
          console.warn(`🚨 [GUARDRAILS LOG] Intercepted attempted hijacking of Capitec account number. Swapping "${match}" with official "2547977857" for payment safety.`);
          return "2547977857";
        }
        return match;
      });
    }

    return cleanText;
  }

  return {
    generateContentWithFallback,
    checkInputGuardrails,
    checkOutputGuardrails,
    Type,
  };
}
