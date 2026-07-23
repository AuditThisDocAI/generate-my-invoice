import React, { useEffect, useRef, useState } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search, Sparkles, Lock, ArrowRight } from "lucide-react";

interface ClientAddressAutocompleteProps {
  onPlaceSelect: (address: string, name?: string) => void;
  apiKey: string;
  hasValidKey: boolean;
  selectedType?: 'Billing' | 'Shipping' | 'Physical';
  onTypeChange?: (type: 'Billing' | 'Shipping' | 'Physical') => void;
}

export default function ClientAddressAutocomplete({ 
  onPlaceSelect, 
  apiKey, 
  hasValidKey,
  selectedType = "Billing",
  onTypeChange
}: ClientAddressAutocompleteProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-3 mt-1.5 mb-2.5 bg-zinc-50/50 p-3 rounded-2xl border border-zinc-150/80">
      {/* Address Type Selector */}
      <div className="flex items-center gap-3">
        <label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">
          Address Type:
        </label>
        <select
          value={selectedType}
          onChange={(e) => onTypeChange?.(e.target.value as any)}
          className="text-xs px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white font-sans font-bold text-zinc-800 focus:outline-none focus:border-violet-500 cursor-pointer shadow-2xs"
          id="address-type-selector"
        >
          <option value="Billing">💳 Billing Address</option>
          <option value="Shipping">🚚 Shipping/Delivery Address</option>
          <option value="Physical">🏢 Physical/HQ Address</option>
        </select>
      </div>

      {/* Autocomplete Input Container */}
      {!hasValidKey ? (
        <div className="relative">
          <div className="flex items-center justify-between p-2.5 bg-violet-50/40 border border-violet-150/60 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 text-zinc-650">
              <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse shrink-0" />
              <span className="font-semibold text-zinc-700">1-Click Autocomplete</span>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-[10px] font-extrabold uppercase text-violet-600 hover:text-violet-700 underline bg-transparent cursor-pointer font-sans"
            >
              {showHelp ? "Hide Guide" : "Setup Guide →"}
            </button>
          </div>

          {showHelp && (
            <div className="absolute left-0 right-0 z-50 p-4.5 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl text-xs text-zinc-600 space-y-3 animate-fadeIn">
              <h4 className="font-black text-zinc-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>Configure Google Maps Autocomplete</span>
              </h4>
              <p className="leading-relaxed text-zinc-500">
                Unlock instant address suggestions and automated corporate/business name lookup inside your client form fields in 3 quick steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 font-sans pl-1 text-zinc-600 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                <li>
                  <a 
                    href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-violet-600 hover:underline font-bold inline-flex items-center gap-0.5"
                  >
                    Get Google Maps API Key <ArrowRight className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  Open the **Settings** menu at top-right (⚙️ gear icon)
                </li>
                <li>
                  Click **Secrets** → add <code className="bg-zinc-200 font-bold font-mono px-1.5 py-0.5 rounded text-[10.5px] text-violet-700">GOOGLE_MAPS_PLATFORM_KEY</code> → paste key.
                </li>
              </ol>
              <p className="text-[10px] text-zinc-600">
                * The application compiles automatically upon saving your secret – no browser reload required.
              </p>
            </div>
          )}
        </div>
      ) : (
        <APIProvider apiKey={apiKey} version="weekly">
          <AutocompleteInput onPlaceSelect={onPlaceSelect} />
        </APIProvider>
      )}
    </div>
  );
}

function AutocompleteInput({ onPlaceSelect }: { onPlaceSelect: (address: string, name?: string) => void }) {
  const [placeAutocomplete, setPlaceAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary("places");

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ["address_components", "formatted_address", "geometry", "name"],
    };

    const autocompleteInstance = new places.Autocomplete(inputRef.current, options);
    setPlaceAutocomplete(autocompleteInstance);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.stopPropagation();
      }
    };
    const currentInput = inputRef.current;
    currentInput.addEventListener("keydown", handleKeyDown);

    return () => {
      currentInput.removeEventListener("keydown", handleKeyDown);
      if (autocompleteInstance) {
        google.maps.event.clearInstanceListeners(autocompleteInstance);
      }
    };
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    const listener = placeAutocomplete.addListener("place_changed", () => {
      const place = placeAutocomplete.getPlace();
      if (place) {
        const address = place.formatted_address || "";
        const name = place.name || "";
        onPlaceSelect(address, name);
        if (inputRef.current) {
          inputRef.current.value = ""; 
        }
      }
    });

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [onPlaceSelect, placeAutocomplete]);

  return (
    <div className="relative">
      <label className="text-[9.5px] font-extrabold uppercase text-violet-650 block mb-1 flex items-center gap-1 tracking-wide">
        <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
        <span>⚡ Real-Time Address Autocomplete:</span>
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full text-xs p-2.5 pl-8.5 pr-4 border border-violet-100 rounded-xl bg-violet-50/10 focus:outline-none focus:border-violet-500 focus:bg-white font-sans shadow-xs hover:border-violet-200 transition-all placeholder-zinc-400"
          placeholder="Search corporate business or street address..."
        />
        <div className="absolute inset-y-0 left-3 flex items-center justify-center pointer-events-none">
          <Search className="w-3.5 h-3.5 text-violet-400" />
        </div>
      </div>
    </div>
  );
}
