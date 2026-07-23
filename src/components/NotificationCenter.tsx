import React, { useState, useEffect } from "react";
import {
  Bell,
  MessageSquare,
  Volume2,
  Settings2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Share2,
  Send,
  Sparkles,
  RefreshCw,
  Maximize2,
  HelpCircle,
  BellRing
} from "lucide-react";
import { SavedHistory, DocumentData } from "../types";

// Helper to play a dynamic, high-quality audio chime using pure Web Audio API
const playChimeSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    
    // First high note (C5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.4);

    // Second harmonious note (E5) slightly delayed for a beautiful double-bell effect
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.5);
    }, 120);
  } catch (e) {
    console.warn("Could not play synthesized notification sound:", e);
  }
};

interface NotificationCenterProps {
  history: SavedHistory[];
  activeDoc: DocumentData;
  totalAmount: number;
}

interface NotificationToast {
  id: string;
  title: string;
  message: string;
  invoiceNum: string;
  clientName: string;
  type: "browser" | "whatsapp";
  waUrl?: string;
  timestamp: string;
}

interface NotificationLog {
  id: string;
  timestamp: string;
  invoiceNum: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  amount: string;
  type: "Browser Alert" | "WhatsApp Reminder";
  status: "Triggered" | "Sent / Link Opened" | "Dispatched";
  message: string;
}

export default function NotificationCenter({
  history = [],
  activeDoc,
  totalAmount,
}: NotificationCenterProps) {
  // Configuration States
  const [isBrowserAlertsEnabled, setIsBrowserAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("gmi_nc_browser_alerts") !== "false";
  });
  const [isWhatsAppRemindersEnabled, setIsWhatsAppRemindersEnabled] = useState<boolean>(() => {
    return localStorage.getItem("gmi_nc_wa_reminders") !== "false";
  });
  const [autoTriggerWhatsAppTab, setAutoTriggerWhatsAppTab] = useState<boolean>(() => {
    return localStorage.getItem("gmi_nc_wa_auto_tab") === "true";
  });
  const [waTemplate, setWaTemplate] = useState<string>(() => {
    return (
      localStorage.getItem("gmi_nc_wa_template") ||
      "Hello {client_name},\n\nThis is a friendly reminder that Invoice #{invoice_num} ({amount}) is due in 2 days on {due_date}. Please settle it at your earliest convenience. Thank you!"
    );
  });

  // Logs and track keys
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => {
    try {
      const raw = localStorage.getItem("gmi_nc_logs");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [sentKeys, setSentKeys] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("gmi_nc_sent_keys");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Active floating toasts
  const [activeToasts, setActiveToasts] = useState<NotificationToast[]>([]);

  // Simulation controls to allow testing the "exactly 2 days before" trigger!
  const [useSimulationDate, setUseSimulationDate] = useState<boolean>(false);
  const [simulationDateStr, setSimulationDateStr] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Selected invoice in sandbox for quick action manual simulation
  const [sandboxSelectedInvoiceId, setSandboxSelectedInvoiceId] = useState<string>("");

  // Helper to parse due dates and calculate remaining calendar days
  const calculateDaysRemaining = (dueDateStr: string | undefined): number | null => {
    if (!dueDateStr) return null;
    const dueDate = new Date(dueDateStr);
    if (isNaN(dueDate.getTime())) return null;

    const baseDate = useSimulationDate ? new Date(simulationDateStr) : new Date();
    
    const d1 = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const d2 = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

    const diffTime = d1.getTime() - d2.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // Persist settings
  useEffect(() => {
    localStorage.setItem("gmi_nc_browser_alerts", isBrowserAlertsEnabled ? "true" : "false");
  }, [isBrowserAlertsEnabled]);

  useEffect(() => {
    localStorage.setItem("gmi_nc_wa_reminders", isWhatsAppRemindersEnabled ? "true" : "false");
  }, [isWhatsAppRemindersEnabled]);

  useEffect(() => {
    localStorage.setItem("gmi_nc_wa_auto_tab", autoTriggerWhatsAppTab ? "true" : "false");
  }, [autoTriggerWhatsAppTab]);

  useEffect(() => {
    localStorage.setItem("gmi_nc_wa_template", waTemplate);
  }, [waTemplate]);

  useEffect(() => {
    localStorage.setItem("gmi_nc_logs", JSON.stringify(notificationLogs));
  }, [notificationLogs]);

  useEffect(() => {
    localStorage.setItem("gmi_nc_sent_keys", JSON.stringify(sentKeys));
  }, [sentKeys]);

  // Request native browser notifications permission
  const requestBrowserPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    const currentPermission = Notification.permission;
    if (currentPermission === "granted") {
      alert("Browser notification permission is already granted!");
      return;
    }
    if (currentPermission === "denied") {
      alert("Notifications are blocked in your browser settings. Please click the padlock icon in your address bar to re-enable them.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("🔔 Setup Complete!", {
        body: "Smart Invoice Assistant will now send browser alerts 2 days before deadlines.",
      });
    }
  };

  // Core background checker - scans and fires alerts when due dates are exactly 2 days out
  const runDeadlineChecker = () => {
    if (history.length === 0) return;

    const processedNewKeys: string[] = [];
    const newLogs: NotificationLog[] = [];

    history.forEach((item) => {
      const doc = item.documentData;
      if (!doc || doc.documentType !== "invoice") return;

      // Outstanding total evaluation
      const currentSubtotal = doc.items.reduce((sum, it) => {
        const isInclusive = doc.taxInclusive || it.includeTaxInRate;
        const preTaxRate = isInclusive ? (it.rate / (1 + ((it.taxPercent || 0) / 100))) : it.rate;
        const basePrice = it.quantity * preTaxRate;
        const discountAmount = basePrice * ((it.discountPercent || 0) / 100) + (it.discountAmount || 0);
        return sum + Math.max(0, basePrice - discountAmount) + (Math.max(0, basePrice - discountAmount) * ((it.taxPercent || 0) / 100));
      }, 0);
      const afterDiscount = Math.max(0, currentSubtotal - doc.discountRate);
      const docTotal = afterDiscount + (afterDiscount * (doc.taxRate / 100)) + doc.shippingCharge;
      const outstanding = Math.max(0, docTotal - (doc.amountPaid || 0));

      // Skip fully paid invoices
      if (outstanding <= 0.05) return;

      const daysRemaining = calculateDaysRemaining(doc.dueDate);
      
      // We look specifically for exactly 2 days before deadline
      if (daysRemaining === 2) {
        const docNum = doc.documentNumber || "No Number";
        const clientName = doc.clientName || doc.clientCompany || "Valued Client";
        const formattedAmount = `${doc.currency || "$"}${outstanding.toFixed(2)}`;
        
        // 1. Browser Alert Trigger
        const browserKey = `alert_browser_${item.id}_2days`;
        if (isBrowserAlertsEnabled && !sentKeys.includes(browserKey)) {
          processedNewKeys.push(browserKey);
          
          const alertTitle = `⏰ Invoice Deadline approaching!`;
          const alertText = `Invoice #${docNum} for ${clientName} (${formattedAmount}) is due in 2 days.`;
          
          // Native browser push alert
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(alertTitle, { body: alertText });
            } catch (err) {
              console.warn("Failed to fire native alert:", err);
            }
          }

          // Trigger in-app rich toast
          triggerToast({
            title: alertTitle,
            message: alertText,
            invoiceNum: docNum,
            clientName,
            type: "browser",
            timestamp: new Date().toLocaleTimeString()
          });

          // Add to log
          newLogs.push({
            id: "log_" + Math.random().toString(36).substring(5),
            timestamp: new Date().toLocaleString(),
            invoiceNum: docNum,
            clientName,
            clientPhone: doc.clientPhone || "N/A",
            clientEmail: doc.clientEmail || "N/A",
            amount: formattedAmount,
            type: "Browser Alert",
            status: "Triggered",
            message: alertText
          });
        }

        // 2. WhatsApp Reminder Trigger
        const waKey = `alert_wa_${item.id}_2days`;
        if (isWhatsAppRemindersEnabled && !sentKeys.includes(waKey)) {
          processedNewKeys.push(waKey);

          // Render customizable message template
          const textMsg = waTemplate
            .replace(/{client_name}/g, clientName)
            .replace(/{invoice_num}/g, docNum)
            .replace(/{amount}/g, formattedAmount)
            .replace(/{due_date}/g, doc.dueDate || "N/A");

          const cleanPhone = (doc.clientPhone || "").replace(/[^0-9]/g, "");
          const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMsg)}` : "";

          // Auto open tab if configured
          if (autoTriggerWhatsAppTab && waUrl) {
            window.open(waUrl, "_blank");
          }

          // Trigger in-app notification toast (gives direct button to open WhatsApp if not auto-triggered)
          triggerToast({
            title: `💬 WhatsApp Reminder Ready!`,
            message: `Click to dispatch friendly 2-day reminder to ${clientName}.`,
            invoiceNum: docNum,
            clientName,
            type: "whatsapp",
            waUrl: waUrl || undefined,
            timestamp: new Date().toLocaleTimeString()
          });

          // Add to log
          newLogs.push({
            id: "log_" + Math.random().toString(36).substring(5),
            timestamp: new Date().toLocaleString(),
            invoiceNum: docNum,
            clientName,
            clientPhone: doc.clientPhone || "N/A",
            clientEmail: doc.clientEmail || "N/A",
            amount: formattedAmount,
            type: "WhatsApp Reminder",
            status: autoTriggerWhatsAppTab ? "Dispatched" : "Triggered",
            message: textMsg
          });
        }
      }
    });

    if (processedNewKeys.length > 0) {
      setSentKeys(prev => [...prev, ...processedNewKeys]);
    }
    if (newLogs.length > 0) {
      setNotificationLogs(prev => [ ...newLogs, ...prev]);
    }
  };

  // Run checker when configuration, date selection or history updates
  useEffect(() => {
    runDeadlineChecker();
  }, [history, useSimulationDate, simulationDateStr, isBrowserAlertsEnabled, isWhatsAppRemindersEnabled]);

  const triggerToast = (toast: Omit<NotificationToast, "id">) => {
    const id = "toast_" + Math.random().toString(36).substring(5);
    setActiveToasts(prev => [...prev, { ...toast, id }]);
    playChimeSound();
    
    // Auto-remove toast after 10 seconds
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== id));
    }, 10000);
  };

  // Trigger simulated 2-days-before check instantly for a selected invoice
  const triggerManualSimulation = (invoiceItem: SavedHistory) => {
    const doc = invoiceItem.documentData;
    if (!doc) return;

    // Calculate outstanding
    const currentSubtotal = doc.items.reduce((sum, it) => {
      const isInclusive = doc.taxInclusive || it.includeTaxInRate;
      const preTaxRate = isInclusive ? (it.rate / (1 + ((it.taxPercent || 0) / 100))) : it.rate;
      const basePrice = it.quantity * preTaxRate;
      const discountAmount = basePrice * ((it.discountPercent || 0) / 100) + (it.discountAmount || 0);
      return sum + Math.max(0, basePrice - discountAmount) + (Math.max(0, basePrice - discountAmount) * ((it.taxPercent || 0) / 100));
    }, 0);
    const afterDiscount = Math.max(0, currentSubtotal - doc.discountRate);
    const docTotal = afterDiscount + (afterDiscount * (doc.taxRate / 100)) + doc.shippingCharge;
    const outstanding = Math.max(0, docTotal - (doc.amountPaid || 0));

    const docNum = doc.documentNumber || "No Number";
    const clientName = doc.clientName || doc.clientCompany || "Valued Client";
    const formattedAmount = `${doc.currency || "$"}${outstanding.toFixed(2)}`;

    // Set simulation calendar to exactly 2 days before the invoice's due date
    if (doc.dueDate) {
      const dueDateObj = new Date(doc.dueDate);
      const simDate = new Date(dueDateObj.getTime() - (2 * 24 * 60 * 60 * 1000));
      
      // Clear key state for this invoice to guarantee trigger
      const clearKeys = sentKeys.filter(
        k => !k.includes(invoiceItem.id)
      );
      setSentKeys(clearKeys);

      setSimulationDateStr(simDate.toISOString().split("T")[0]);
      setUseSimulationDate(true);

      // Force alert
      setTimeout(() => {
        triggerToast({
          title: "🎯 Simulation Triggered!",
          message: `Calendar mocked to ${simDate.toISOString().split("T")[0]} (exactly 2 days before due date: ${doc.dueDate})`,
          invoiceNum: docNum,
          clientName,
          type: "browser",
          timestamp: new Date().toLocaleTimeString()
        });
      }, 100);
    } else {
      alert("This invoice does not have a valid due date configured. Please set one first in workspace.");
    }
  };

  const clearLogs = () => {
    if (window.confirm("Are you sure you want to clear your entire Notification Logs history?")) {
      setNotificationLogs([]);
      setSentKeys([]);
      localStorage.removeItem("gmi_nc_logs");
      localStorage.removeItem("gmi_nc_sent_keys");
    }
  };

  // Stats summaries
  const invoicesList = history.filter(h => h.documentData?.documentType === "invoice");
  const unpaidInvoices = invoicesList.filter(item => {
    const doc = item.documentData;
    const currentSubtotal = doc.items.reduce((sum, it) => {
      const isInclusive = doc.taxInclusive || it.includeTaxInRate;
      const preTaxRate = isInclusive ? (it.rate / (1 + ((it.taxPercent || 0) / 100))) : it.rate;
      const basePrice = it.quantity * preTaxRate;
      const discountAmount = basePrice * ((it.discountPercent || 0) / 100) + (it.discountAmount || 0);
      return sum + Math.max(0, basePrice - discountAmount) + (Math.max(0, basePrice - discountAmount) * ((it.taxPercent || 0) / 100));
    }, 0);
    const afterDiscount = Math.max(0, currentSubtotal - doc.discountRate);
    const docTotal = afterDiscount + (afterDiscount * (doc.taxRate / 100)) + doc.shippingCharge;
    const outstanding = Math.max(0, docTotal - (doc.amountPaid || 0));
    return outstanding > 0.05;
  });

  const dueIn2DaysCount = unpaidInvoices.filter(item => {
    const dRemaining = calculateDaysRemaining(item.documentData.dueDate);
    return dRemaining === 2;
  }).length;

  return (
    <div id="nc_dashboard" className="space-y-6 text-left">
      {/* Dynamic Floating Toasts Display Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none w-full max-w-sm">
        {activeToasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl shadow-2xl p-4 pointer-events-auto animate-fadeIn flex flex-col gap-2 border-l-4 border-l-violet-500"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-violet-600/20 text-violet-400">
                  {toast.type === "browser" ? <Bell className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider font-mono text-zinc-400">
                  {toast.type === "browser" ? "Browser Alert" : "WhatsApp Dispatch"}
                </span>
              </div>
              <span className="text-[9px] font-bold text-zinc-500 font-mono">{toast.timestamp}</span>
            </div>
            
            <div className="space-y-0.5">
              <h5 className="font-sans font-bold text-xs text-white leading-tight">{toast.title}</h5>
              <p className="text-[11.5px] text-zinc-400 font-medium leading-normal">{toast.message}</p>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2 mt-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">
                Doc #{toast.invoiceNum}
              </span>
              {toast.type === "whatsapp" && toast.waUrl && (
                <a
                  href={toast.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-lg transition-all"
                >
                  <Send className="w-3 h-3" />
                  <span>Send WhatsApp</span>
                </a>
              )}
              {toast.type === "browser" && (
                <button
                  type="button"
                  onClick={() => setActiveToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-zinc-500 hover:text-white font-bold text-[9px] uppercase hover:underline"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Tracked Invoices */}
        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-550 block">Invoices Scanned</span>
            <span className="text-xl font-black text-zinc-900">{invoicesList.length} total</span>
          </div>
        </div>

        {/* Due in exactly 2 days */}
        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden">
          {dueIn2DaysCount > 0 && (
            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          )}
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-550 block">Due in 2 Days</span>
            <span className={`text-xl font-black ${dueIn2DaysCount > 0 ? "text-amber-600" : "text-zinc-900"}`}>
              {dueIn2DaysCount} warning(s)
            </span>
          </div>
        </div>

        {/* Alert rules logs dispatched */}
        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-550 block">Total Alerts Fired</span>
            <span className="text-xl font-black text-zinc-900">
              {notificationLogs.length} dispatched
            </span>
          </div>
        </div>

        {/* Browser Alert Permissions Info Box */}
        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-extrabold uppercase tracking-wide text-zinc-650">Push Permissions</span>
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
              "Notification" in window && Notification.permission === "granted"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-zinc-200 text-zinc-700"
            }`}>
              {"Notification" in window ? Notification.permission : "Not Supported"}
            </span>
          </div>
          <button
            type="button"
            onClick={requestBrowserPermission}
            className="text-[10px] font-black uppercase text-violet-700 hover:text-white bg-violet-50 hover:bg-violet-700 border border-violet-100 p-1.5 rounded-lg text-center mt-2 cursor-pointer transition-all"
          >
            Request Desktop Push
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Tracked Invoices Timeline & Test Sandbox */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* TRACKED INVOICES TIMELINE */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-5 md:p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-4 mb-4">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-violet-600" />
                  <span>Invoice Due Dates Tracking Timeline</span>
                </h4>
                <p className="text-[10.5px] text-zinc-500 mt-0.5">Live remaining days countdown for unpaid customer accounts.</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-mono font-bold bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-full border border-zinc-200/60 uppercase">
                  Today: {useSimulationDate ? simulationDateStr + " (Mocked)" : new Date().toISOString().split("T")[0]}
                </span>
              </div>
            </div>

            {unpaidInvoices.length === 0 ? (
              <div className="text-center py-12 border border-zinc-200 border-dashed rounded-2xl bg-zinc-50/50">
                <AlertTriangle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-700 uppercase tracking-wide">No active unpaid invoices found</p>
                <p className="text-[10.5px] text-zinc-500 mt-1">Populate or save invoice records under Document History to automatically build timeline milestones.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {unpaidInvoices.map((item) => {
                  const doc = item.documentData;
                  const daysRemaining = calculateDaysRemaining(doc.dueDate);
                  
                  // Style based on remaining days boundary
                  let badgeColor = "bg-zinc-100 text-zinc-700 border-zinc-200";
                  let badgeText = "Upcoming";
                  
                  if (daysRemaining !== null) {
                    if (daysRemaining < 0) {
                      badgeColor = "bg-rose-100 text-rose-700 border-rose-200 animate-pulse";
                      badgeText = `Overdue by ${Math.abs(daysRemaining)} days`;
                    } else if (daysRemaining === 0) {
                      badgeColor = "bg-red-100 text-red-700 border-red-200 animate-bounce";
                      badgeText = "⚠️ Due TODAY";
                    } else if (daysRemaining === 1) {
                      badgeColor = "bg-orange-100 text-orange-700 border-orange-200";
                      badgeText = "📅 Due tomorrow";
                    } else if (daysRemaining === 2) {
                      badgeColor = "bg-amber-100 text-amber-700 border-amber-300 font-extrabold animate-pulse ring-2 ring-amber-400/30";
                      badgeText = "⚡ 2 DAYS REMINDER TRIGGER";
                    } else {
                      badgeText = `Due in ${daysRemaining} days`;
                    }
                  }

                  const docNum = doc.documentNumber || "No Number";
                  const clientName = doc.clientName || doc.clientCompany || "Valued Client";
                  
                  return (
                    <div
                      key={item.id}
                      className={`bg-white border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-zinc-800 ${
                        daysRemaining === 2 ? "border-amber-400 shadow-sm shadow-amber-50" : "border-zinc-200"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-zinc-900 font-mono">Invoice #{docNum}</span>
                          <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-lg border tracking-wide ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-4 text-[11px] text-zinc-600 mt-1">
                          <p><strong className="text-zinc-600 font-bold">Client:</strong> {clientName}</p>
                          <p><strong className="text-zinc-600 font-bold">Due Date:</strong> {doc.dueDate || "N/A"}</p>
                          <p><strong className="text-zinc-600 font-bold">Contact:</strong> {doc.clientPhone || doc.clientEmail || "N/A"}</p>
                          <p><strong className="text-zinc-600 font-bold">Total Due:</strong> {doc.currency || "$"}{docTotalAmount(doc).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Interactive testing simulator trigger for this invoice */}
                        <button
                          type="button"
                          onClick={() => triggerManualSimulation(item)}
                          className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-850 text-white font-extrabold text-[10px] uppercase py-2 px-3 rounded-xl transition-all cursor-pointer shadow-sm shadow-zinc-300"
                          title="Simulate exactly 2-days before deadline for this invoice"
                        >
                          <Play className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                          <span>Test 2-Day Trigger</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DEVELOPER SIMULATION & TESTING CAROUSEL */}
          <div className="bg-zinc-950 text-zinc-200 rounded-3xl p-5 md:p-6 shadow-xl border border-zinc-850 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full filter blur-xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-600/10 rounded-full filter blur-xl pointer-events-none"></div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Settings2 className="w-5 h-5 text-amber-400 animate-spin" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">Sandbox Simulator & Calendar Override</h4>
                  <p className="text-[10px] text-zinc-400">Instantly test the 2-day automatic trigger by overriding the system calendar date.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Simulated Calendar Date</label>
                    <button
                      type="button"
                      onClick={() => {
                        setUseSimulationDate(!useSimulationDate);
                        playChimeSound();
                      }}
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md transition-all ${
                        useSimulationDate ? "bg-amber-500 text-black font-extrabold" : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {useSimulationDate ? "🟢 Simulation Mode Active" : "🔴 Real Time Clock"}
                    </button>
                  </div>
                  <input
                    type="date"
                    disabled={!useSimulationDate}
                    value={simulationDateStr}
                    onChange={(e) => setSimulationDateStr(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 focus:outline-none text-white font-mono font-bold text-xs disabled:opacity-40"
                  />
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      setSimulationDateStr(today.toISOString().split("T")[0]);
                      setUseSimulationDate(true);
                      triggerToast({
                        title: "⏰ Mock Date Reset",
                        message: "Date mocked to today's real calendar date.",
                        invoiceNum: "MOCK",
                        clientName: "Test Environment",
                        type: "browser",
                        timestamp: new Date().toLocaleTimeString()
                      });
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] uppercase py-2.5 px-3.5 rounded-xl transition-all cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Trigger direct test chime sound
                      playChimeSound();
                      triggerToast({
                        title: "🔊 Test Bell Chime",
                        message: "Audio notification triggered successfully inside sandbox environment.",
                        invoiceNum: "BELL",
                        clientName: "Audio Test",
                        type: "browser",
                        timestamp: new Date().toLocaleTimeString()
                      });
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] uppercase py-2.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bell Chime Test</span>
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/60 text-[10.5px] text-zinc-400 leading-normal">
                💡 <strong className="text-zinc-200">How to trigger automatic warnings:</strong> Create or select an invoice in Document History, look at its due date, then set the Simulated Calendar Date exactly 2 days before that due date. The system will automatically play the chime, fire the browser notification, pop up a floating card, and prepare the WhatsApp link!
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Configuration Rules & Template settings */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CONFIGURATION RULES PANEL */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-150 pb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-violet-600" />
              <span>Reminder Core Rules</span>
            </h4>

            {/* Toggle Browser push alerts */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-150">
              <div className="space-y-0.5">
                <span className="text-[11px] font-extrabold uppercase text-zinc-800 tracking-tight block">Browser Alerts</span>
                <span className="text-[9.5px] text-zinc-500 block">Desktop alerts 2 days before</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newVal = !isBrowserAlertsEnabled;
                  setIsBrowserAlertsEnabled(newVal);
                  triggerToast({
                    title: newVal ? "🔔 Browser Alerts Enabled" : "⏸️ Browser Alerts Paused",
                    message: newVal ? "Notifications will trigger 2 days before deadlines." : "Push alerts deactivated.",
                    invoiceNum: "NC",
                    clientName: "System",
                    type: "browser",
                    timestamp: new Date().toLocaleTimeString()
                  });
                }}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isBrowserAlertsEnabled ? "bg-violet-600" : "bg-zinc-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isBrowserAlertsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle WhatsApp integration */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-150">
              <div className="space-y-0.5">
                <span className="text-[11px] font-extrabold uppercase text-zinc-800 tracking-tight block">WhatsApp Reminders</span>
                <span className="text-[9.5px] text-zinc-500 block">Format message templates</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newVal = !isWhatsAppRemindersEnabled;
                  setIsWhatsAppRemindersEnabled(newVal);
                  triggerToast({
                    title: newVal ? "💬 WhatsApp Enabled" : "⏸️ WhatsApp Paused",
                    message: newVal ? "Custom templates and triggers are fully active." : "WhatsApp alerts deactivated.",
                    invoiceNum: "NC",
                    clientName: "System",
                    type: "browser",
                    timestamp: new Date().toLocaleTimeString()
                  });
                }}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isWhatsAppRemindersEnabled ? "bg-emerald-600" : "bg-zinc-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isWhatsAppRemindersEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle WhatsApp auto open tab */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-150">
              <div className="space-y-0.5">
                <span className="text-[11px] font-extrabold uppercase text-zinc-800 tracking-tight block">Auto Open WhatsApp</span>
                <span className="text-[9.5px] text-zinc-500 block">Launches Web WA instantly</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoTriggerWhatsAppTab(!autoTriggerWhatsAppTab)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoTriggerWhatsAppTab ? "bg-emerald-600" : "bg-zinc-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    autoTriggerWhatsAppTab ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* CUSTOMIZABLE WHATSAPP MESSAGE TEMPLATE */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-150 pb-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Template</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setWaTemplate(
                    "Hello {client_name},\n\nThis is a friendly reminder that Invoice #{invoice_num} ({amount}) is due in 2 days on {due_date}. Please settle it at your earliest convenience. Thank you!"
                  );
                }}
                className="text-[9px] text-zinc-550 hover:text-zinc-900 hover:underline uppercase font-bold"
              >
                Reset Default
              </button>
            </div>

            <textarea
              rows={4}
              value={waTemplate}
              onChange={(e) => setWaTemplate(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 focus:outline-none text-zinc-800 font-sans font-medium text-xs leading-normal focus:border-emerald-500 transition-colors"
              placeholder="Configure friendly warning message..."
            />

            {/* Template Variables Helper Tags */}
            <div>
              <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-650 block mb-1">Dynamic tags available:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: "{client_name}", desc: "Customer Name" },
                  { tag: "{invoice_num}", desc: "Invoice Number" },
                  { tag: "{amount}", desc: "Balance Due" },
                  { tag: "{due_date}", desc: "Due Date" }
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => setWaTemplate(prev => prev + " " + item.tag)}
                    className="text-[9px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200 font-mono font-bold tracking-tight cursor-pointer"
                    title={item.desc}
                  >
                    {item.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* LOWER SECTION: NOTIFICATION LOGS & ALERTS RUN HISTORY */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-150 pb-4 mb-4 gap-4">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Triggered Alerts & Reminders Logs Ledger</span>
            </h4>
            <p className="text-[10.5px] text-zinc-500 mt-0.5">Secure history log of dispatched browser warnings and client WhatsApp reminders.</p>
          </div>
          {notificationLogs.length > 0 && (
            <button
              type="button"
              onClick={clearLogs}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 font-black text-[10px] uppercase py-2 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer align-middle shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Clear History Log</span>
            </button>
          )}
        </div>

        {notificationLogs.length === 0 ? (
          <div className="text-center py-10 bg-zinc-55/40 rounded-2xl border border-zinc-200 border-dashed text-zinc-500">
            <CheckCircle className="w-7 h-7 text-zinc-400 mx-auto mb-1.5" />
            <p className="text-xs font-bold uppercase tracking-wide">Logs ledger empty</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Whenever a 2-day reminder is auto-fired or custom tested, it will log here instantly.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 font-bold font-sans uppercase text-[9.5px] tracking-wider select-none">
                  <th className="p-3">Trigger Time</th>
                  <th className="p-3">Ref Invoice</th>
                  <th className="p-3">Client / Contact Info</th>
                  <th className="p-3">Total Outstanding</th>
                  <th className="p-3">Alert Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Message Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 font-medium text-zinc-800">
                {notificationLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-3 font-mono text-[10.5px] text-zinc-550">{log.timestamp}</td>
                    <td className="p-3 font-mono font-bold text-zinc-900">#{log.invoiceNum}</td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-zinc-900 block">{log.clientName}</span>
                        <span className="text-[10px] text-zinc-500 block font-mono">{log.clientPhone !== "N/A" ? log.clientPhone : log.clientEmail}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-zinc-950">{log.amount}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-lg font-mono border ${
                        log.type === "Browser Alert"
                          ? "bg-violet-50 text-violet-700 border-violet-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}>
                        {log.type === "Browser Alert" ? "🔔 Browser" : "💬 WhatsApp"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase font-mono text-emerald-600">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                        <span>{log.status}</span>
                      </span>
                    </td>
                    <td className="p-3 max-w-[200px] truncate text-[10.5px] text-zinc-600" title={log.message}>
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Quick helper to evaluate invoice grand totals accurately matching standard schema
const docTotalAmount = (d: DocumentData): number => {
  const subtotal = d.items.reduce((sum, it) => {
    const isInclusive = d.taxInclusive || it.includeTaxInRate;
    const preTaxRate = isInclusive ? (it.rate / (1 + ((it.taxPercent || 0) / 100))) : it.rate;
    const basePrice = it.quantity * preTaxRate;
    const discountAmount = basePrice * ((it.discountPercent || 0) / 100) + (it.discountAmount || 0);
    return sum + Math.max(0, basePrice - discountAmount) + (Math.max(0, basePrice - discountAmount) * ((it.taxPercent || 0) / 100));
  }, 0);
  const afterDiscount = Math.max(0, subtotal - d.discountRate);
  return afterDiscount + (afterDiscount * (d.taxRate / 100)) + d.shippingCharge - (d.amountPaid || 0);
};
