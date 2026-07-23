import React, { useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { googleSignIn } from "../google-calendar";
import { getGoogleContacts } from "../google-calendar";

interface GoogleContactsButtonProps {
  onContactSelect: (contact: { name?: string; email?: string; company?: string; phone?: string; }) => void;
  onError?: (err: string) => void;
}

export default function GoogleContactsButton({ onContactSelect, onError }: GoogleContactsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const result = await googleSignIn();
      const token = result.accessToken;
      if (!token) throw new Error("Failed to authenticate.");

      const data = await getGoogleContacts(token);
      const connections = data.connections || [];
      if (connections.length === 0) {
        if (onError) onError("No contacts found in Google Contacts.");
      } else {
        setContacts(connections);
        setShowDropdown(true);
      }
    } catch (err: any) {
      if (onError) onError(err.message || "Failed to sync Google Contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (person: any) => {
    let name = "";
    if (person.names && person.names.length > 0) {
      name = person.names[0].displayName;
    }
    let email = "";
    if (person.emailAddresses && person.emailAddresses.length > 0) {
      email = person.emailAddresses[0].value;
    }
    let company = "";
    if (person.organizations && person.organizations.length > 0) {
      company = person.organizations[0].name;
    }
    let phone = "";
    if (person.phoneNumbers && person.phoneNumbers.length > 0) {
      phone = person.phoneNumbers[0].value;
    }

    onContactSelect({ name, email, company, phone });
    setShowDropdown(false);
  };

  return (
    <div className="relative inline-block w-full sm:w-auto">
      <button
        type="button"
        onClick={fetchContacts}
        disabled={loading}
        className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl text-[10.5px] font-black tracking-tight uppercase flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 w-full sm:w-auto"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Users className="w-3.5 h-3.5 text-blue-600" />
        )}
        Import Google Contacts
      </button>

      {showDropdown && contacts.length > 0 && (
        <div className="absolute top-full mt-2 left-0 w-64 max-h-60 overflow-y-auto bg-white border border-zinc-200 shadow-xl rounded-xl z-[60] flex flex-col p-1 animate-fadeIn">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-zinc-100 mb-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select Contact</span>
            <button 
              onClick={() => setShowDropdown(false)}
              className="text-[10px] text-zinc-600 hover:text-zinc-600 font-bold px-2 py-0.5"
            >
              Close
            </button>
          </div>
          {contacts.map((c, i) => {
            const name = c.names?.[0]?.displayName || "Unknown Contact";
            const email = c.emailAddresses?.[0]?.value || "";
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(c)}
                className="flex flex-col text-left px-3 py-2 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
              >
                <span className="text-[11px] font-bold text-zinc-800">{name}</span>
                {email && <span className="text-[10px] text-zinc-500 truncate">{email}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  );
}
