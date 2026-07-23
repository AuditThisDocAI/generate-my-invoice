import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const SUPPORTED_LANGUAGES = ["en", "es", "fr", "de"];

const REGION_CURRENCY_MAP: Record<string, string> = {
  US: "$",
  GB: "£",
  EU: "€",
  DE: "€",
  FR: "€",
  ES: "€",
  IT: "€",
  NL: "€",
  BE: "€",
  AT: "€",
  IE: "€",
  PT: "€",
  FI: "€",
  ZA: "R",
  IN: "₹",
  JP: "¥",
  CN: "¥",
  CA: "C$",
  AU: "A$",
  NZ: "NZ$",
  CH: "CHF",
  BR: "R$",
};

export const REGION_TAX_MAP: Record<string, number> = {
  GB: 20,
  DE: 19,
  FR: 20,
  ES: 21,
  IT: 22,
  NL: 21,
  BE: 21,
  AT: 20,
  IE: 23,
  PT: 23,
  FI: 24,
  ZA: 15,
  IN: 18,
  JP: 10,
  AU: 10,
  NZ: 15,
  CH: 8.1,
};

export const CURRENCY_TAX_MAP: Record<string, number> = {
  "£": 20,
  "R": 15,
  "€": 21,
  "₹": 18,
  "¥": 10,
  "A$": 10,
  "NZ$": 15,
  "CHF": 8.1,
};

export function useLocaleDetector(
  currentCurrency?: string,
  onLanguageDetected?: (detected: string) => void,
  onCurrencySuggestion?: (suggested: string) => void,
  onTaxSuggestion?: (suggestedTax: number) => void
) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Check if the user has already visited/set a language preference
    const userPref = localStorage.getItem("gmi_pref_lang");
    const autoDetectedAlready = localStorage.getItem("gmi_locale_detected");
    const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || "";

    if (!userPref && !autoDetectedAlready) {
      // Get browser language (e.g., "en-US", "fr-FR", "es")
      
      // Extract the 2-letter base language code
      const baseLang = browserLang.split("-")[0].toLowerCase();

      if (SUPPORTED_LANGUAGES.includes(baseLang)) {
        // Change the application language automatically
        i18n.changeLanguage(baseLang);
        localStorage.setItem("gmi_pref_lang", baseLang);
        localStorage.setItem("gmi_locale_detected", "true");
        
        if (onLanguageDetected) {
          onLanguageDetected(baseLang);
        }
      } else {
        // Even if not supported, mark as detected so we don't keep polling
        localStorage.setItem("gmi_locale_detected", "true");
      }
    }

    // Currency Detection Component
    const currencySuggestedAlready = localStorage.getItem("gmi_currency_suggested");
    
    // We only try to suggest a currency if the browserLang provides a region (e.g. en-US)
    let region = "";
    if (browserLang.includes("-")) {
      region = browserLang.split("-")[1].toUpperCase();

      if (!currencySuggestedAlready && onCurrencySuggestion && currentCurrency) {
        const detectedCurrency = REGION_CURRENCY_MAP[region];
        
        if (detectedCurrency && detectedCurrency !== currentCurrency) {
          onCurrencySuggestion(detectedCurrency);
          localStorage.setItem("gmi_currency_suggested", "true");
        }
      }
    }

    // Tax Rate Detection Component
    const taxSuggestedAlready = localStorage.getItem("gmi_tax_suggested");
    if (!taxSuggestedAlready && onTaxSuggestion && currentCurrency) {
      let detectedTax = REGION_TAX_MAP[region];
      
      // Fallback to average tax rate based on the currently selected currency
      if (detectedTax === undefined && currentCurrency) {
        detectedTax = CURRENCY_TAX_MAP[currentCurrency];
      }

      if (detectedTax !== undefined) {
        onTaxSuggestion(detectedTax);
        localStorage.setItem("gmi_tax_suggested", "true");
      }
    }

  }, [i18n, currentCurrency, onLanguageDetected, onCurrencySuggestion, onTaxSuggestion]);
}
