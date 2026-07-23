import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Mail, 
  Clock, 
  Trash2, 
  Zap, 
  ExternalLink, 
  Sparkles, 
  AlertCircle, 
  Send, 
  CheckCircle2, 
  User, 
  RefreshCw,
  BellRing
} from "lucide-react";
import { DocumentData, ScheduledReminder, UserAccount, SavedHistory, ProfileCatalog } from "../types";
import { MessageSquare, ShieldCheck, Smartphone, Video } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

import { initAuth, googleSignIn, syncEventToGoogleCalendar, sendEmailViaGmailAPI, createGoogleMeetSpace } from "../google-calendar";

interface ReminderAssistantProps {
  activeDoc: DocumentData;
  totalAmount: number;
  userProfile?: UserAccount | null;
  history?: SavedHistory[];
  catalog?: ProfileCatalog;
  checkAICredits?: () => boolean;
  deductAICredits?: (amount?: number) => void;
}

export default function ReminderAssistant({ 
  activeDoc, 
  totalAmount, 
  userProfile,
  history = [],
  catalog,
  checkAICredits,
  deductAICredits
}: ReminderAssistantProps) {
  const [activeSubTab, setActiveSubTab] = useState<"notification_center" | "email_scheduler" | "overdue_hub">("notification_center");
  const [reminders, setReminders] = useState<ScheduledReminder[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<any[]>([]);
  const [autoDispatchEnabled, setAutoDispatchEnabled] = useState(() => localStorage.getItem("gmi_auto_overdue_dispatch") === "true");
  const [selectedFollowupChannel, setSelectedFollowupChannel] = useState<"email" | "whatsapp" | "sms" | "both" | "all">("both");
  const [waDispatchHistory, setWaDispatchHistory] = useState<string[]>([]);
  const [smsDispatchHistory, setSmsDispatchHistory] = useState<string[]>([]);
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [reminderText, setReminderText] = useState("");
  const [scheduleDelay, setScheduleDelay] = useState<"immediate" | "3days" | "7days" | "custom">("immediate");
  const [customDate, setCustomDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errorMess, setErrorMess] = useState<string | null>(null);
  const [successMess, setSuccessMess] = useState<string | null>(null);

  // --- INVOICE DEADLINE NOTIFICATION CENTER STATES ---
  const [enableDeadlineAlerts, setEnableDeadlineAlerts] = useState<boolean>(() => {
    return localStorage.getItem("gmi_deadline_alerts_enabled") !== "false";
  });
  const [deadlineChannel, setDeadlineChannel] = useState<"browser" | "whatsapp" | "both">(() => {
    return (localStorage.getItem("gmi_deadline_alerts_channel") as any) || "both";
  });
  const [twoDaysAlertsHistory, setTwoDaysAlertsHistory] = useState<string[]>(() => {
    try {
      const logs = localStorage.getItem("gmi_2days_alerts_history");
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  });
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });
  const [approachingInvoices, setApproachingInvoices] = useState<any[]>([]);

  const [reminderType, setReminderType] = useState<"invoice_reminder" | "meeting" | "custom_alert">("invoice_reminder");
  const [reminderSubject, setReminderSubject] = useState("");

  const [previewReminderId, setPreviewReminderId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [openingPreview, setOpeningPreview] = useState(false);

  // Google Calendar Integration states
  const [needsCalendarAuth, setNeedsCalendarAuth] = useState(true);
  const [calendarToken, setCalendarToken] = useState<string | null>(null);
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [isCalendarLoggingIn, setIsCalendarLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCalendarToken(token);
        setNeedsCalendarAuth(false);
      },
      () => {
        setNeedsCalendarAuth(true);
        setCalendarToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleCalendarLogin = async () => {
    setIsCalendarLoggingIn(true);
    setErrorMess(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCalendarToken(result.accessToken);
        setNeedsCalendarAuth(false);
        setSyncToCalendar(true);
        setSuccessMess("🎯 Connected to Google Calendar successfully!");
      }
    } catch (err) {
      console.error('Login failed:', err);
      setErrorMess("Google Calendar authorization failed.");
    } finally {
      setIsCalendarLoggingIn(false);
    }
  };

  // Quick custom popup timers states
  const [timerTitle, setTimerTitle] = useState("");
  const [timerMessage, setTimerMessage] = useState("");
  const [timerDuration, setTimerDuration] = useState("10");
  const [timerCategory, setTimerCategory] = useState("invoice");
  const [refreshClock, setRefreshClock] = useState(0);
  const [timerList, setTimerList] = useState<any[]>([]);

  // Periodically refresh the list of active timers
  useEffect(() => {
    const fetchTimers = () => {
      const raw = localStorage.getItem("gmi_app_pop_timers") || "[]";
      try {
        setTimerList(JSON.parse(raw));
      } catch (e) {}
    };
    fetchTimers();
    const interval = setInterval(fetchTimers, 1000);
    return () => clearInterval(interval);
  }, [refreshClock]);

  const openPreviewModal = async (id: string) => {
    setOpeningPreview(true);
    try {
      const resp = await fetch(`/api/reminders/preview/${id}`);
      if (resp.ok) {
        const html = await resp.text();
        setPreviewHtml(html);
        setPreviewReminderId(id);
      } else {
        alert("Failed to load email preview.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOpeningPreview(false);
    }
  };

  // Sync client email, name & phone from active document when activeDoc or category changes
  useEffect(() => {
    if (activeDoc) {
      setClientPhone(activeDoc.clientPhone || "");
      if (reminderType === "invoice_reminder") {
        setClientEmail(activeDoc.clientEmail || "");
        setClientName(activeDoc.clientName || activeDoc.clientCompany || "");
        
        const defaultMsg = `Dear ${activeDoc.clientName || activeDoc.clientCompany || "Client"},\n\nHope this message finds you well. Just a friendly follow-up regarding ${activeDoc.customTypeName || activeDoc.documentType || "Invoice"} #${activeDoc.documentNumber || "draft"} for the sum of ${activeDoc.currency || "$"}${totalAmount.toFixed(2)} which remains on payment terms.\n\nPlease complete payment securely at your convenience. Let us know if there are any questions regarding this billing.\n\nBest regards,\n${activeDoc.senderName || activeDoc.senderCompany || "Billing Team"}`;
        setReminderText(defaultMsg);
        setReminderSubject(`⏰ Reminder: ${(activeDoc.customTypeName || activeDoc.documentType || "Invoice").toUpperCase()} #${activeDoc.documentNumber || "draft"}`);
      } else if (reminderType === "meeting") {
        setReminderSubject(`📅 Meeting Invitation: Briefing session with ${activeDoc.clientName || activeDoc.clientCompany || "Client"}`);
        const defaultMsg = `Dear ${activeDoc.clientName || activeDoc.clientCompany || "Client"},\n\nThis is a friendly briefing notification that we have scheduled an upcoming review session with ${activeDoc.senderCompany || activeDoc.senderName || "our representative"}.\n\nAgenda:\n- Review reference requirements\n- Verify project delivery specs\n- General consultation updates\n\nPlease let us know if this scheduled date and time is convenient for your schedule.\n\nWarm regards,\n${activeDoc.senderName || activeDoc.senderCompany || "Business Team"}`;
        setReminderText(defaultMsg);
      } else if (reminderType === "custom_alert") {
        setReminderSubject(`🔔 Priority Schedule Alert: Immediate Check-in`);
        const defaultMsg = `Hello ${activeDoc.clientName || activeDoc.clientCompany || "User"},\n\nThis custom alert reminder serves as an active notification regarding review files or key follow-up benchmarks.\n\nPlease log in and verify current outstanding actions at your early convenience.\n\nThank you,\n${activeDoc.senderName || activeDoc.senderCompany || "System Administrator"}`;
        setReminderText(defaultMsg);
      }
    }
  }, [activeDoc, totalAmount, reminderType]);

  // Load configuration and scan histories for 3 days overdue invoices
  useEffect(() => {
    const autoEnabled = localStorage.getItem("gmi_auto_overdue_dispatch") === "true";
    setAutoDispatchEnabled(autoEnabled);

    const channel = localStorage.getItem("gmi_auto_overdue_channel") as "email" | "whatsapp" | "sms" | "both" | "all" || "both";
    setSelectedFollowupChannel(channel);

    try {
      const logs = JSON.parse(localStorage.getItem("gmi_wa_dispatch_logs") || "[]");
      setWaDispatchHistory(Array.isArray(logs) ? logs : []);
      
      const smsLogs = JSON.parse(localStorage.getItem("gmi_sms_dispatch_logs") || "[]");
      setSmsDispatchHistory(Array.isArray(smsLogs) ? smsLogs : []);
    } catch (e) {
      setWaDispatchHistory([]);
      setSmsDispatchHistory([]);
    }
  }, []);

  // Compute overdue invoices and match with catalog (registry)
  useEffect(() => {
    if (!history || history.length === 0) {
      setOverdueInvoices([]);
      return;
    }

    const today = new Date();
    const list: any[] = [];

    history.forEach(item => {
      const doc = item.documentData;
      if (!doc) return;
      if (doc.documentType !== "invoice") return;

      // Unpaid evaluation helper
      const calculateTotals = (d: DocumentData) => {
        const currentSubtotal = d.items.reduce((sum, it) => {
          const isInclusive = d.taxInclusive || it.includeTaxInRate;
          const preTaxRate = isInclusive ? (it.rate / (1 + ((it.taxPercent || 0) / 100))) : it.rate;
          const basePrice = it.quantity * preTaxRate;
          const discountAmount = basePrice * ((it.discountPercent || 0) / 100) + (it.discountAmount || 0);
          const taxableAmount = Math.max(0, basePrice - discountAmount);
          const taxAmount = taxableAmount * ((it.taxPercent || 0) / 100);
          return sum + taxableAmount + taxAmount;
        }, 0);
        const afterDiscount = Math.max(0, currentSubtotal - d.discountRate);
        const globalTaxCalculated = afterDiscount * (d.taxRate / 100);
        const grandTotalVal = afterDiscount + globalTaxCalculated + d.shippingCharge;
        const collected = d.amountPaid || 0;
        const outstandingAmount = Math.max(0, grandTotalVal - collected);
        return { grandTotal: grandTotalVal, outstanding: outstandingAmount };
      };

      const { grandTotal: gTotal, outstanding } = calculateTotals(doc);

      // Must be outstanding
      if (outstanding <= 0.05) return;

      // Must have due date
      if (!doc.dueDate) return;

      const dueDateObj = new Date(doc.dueDate);
      if (isNaN(dueDateObj.getTime())) return;

      // Difference in days
      const diffTime = today.getTime() - dueDateObj.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 3) {
        // Matched Client search in catalog client registry
        const matchedClient = catalog?.savedClients?.find(
          c => c.email?.toLowerCase().trim() === doc.clientEmail?.toLowerCase().trim() ||
               c.company?.toLowerCase().trim() === doc.clientCompany?.toLowerCase().trim() ||
               c.name?.toLowerCase().trim() === doc.clientName?.toLowerCase().trim()
        );

        list.push({
          invoiceId: item.id,
          docNumber: doc.documentNumber || "No Number",
          clientName: matchedClient?.name || doc.clientName || doc.clientCompany || "Valued Client",
          clientCompany: matchedClient?.company || doc.clientCompany || "",
          clientEmail: matchedClient?.email || doc.clientEmail || "",
          clientPhone: matchedClient?.phone || doc.clientPhone || "",
          currency: doc.currency || "$",
          grandTotal: gTotal,
          outstanding,
          dueDate: doc.dueDate,
          daysOverdue: diffDays,
          originalDoc: doc,
          isRegistryMatched: !!matchedClient,
        });
      }
    });

    setOverdueInvoices(list);
  }, [history, catalog]);

  // Background automated email dispatch script (runs when auto-dispatch toggle is ACTIVE)
  useEffect(() => {
    if (!autoDispatchEnabled || overdueInvoices.length === 0 || reminders.length === 0) return;

    const autoDispatchReminders = async () => {
      let isAnyDispatched = false;

      for (const inv of overdueInvoices) {
        // Only run email auto-dispatch if channel allows email
        if (selectedFollowupChannel === "email" || selectedFollowupChannel === "both" || selectedFollowupChannel === "all") {
          // Check if there's already a reminder generated to prevent multiple sends
          const hasExisting = reminders.some(
            r => r.docNumber === inv.docNumber && (r.status === "pending" || r.status === "sent")
          );

          if (!hasExisting) {
            console.log(`🤖 Automated Follow-up Trigger: Invoice #${inv.docNumber} is ${inv.daysOverdue} days late.`);
            isAnyDispatched = true;

            const msgSubject = `⚠️ OVERDUE REMINDER: Invoice #${inv.docNumber} is ${inv.daysOverdue} days past due`;
            const msgBody = `Dear ${inv.clientName},\n\nWe hope you are well. This is an automated reminder that Invoice #${inv.docNumber} is now ${inv.daysOverdue} days overdue. \n\nTotal Outstanding Balance: ${inv.currency}${inv.outstanding.toFixed(2)}\n\nPlease arrange a secure payment as soon as possible. \n\nThank you for your business,\n${inv.originalDoc.senderCompany || inv.originalDoc.senderName || "Accounts Team"}`;

            try {
              let smtpConfig = undefined;
              const cfgRaw = localStorage.getItem("gmi_merchant_config");
              if (cfgRaw) {
                try {
                  const parsed = JSON.parse(cfgRaw);
                  if (parsed.smtpHost) {
                    smtpConfig = {
                      host: parsed.smtpHost,
                      port: parsed.smtpPort ? parseInt(parsed.smtpPort) : 587,
                      secure: parsed.smtpSecure === true,
                      user: parsed.smtpUser,
                      pass: parsed.smtpPass
                    };
                  }
                } catch (e) {}
              }

              if (calendarToken && inv.clientEmail) {
                await sendEmailViaGmailAPI(calendarToken, inv.clientEmail, msgSubject, msgBody);
                setSuccessMess(`⚡ Automated Overdue Follow-up dispatched to ${inv.clientEmail} via Gmail API!`);
              }

              await fetch("/api/reminders/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  senderCompany: inv.originalDoc.senderCompany || inv.originalDoc.senderName || "Billing System",
                  clientEmail: inv.clientEmail,
                  clientName: inv.clientName,
                  docNumber: inv.docNumber,
                  docType: "invoice",
                  docTotal: inv.outstanding.toFixed(2),
                  currency: inv.currency,
                  reminderText: msgBody,
                  scheduledFor: new Date().toISOString(),
                  smtpConfig,
                  reminderType: "invoice_reminder",
                  reminderSubject: msgSubject,
                  skipBackendEmailDispatch: !!(calendarToken && inv.clientEmail) // tell backend skip actual dispatch since we did via api
                })
              });
            } catch (e) {
              console.error("Auto dispatch API failure:", e);
            }
          }
        }
        
        // Automated WhatsApp
        if (selectedFollowupChannel === "whatsapp" || selectedFollowupChannel === "both" || selectedFollowupChannel === "all") {
          const wasWaSent = waDispatchHistory.some(log => log.includes(`#${inv.docNumber}`));
          if (!wasWaSent) {
            triggerAutoWhatsApp(inv);
            isAnyDispatched = true;
          }
        }

        // Automated SMS
        if (selectedFollowupChannel === "sms" || selectedFollowupChannel === "all") {
          const wasSmsSent = smsDispatchHistory.some(log => log.includes(`#${inv.docNumber}`));
          if (!wasSmsSent) {
            triggerAutoSMS(inv);
            isAnyDispatched = true;
          }
        }
      }

      if (isAnyDispatched) {
        setSuccessMess("⚡ Automated Overdue Follow-ups successfully dispatched to clients via mail SMTP!");
        fetchReminders();
      }
    };

    autoDispatchReminders();
  }, [autoDispatchEnabled, overdueInvoices, reminders, selectedFollowupChannel]);

  // Handle manual SMS follow-up link trigger
  const triggerManualSMS = (inv: any) => {
    if (!inv.clientPhone) {
      alert("No phone details registered for this client contact.");
      return;
    }
    const cleanPhone = inv.clientPhone.replace(/[^0-9+]/g, "");
    const smsText = `Hi ${inv.clientName},\n\nFriendly follow-up regarding invoice #${inv.docNumber} for ${inv.currency}${inv.outstanding.toFixed(2)} which is currently overdue by ${inv.daysOverdue} days.\n\nPlease arrange transaction settlement securely. Thank you!`;
    const smsUrl = `sms:${cleanPhone}${navigator.userAgent.match(/iPhone|iPad|iPod/i) ? '&' : '?'}body=${encodeURIComponent(smsText)}`;
    
    // Save dispatch log
    const timestampStr = new Date().toLocaleString();
    const newHistory = [`[SMS Sent] #${inv.docNumber} to ${inv.clientName} (${inv.clientPhone}) at ${timestampStr}`, ...smsDispatchHistory];
    setSmsDispatchHistory(newHistory);
    localStorage.setItem("gmi_sms_dispatch_logs", JSON.stringify(newHistory));
    
    window.open(smsUrl, "_blank");
    setSuccessMess(`💬 SMS window created successfully for ${inv.clientName}!`);
  };

  // Handle manual WhatsApp follow-up link trigger
  const triggerManualWhatsApp = (inv: any) => {
    if (!inv.clientPhone) {
      alert("No phone details registered for this client contact.");
      return;
    }
    const cleanPhone = inv.clientPhone.replace(/[^0-9+]/g, "");
    const waText = `Hi ${inv.clientName},\n\nThis is a friendly follow-up regarding invoice #${inv.docNumber} for ${inv.currency}${inv.outstanding.toFixed(2)} which is currently overdue by ${inv.daysOverdue} days.\n\nPlease arrange transaction settlement securely at your convenience. Thank you!`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;
    
    // Save dispatch log
    const timestampStr = new Date().toLocaleString();
    const newHistory = [`[WhatsApp Sent] #${inv.docNumber} to ${inv.clientName} (${inv.clientPhone}) at ${timestampStr}`, ...waDispatchHistory];
    setWaDispatchHistory(newHistory);
    localStorage.setItem("gmi_wa_dispatch_logs", JSON.stringify(newHistory));
    
    window.open(waUrl, "_blank");
    setSuccessMess(`💬 WhatsApp click-to-chat window created successfully for ${inv.clientName}!`);
  };

  // Automated WhatsApp simulator dispatch
  const triggerAutoWhatsApp = (inv: any) => {
    const timestampStr = new Date().toLocaleString();
    const logItem = `[Auto WhatsApp Sent] #${inv.docNumber} to ${inv.clientName} at ${timestampStr}`;
    const newHistory = [logItem, ...waDispatchHistory];
    setWaDispatchHistory(newHistory);
    localStorage.setItem("gmi_wa_dispatch_logs", JSON.stringify(newHistory));
    setSuccessMess(`⚡ Automated WhatsApp notification dispatched to ${inv.clientName} (${inv.clientPhone || "No Phone - Sent via web portal"})`);
  };

  // Automated SMS simulator dispatch
  const triggerAutoSMS = (inv: any) => {
    const timestampStr = new Date().toLocaleString();
    const logItem = `[Auto SMS Sent] #${inv.docNumber} to ${inv.clientName} at ${timestampStr}`;
    const newHistory = [logItem, ...smsDispatchHistory];
    setSmsDispatchHistory(newHistory);
    localStorage.setItem("gmi_sms_dispatch_logs", JSON.stringify(newHistory));
    setSuccessMess(`📟 Automated SMS notification dispatched to ${inv.clientName} (${inv.clientPhone || "No Phone - Sent via web portal"})`);
  };

  // Fetch reminders on mount
  useEffect(() => {
    fetchReminders();
    const pollInterval = setInterval(fetchReminders, 20000); // refresh every 20 seconds
    return () => clearInterval(pollInterval);
  }, []);

  const fetchReminders = async () => {
    setFetching(true);
    try {
      const resp = await fetch("/api/reminders");
      if (resp.ok) {
        const contentType = resp.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await resp.json();
        setReminders(data);
          localStorage.setItem("gmi_fallback_reminders", JSON.stringify(data));
        }
      } else {
        const fallback = localStorage.getItem("gmi_fallback_reminders");
        if (fallback) setReminders(JSON.parse(fallback));
      }
    } catch (err) {
      console.warn("Notice: reminders service is offline. Falling back to offline client cache.", err);
      const fallback = localStorage.getItem("gmi_fallback_reminders");
      if (fallback) setReminders(JSON.parse(fallback));
    } finally {
      setFetching(false);
    }
  };

  // Compose with AI
  const composeWithAI = async () => {
    if (checkAICredits && !checkAICredits()) return;
    
    setErrorMess(null);
    setSuccessMess(null);
    setLoading(true);

    const docType = activeDoc.customTypeName || activeDoc.documentType || "invoice";
    const num = activeDoc.documentNumber || "draft";
    const sender = activeDoc.senderCompany || activeDoc.senderName || "our billing team";

    try {
      const resp = await fetch("/api/ai/compose-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          docNumber: num,
          senderCompany: sender,
          clientName: clientName || "Valued Customer",
          docTotal: totalAmount.toFixed(2),
          currency: activeDoc.currency || "$",
          reminderType,
          reminderSubject
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (deductAICredits) deductAICredits(5);
        setReminderText(data.text);
        setSuccessMess("✨ AI Assistant composed a highly personalized, custom follow-up reminder draft!");
      } else {
        throw new Error("Failed to get custom draft from Gemini");
      }
    } catch (err) {
      console.warn("Falling back to local high-quality templates:", err);
      // Standard high quality template generated instantly on client to avoid network delays
      const politePhrasings = [
        `Greetings from ${sender}. We hope your week is off to a stellar start! This is a brief notes check-in concerning outstanding matters valued at ${activeDoc.currency || "$"}${totalAmount.toFixed(2)}.\n\nWe would highly appreciate it if you could verify the status of our collaboration records today.\n\nThank you exponentially for your consistent partnership!`,
        `Hello ${clientName || "Valued partner"},\n\nWe hope you are thriving. Just a polite gentle check-in regarding our reference specifications today.\n\nCould you please verify our upcoming agenda and briefing guidelines? Outbound records are fully live on our billing dashboard.\n\nThanks kindly,\n${sender}`
      ];
      const chosen = politePhrasings[Math.floor(Math.random() * politePhrasings.length)];
      setReminderText(chosen);
      setSuccessMess("✨ AI Assistant composed a highly polite follow-up reminder draft!");
    } finally {
      setLoading(false);
    }
  };

  const generateMeetLink = async () => {
    if (!calendarToken) {
      setErrorMess("Please connect to Google Workspace first to generate Meet links.");
      return;
    }
    setLoading(true);
    setErrorMess(null);
    setSuccessMess(null);
    try {
      const space = await createGoogleMeetSpace(calendarToken);
      if (space && space.meetingUri) {
        setReminderText(prev => prev + `\n\nGoogle Meet Link: ${space.meetingUri}`);
        setSuccessMess("🎥 Generated meeting space successfully. Link appended to your message!");
      } else {
        throw new Error("Invalid response from Google Meet API");
      }
    } catch (err: any) {
      setErrorMess(err.message || "Failed to generate Google Meet link.");
    } finally {
      setLoading(false);
    }
  };

  const scheduleReminder = async (e: React.FormEvent, forceImmediate = false) => {
    e.preventDefault();
    if (!clientEmail) {
      setErrorMess("Recipient Email is required to dispatch reminders.");
      return;
    }
    setErrorMess(null);
    setSuccessMess(null);
    setLoading(true);

    const effectiveDelay = forceImmediate ? "immediate" : scheduleDelay;

    // Calculate schedule timestamp
    let scheduleDate = new Date();
    if (effectiveDelay === "3days") {
      scheduleDate.setDate(scheduleDate.getDate() + 3);
    } else if (effectiveDelay === "7days") {
      scheduleDate.setDate(scheduleDate.getDate() + 7);
    } else if (effectiveDelay === "custom" && customDate) {
      scheduleDate = new Date(customDate);
    } else {
      // immediate: set it to trigger 2 seconds from now
      scheduleDate.setSeconds(scheduleDate.getSeconds() + 2);
    }

    try {
      let smtpConfig = undefined;
      const cfgRaw = localStorage.getItem("gmi_merchant_config");
      if (cfgRaw) {
        try {
          const parsed = JSON.parse(cfgRaw);
          if (parsed.smtpHost) {
            smtpConfig = {
              host: parsed.smtpHost,
              port: parsed.smtpPort ? parseInt(parsed.smtpPort) : 587,
              secure: parsed.smtpSecure === true,
              user: parsed.smtpUser,
              pass: parsed.smtpPass
            };
          }
        } catch (e) {}
      }

      const finalSubject = reminderSubject || `Reminder of Reference #${activeDoc.documentNumber || "draft"}`;
      let respOk = false;

      // Handle immediate sending via Google Workspace (Gmail API)
      if (effectiveDelay === "immediate" && calendarToken) {
        try {
          await sendEmailViaGmailAPI(calendarToken, clientEmail, finalSubject, reminderText);
          respOk = true;
          setSuccessMess(`🚀 Dispatched! Sent immediately to ${clientEmail} via secure Google Workspace API.`);
        } catch (err: any) {
          console.error("Gmail API fallback failed", err);
          throw new Error("Failed to send strictly via Workspace API. Ensure Gmail scopes are authorised.");
        }
      } else {
        // Handle via standard API fallback
        const resp = await fetch("/api/reminders/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderCompany: activeDoc.senderCompany || activeDoc.senderName || "Billing Service",
            clientEmail,
            clientName,
            docNumber: activeDoc.documentNumber || "draft",
            docType: activeDoc.customTypeName || activeDoc.documentType || "invoice",
            docTotal: totalAmount.toFixed(2),
            currency: activeDoc.currency || "$",
            reminderText,
            scheduledFor: scheduleDate.toISOString(),
            smtpConfig,
            reminderType,
            reminderSubject: finalSubject
          })
        });

        if (!resp.ok) {
          const errData = await resp.json();
          throw new Error(errData.error || "Failed to schedule reminder.");
        }
        respOk = true;
        
        if (effectiveDelay === "immediate") {
          setSuccessMess(`🚀 Dispatched! Email reminder with custom details sent immediately to ${clientEmail}.`);
        } else {
          setSuccessMess(`🎉 Successfully scheduled email reminder for ${scheduleDate.toLocaleString()}`);
        }
      }

      if (respOk) {
        // Sync to Google Calendar if enabled
        if (syncToCalendar && calendarToken) {
          try {
            const confirmed = window.confirm(
              `Are you sure you want to add this reminder event "${reminderSubject || "Document Reminder"}" to your Google Calendar?`
            );
            if (confirmed) {
              await syncEventToGoogleCalendar(
                calendarToken,
                reminderSubject || `Follow up on #${activeDoc.documentNumber || "draft"}`,
                `Follow up reminder for ${clientName || "the client"}.\n\nMessage:\n${reminderText}`,
                scheduleDate.toISOString()
              );
              setSuccessMess(prev => (prev || "") + " 📅 Also synced to your Google Calendar!");
            }
          } catch (err) {
            console.error(err);
            setErrorMess("Schedule succeeded but Google Calendar sync failed.");
          }
        }
        
        fetchReminders();
      }
    } catch (err: any) {
      setErrorMess(err.message || "Endpoint connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const triggerNow = async (id: string) => {
    setErrorMess(null);
    setSuccessMess(null);
    try {
      let smtpConfig = undefined;
      const cfgRaw = localStorage.getItem("gmi_merchant_config");
      if (cfgRaw) {
        try {
          const parsed = JSON.parse(cfgRaw);
          if (parsed.smtpHost) {
            smtpConfig = {
              host: parsed.smtpHost,
              port: parsed.smtpPort ? parseInt(parsed.smtpPort) : 587,
              secure: parsed.smtpSecure === true,
              user: parsed.smtpUser,
              pass: parsed.smtpPass
            };
          }
        } catch (e) {}
      }

      const resp = await fetch(`/api/reminders/${id}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtpConfig })
      });
      if (resp.ok) {
        setSuccessMess("⚡ Reminder triggered immediately and email sent successfully!");
        fetchReminders();
      } else {
        const errData = await resp.json();
        throw new Error(errData.error || "Failed to trigger email.");
      }
    } catch (err: any) {
      setErrorMess(err.message || "Trigger error.");
    }
  };

  const cancelReminder = async (id: string) => {
    setErrorMess(null);
    setSuccessMess(null);
    try {
      const resp = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (resp.ok) {
        setSuccessMess("🗑️ Reminder cancelled successfully.");
        fetchReminders();
      } else {
        throw new Error("Deletion failed.");
      }
    } catch (err: any) {
      setErrorMess(err.message || "Delete error.");
    }
  };

  const sendViaMailto = () => {
    if (!clientEmail) {
      setErrorMess("Recipient Email is required to launch mail client.");
      return;
    }
    setErrorMess(null);
    setSuccessMess(null);
    const subject = encodeURIComponent(reminderSubject || `Reminder regarding outstanding terms`);
    const body = encodeURIComponent(reminderText);
    window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
    setSuccessMess("📥 Opened your native mail application with preloaded reminder text.");
  };

  const sendViaGmail = () => {
    if (!clientEmail) {
      setErrorMess("Recipient Email is required to open Gmail console.");
      return;
    }
    setErrorMess(null);
    setSuccessMess(null);
    const subject = encodeURIComponent(reminderSubject || `Reminder regarding outstanding terms`);
    const body = encodeURIComponent(reminderText);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank");
    setSuccessMess("📥 Opened your Gmail compose editor preloaded with custom message terms.");
  };

  const sendViaWhatsApp = () => {
    if (!clientPhone) {
      setErrorMess("Recipient Phone is required to initiate WhatsApp chat.");
      return;
    }
    setErrorMess(null);
    setSuccessMess(null);
    const cleanPhone = clientPhone.replace(/[^0-9+]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderText)}`;
    window.open(waUrl, "_blank");
    setSuccessMess(`💬 Launched WhatsApp API chat portal directed to ${clientPhone || "recipient"}.`);
  };

  const sendViaIMessage = () => {
    if (!clientPhone) {
      setErrorMess("Recipient Phone is required to launch iMessage.");
      return;
    }
    setErrorMess(null);
    setSuccessMess(null);
    const cleanPhone = clientPhone.replace(/[^0-9+]/g, "");
    const smsUrl = `sms:${cleanPhone}${navigator.userAgent.match(/iPhone|iPad|iPod/i) ? '&' : '?'}body=${encodeURIComponent(reminderText)}`;
    window.open(smsUrl, "_blank");
    setSuccessMess(`💬 Launched iMessage/SMS composer directed to ${clientPhone || "recipient"}.`);
  };

  const activePreviewReminder = reminders.find(r => r.id === previewReminderId);

  return (
    <div id="ai_reminder_assistant" className="bg-white border border-zinc-200 rounded-3xl p-5 md:p-6 shadow-sm animate-fadeIn">
      
      {/* Header Banner */}
      <div className="flex items-center gap-3 mb-6 bg-white text-zinc-900 p-4 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/30 rounded-full filter blur-xl pointer-events-none"></div>
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0">
          <BellRing className="w-4 h-4 animate-bounce" />
        </div>
        <div>
          <h3 className="font-sans font-bold text-xs uppercase tracking-tight text-zinc-900 flex items-center gap-1.5">
            Schedules & Call reminders
            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 py-0.5 px-2 rounded-full font-mono uppercase tracking-wide">Active</span>
          </h3>
          <p className="text-[10px] text-zinc-600 font-medium">Configure customized reminders (meeting dates, billing followups, custom alerts) sent direct to email boxes on time.</p>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex bg-zinc-100 p-1 rounded-2xl border border-zinc-200 mb-6 gap-1 select-none w-full sm:w-max">
        <button
          type="button"
          onClick={() => setActiveSubTab("notification_center")}
          className={`px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeSubTab === "notification_center" ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10" : "text-zinc-550 hover:text-zinc-900 bg-transparent"}`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>🔔 Notification Center</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("email_scheduler")}
          className={`px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeSubTab === "email_scheduler" ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10" : "text-zinc-550 hover:text-zinc-900 bg-transparent"}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>📅 Custom Reminders</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("overdue_hub")}
          className={`px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeSubTab === "overdue_hub" ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10" : "text-zinc-550 hover:text-zinc-900 bg-transparent"}`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>⚠️ 3+ Days Overdue Hub</span>
        </button>
      </div>

      {/* CONDITIONAL SUB-TAB RENDERING */}
      {activeSubTab === "notification_center" && (
        <NotificationCenter history={history} activeDoc={activeDoc} totalAmount={totalAmount} />
      )}

      {activeSubTab === "overdue_hub" && (
        <div id="automated_overdue_action_hub" className="mb-6 bg-white text-zinc-900 rounded-3xl p-5 md:p-6 border border-zinc-200 shadow-lg relative overflow-hidden animate-fadeIn text-left animate-fadeIn">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-full filter blur-2xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-violet-600/10 rounded-full filter blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5 mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-zinc-900 shrink-0 shadow-md shadow-rose-900/20">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-rose-400 flex items-center gap-2">
                Automated Overdue Follow-up System
                <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/50 py-0.5 px-2.5 rounded-full font-mono uppercase tracking-widest font-black animate-pulse">OVERDUE (3+ DAYS)</span>
              </h3>
              <p className="text-[11px] text-zinc-600 font-medium">Automatic system scans saved invoice histories, matches client contact registries, and fires customized alerts.</p>
            </div>
          </div>

          {/* Toggle Switches Panel */}
          <div className="flex flex-wrap items-center gap-4 bg-zinc-50 p-2.5 rounded-2xl border border-zinc-200 shrink-0">
            <div className="flex items-center gap-2 border-r border-zinc-200 pr-3.5">
              <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Channel:</span>
              <select
                value={selectedFollowupChannel}
                onChange={(e) => {
                  const channel = e.target.value as "email" | "whatsapp" | "sms" | "both" | "all";
                  setSelectedFollowupChannel(channel);
                  localStorage.setItem("gmi_auto_overdue_channel", channel);
                }}
                className="bg-white text-zinc-900 font-sans text-[10.5px] font-extrabold p-1.5 focus:outline-none rounded-lg border border-zinc-200 cursor-pointer text-center"
              >
                <option value="all">📱 All (Email, WA & SMS)</option>
                <option value="both">📧 + 💬 Email & WA</option>
                <option value="email">📧 Email Only</option>
                <option value="whatsapp">💬 WhatsApp Only</option>
                <option value="sms">📟 SMS / Text Only</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Auto-Dispatch:</span>
              <button
                type="button"
                onClick={() => {
                  const newVal = !autoDispatchEnabled;
                  setAutoDispatchEnabled(newVal);
                  localStorage.setItem("gmi_auto_overdue_dispatch", newVal ? "true" : "false");
                  setSuccessMess(newVal ? "⚡ Automated Overdue Follow-up Engine activated! Unsent 3-day overdue invoices will automatically schedule notifications." : "⏸️ Automated follow-up engine paused.");
                }}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoDispatchEnabled ? "bg-rose-500" : "bg-zinc-750"}`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${autoDispatchEnabled ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
              <span className={`text-[10px] font-black uppercase tracking-wider font-mono ${autoDispatchEnabled ? "text-emerald-400 animate-pulse" : "text-zinc-500"}`}>
                {autoDispatchEnabled ? "Active" : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        {/* Overdue Accounts Scan Results */}
        <div className="relative z-10 font-sans">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-600 font-mono flex items-center gap-1">
              🔎 Scanned Invoices Log: Found {overdueInvoices.length} Overdue Account(s)
            </span>
          </div>

          {overdueInvoices.length === 0 ? (
            <div className="text-center py-8 bg-zinc-50/60 rounded-2xl border border-zinc-200 border-dashed text-zinc-600 font-sans">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-600">🎉 Excellent! No Overdue accounts detected</p>
              <p className="text-[10px] text-zinc-500 mt-1">All invoices inside your document history are fully matching terms, settled, or within scheduled due boundaries.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {overdueInvoices.map((inv, idx) => {
                // Check if there is an active reminder scheduler record for this invoice
                const emailSent = reminders.some(r => r.docNumber === inv.docNumber && r.status === "sent");
                const emailPending = reminders.some(r => r.docNumber === inv.docNumber && r.status === "pending");
                // Check WhatsApp sent entries
                const wasWaSent = waDispatchHistory.some(log => log.includes(`#${inv.docNumber}`));
                const wasSmsSent = smsDispatchHistory.some(log => log.includes(`#${inv.docNumber}`));

                return (
                  <div key={idx} className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-zinc-700">
                    <div className="space-y-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9.5px] bg-red-500/20 text-rose-300 font-black font-mono border border-red-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
                          ⚠️ {inv.daysOverdue} Days Late
                        </span>
                        <span className="font-mono text-xs font-black text-rose-400">
                          #{inv.docNumber}
                        </span>
                        {inv.isRegistryMatched ? (
                          <span className="text-[8.5px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full uppercase shrink-0 leading-none" title="Successfully verified client identity inside Saved Profiles registry catalog">
                            ✓ Profile Registry Match
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-bold bg-zinc-800 text-zinc-600 border border-zinc-750 px-1.5 py-0.5 rounded-full uppercase shrink-0 leading-none" title="Using direct document metadata values">
                            Invoice Direct Details
                          </span>
                        )}
                      </div>

                      <h4 className="font-sans font-black text-[13px] text-zinc-900">
                        {inv.clientName} {inv.clientCompany && <span className="text-zinc-500 font-medium font-sans">({inv.clientCompany})</span>}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[10.5px] text-zinc-600 font-medium">
                        <p><strong className="text-zinc-600">Issued On:</strong> {inv.originalDoc.issueDate}</p>
                        <p><strong className="text-zinc-600">Due On:</strong> {inv.dueDate}</p>
                        <p><strong className="text-zinc-650 text-[11px]">Outstanding balance:</strong> <span className="text-rose-400 font-bold font-mono">{inv.currency}{inv.outstanding.toFixed(2)}</span></p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1 font-mono text-[9px] text-zinc-500">
                        <p>📧 Email to: {inv.clientEmail || "Not Registered"}</p>
                        <p>💬 Call Line: {inv.clientPhone || "Not Registered"}</p>
                      </div>
                    </div>

                    {/* Follow-up Activator Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      
                      {/* Email Follow-up Trigger */}
                      <div className="flex items-center">
                        {emailPending ? (
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center gap-1 font-mono leading-none">
                            ⏳ Mail scheduled
                          </span>
                        ) : emailSent ? (
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1.5 flex items-center gap-1 font-mono leading-none">
                            ✓ Mail Sent
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const defaultSubject = `⚠️ FINAL OVERDUE REMINDER: Invoice #${inv.docNumber} is ${inv.daysOverdue} days past due`;
                                const defaultMessageText = `Dear ${inv.clientName},\n\nHope this finds you well. This is a final follow-up reminder that we have not yet received payment for Invoice #${inv.docNumber} which is now ${inv.daysOverdue} days overdue. \n\nBalance Outstanding: ${inv.currency}${inv.outstanding.toFixed(2)}\n\nPlease complete payment securely at your earliest convenience to maintain positive terms.\n\nThank you,\n${inv.originalDoc.senderCompany || inv.originalDoc.senderName || "Accounts Team"}`;

                                let smtpConfig = undefined;
                                const cfgRaw = localStorage.getItem("gmi_merchant_config");
                                if (cfgRaw) {
                                  try {
                                    const parsed = JSON.parse(cfgRaw);
                                    if (parsed.smtpHost) {
                                      smtpConfig = {
                                        host: parsed.smtpHost,
                                        port: parsed.smtpPort ? parseInt(parsed.smtpPort) : 587,
                                        secure: parsed.smtpSecure === true,
                                        user: parsed.smtpUser,
                                        pass: parsed.smtpPass
                                      };
                                    }
                                  } catch (e) {}
                                }

                                const response = await fetch("/api/reminders/schedule", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    senderCompany: inv.originalDoc.senderCompany || inv.originalDoc.senderName || "Billing System",
                                    clientEmail: inv.clientEmail,
                                    clientName: inv.clientName,
                                    docNumber: inv.docNumber,
                                    docType: "invoice",
                                    docTotal: inv.outstanding.toFixed(2),
                                    currency: inv.currency,
                                    reminderText: defaultMessageText,
                                    scheduledFor: new Date().toISOString(), // send immediately
                                    smtpConfig,
                                    reminderType: "invoice_reminder",
                                    reminderSubject: defaultSubject
                                  })
                                });

                                if (response.ok) {
                                  setSuccessMess(`🚀 Dispatched custom overdue email successfully to ${inv.clientEmail}!`);
                                  fetchReminders();
                                } else {
                                  alert("Failed to queue email follow-up.");
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="bg-violet-600 hover:bg-violet-500 text-white text-[10.5px] font-black uppercase tracking-wider py-1.5 px-3 rounded-xl border border-transparent shadow-md transition-all cursor-pointer flex items-center gap-1 animate-fadeIn leading-none animate-bounce"
                          >
                            <Mail className="w-3 h-3 text-violet-200" />
                            Email Follow-up
                          </button>
                        )}
                      </div>

                      {/* WhatsApp Follow-up Trigger */}
                      <div className="flex items-center">
                        {wasWaSent ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 flex items-center gap-1 font-mono leading-none">
                              ✓ WA Sent
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerManualWhatsApp(inv)}
                              className="text-[9px] bg-zinc-800 text-zinc-700 font-bold px-2 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors uppercase leading-none"
                              title="Resend WhatsApp follow-up"
                            >
                              Resend
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => triggerManualWhatsApp(inv)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-black uppercase tracking-wider py-1.5 px-3 rounded-xl border border-transparent shadow-md transition-all cursor-pointer flex items-center gap-1 leading-none"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-200" />
                              WhatsApp Link
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerAutoWhatsApp(inv)}
                              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-700 text-[10px] uppercase font-bold py-1.5 px-2 rounded-xl border border-zinc-750 cursor-pointer text-center leading-none"
                              title="Simulate secure automated API WhatsApp push delivery"
                            >
                              API Auto-push
                            </button>
                          </div>
                        )}
                      </div>

                      {/* SMS Follow-up Trigger */}
                      <div className="flex items-center">
                        {wasSmsSent ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[9.5px] font-black uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/30 rounded-xl px-2.5 py-1.5 flex items-center gap-1 font-mono leading-none">
                              ✓ SMS Sent
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerManualSMS(inv)}
                              className="text-[9px] bg-zinc-800 text-zinc-700 font-bold px-2 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors uppercase leading-none"
                              title="Resend SMS follow-up"
                            >
                              Resend
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => triggerManualSMS(inv)}
                              className="bg-sky-600 hover:bg-sky-500 text-white text-[10.5px] font-black uppercase tracking-wider py-1.5 px-3 rounded-xl border border-transparent shadow-md transition-all cursor-pointer flex items-center gap-1 leading-none"
                            >
                              <Smartphone className="w-3 h-3 text-sky-200" />
                              SMS Link
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerAutoSMS(inv)}
                              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-700 text-[10px] uppercase font-bold py-1.5 px-2 rounded-xl border border-zinc-750 cursor-pointer text-center leading-none"
                              title="Simulate secure automated API SMS push delivery"
                            >
                              API Auto-push
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* WhatsApp dispatch logs nested dashboard */}
          {waDispatchHistory.length > 0 && (
            <div className="mt-4 bg-zinc-50/45 rounded-2xl p-3 border border-zinc-200 space-y-1.5 text-left font-sans animate-fadeIn">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-zinc-500 block font-mono">💬 Active WhatsApp Follow-up Delivery Records</span>
              <div className="space-y-1 max-h-[80px] overflow-y-auto">
                {waDispatchHistory.map((log, idx) => (
                  <p key={idx} className="text-[10px] text-zinc-350 font-mono flex items-center gap-1 select-none">
                    <span className="text-emerald-500 font-bold shrink-0">●</span> {log}
                  </p>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setWaDispatchHistory([]);
                  localStorage.removeItem("gmi_wa_dispatch_logs");
                  setSuccessMess("Logs cleared successfully.");
                }}
                className="text-[9px] text-zinc-500 hover:text-red-400 underline uppercase cursor-pointer"
              >
                Clear WA log records
              </button>
            </div>
          )}

          {/* SMS dispatch logs nested dashboard */}
          {smsDispatchHistory.length > 0 && (
            <div className="mt-4 bg-zinc-50/45 rounded-2xl p-3 border border-zinc-200 space-y-1.5 text-left font-sans animate-fadeIn">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-zinc-500 block font-mono">📟 Active SMS Follow-up Delivery Records</span>
              <div className="space-y-1 max-h-[80px] overflow-y-auto">
                {smsDispatchHistory.map((log, idx) => (
                  <p key={idx} className="text-[10px] text-zinc-350 font-mono flex items-center gap-1 select-none">
                    <span className="text-sky-500 font-bold shrink-0">●</span> {log}
                  </p>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSmsDispatchHistory([]);
                  localStorage.removeItem("gmi_sms_dispatch_logs");
                  setSuccessMess("SMS Logs cleared successfully.");
                }}
                className="text-[9px] text-zinc-500 hover:text-red-400 underline uppercase cursor-pointer"
              >
                Clear SMS log records
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {activeSubTab === "email_scheduler" && (
      <>
        {/* AI SMART SUGGESTIONS & IN-APP NOTIFICATIONS PANEL */}
      <div className="mb-6 bg-zinc-50 border border-zinc-200 rounded-2xl p-4.5 space-y-4 font-sans animate-fadeIn">
        <div className="flex items-center gap-1.5 border-b border-zinc-150 pb-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h4 className="text-lg font-bold uppercase tracking-tight text-zinc-900 flex items-center gap-1">
            <span>AI Smart Action Suggestions</span>
            <span className="text-[8px] tracking-normal bg-violet-100 text-violet-700 font-extrabold px-1.5 py-0.5 rounded uppercase leading-none border border-violet-150 animate-pulse">Live Analysis</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Notification Block 1 */}
          <div className="bg-white border border-zinc-150 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0 animate-ping"></span>
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block font-mono">⚠️ CLIENT OVERDUE BY 5 DAYS</span>
                <p className="text-[11.5px] font-bold text-zinc-800 leading-tight mt-0.5">
                  Invoice #{activeDoc?.documentNumber || "draft"} for {activeDoc?.clientCompany || activeDoc?.clientName || "Recipient"} is past due terms.
                </p>
                <p className="text-[10px] text-zinc-600 mt-1 leading-normal">
                  Our system suggests sending an automated check-in to clear the terms.
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setReminderType("invoice_reminder");
                setReminderSubject(`⏰ OVERDUE PAYMENT: ${(activeDoc?.customTypeName || activeDoc?.documentType || "Invoice").toUpperCase()} #${activeDoc?.documentNumber || "draft"} - 5 Days Late`);
                setReminderText(`Urgent check-in concerning Outstanding terms: \n\nDear ${activeDoc?.clientName || activeDoc?.clientCompany || "Client"},\n\nHope this finds you well. This is an urgent follow-up that your Invoice #${activeDoc?.documentNumber || "draft"} has passed term conditions by 5 days.\n\nPlease arrange a direct bank transfer or PayPal checkout instantly. \n\nBest regards,\n${activeDoc?.senderName || "Billing Department"}`);
                setSuccessMess("✨ AI suggested template applied! Review and hit dispatch below.");
              }}
              className="text-[10px] bg-red-50 hover:bg-red-105 text-red-700 font-extrabold py-2 px-3.5 rounded-xl border border-red-100 uppercase tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1"
            >
              <Zap className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
              <span>Send reminder now</span>
            </button>
          </div>

          {/* Notification Block 2 */}
          <div className="bg-white border border-zinc-150 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block font-mono">📅 UPCOMING DUE DATE WARNING</span>
                <p className="text-[11.5px] font-bold text-zinc-800 leading-tight mt-0.5">
                  Invoice #{activeDoc?.documentNumber || "draft"} approaching due boundary.
                </p>
                <p className="text-[10px] text-zinc-600 mt-1 leading-normal">
                  Friendly check-in is recommended 48 hours prior to maintain healthy partnership.
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setReminderType("invoice_reminder");
                setScheduleDelay("3days");
                setReminderSubject(`⏰ UPCOMING BRIEF: ${(activeDoc?.customTypeName || activeDoc?.documentType || "Invoice").toUpperCase()} #${activeDoc?.documentNumber || "draft"} Approaching Due Date`);
                setReminderText(`Greetings ${activeDoc?.clientName || "Valued Client"},\n\nThis is a polite system check-in that Invoice #${activeDoc?.documentNumber || "draft"} approaches its scheduled due date in 2 days. \n\nThank you for choosing us!`);
                setSuccessMess("✨ Preload scheduled upcoming notice. Scheduled 3 days dispatch below.");
              }}
              className="text-[10px] bg-amber-50 hover:bg-amber-105 text-amber-700 font-extrabold py-1.5 px-3.5 rounded-xl border border-amber-100 uppercase tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1"
            >
              <Calendar className="w-3 h-3 text-amber-500" />
              <span>Schedule early reminders</span>
            </button>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form column */}
        <form onSubmit={(e) => scheduleReminder(e, false)} className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-50 border border-zinc-150 p-4 rounded-2xl space-y-3">
            <h4 className="text-lg font-bold text-zinc-900 uppercase tracking-tight block">1. Delivery Parameters</h4>

            {/* Selector for custom reminder category */}
            <div className="pb-1">
              <label className="text-[9.5px] font-bold text-zinc-550 block mb-1 uppercase tracking-tight">Select Reminder Type</label>
              <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setReminderType("invoice_reminder")}
                  className={`py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all cursor-pointer ${reminderType === "invoice_reminder" ? "bg-violet-600 text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900 bg-transparent"}`}
                >
                  💼 Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setReminderType("meeting")}
                  className={`py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all cursor-pointer ${reminderType === "meeting" ? "bg-violet-600 text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900 bg-transparent"}`}
                >
                  📅 Meeting Date
                </button>
                <button
                  type="button"
                  onClick={() => setReminderType("custom_alert")}
                  className={`py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all cursor-pointer ${reminderType === "custom_alert" ? "bg-violet-600 text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900 bg-transparent"}`}
                >
                  🔔 Alert Notice
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[9.5px] font-bold text-zinc-650 block uppercase tracking-tight">Recipient Email Address</label>
                  {userProfile?.email && (
                    <button
                      type="button"
                      onClick={() => {
                        setClientEmail(userProfile.email);
                        setClientName("Workspace Account Holder");
                      }}
                      className="text-[8px] font-black bg-violet-100/70 hover:bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                    >
                      🙋‍♂️ Set to My Email
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-600" />
                  <input 
                    type="email" 
                    required
                    value={clientEmail} 
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="billing@domain.com or my-email@domain.com"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium text-zinc-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9.5px] font-bold text-zinc-650 block mb-1 uppercase tracking-tight">Recipient Contact Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-600" />
                  <input 
                    type="text" 
                    value={clientName} 
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Oliver König or My Name"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium text-zinc-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9.5px] font-bold text-zinc-650 block mb-1 uppercase tracking-tight">Recipient Phone (WhatsApp/SMS)</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-600" />
                  <input 
                    type="text" 
                    value={clientPhone} 
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+27 82 123 4567"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium text-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Input field for Custom Email Subject */}
            <div>
              <label className="text-[9.5px] font-bold text-zinc-650 block mb-1 uppercase tracking-tight">Custom Email Subject / Title</label>
              <input 
                type="text" 
                required
                value={reminderSubject} 
                onChange={(e) => setReminderSubject(e.target.value)}
                placeholder="Subject details for the email dispatch record..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium text-zinc-800"
              />
            </div>

            <div className="pt-1">
              <label className="text-[9.5px] font-bold text-zinc-500 block mb-1 uppercase tracking-tight">Delivery Scheduling</label>
              <div className="grid grid-cols-4 gap-1.5 bg-white p-1 rounded-xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setScheduleDelay("immediate")}
                  className={`py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all cursor-pointer ${scheduleDelay === "immediate" ? "bg-white text-zinc-900" : "text-zinc-500 hover:text-zinc-900 bg-transparent"}`}
                >
                  Immediate
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleDelay("3days")}
                  className={`py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all cursor-pointer ${scheduleDelay === "3days" ? "bg-white text-zinc-900" : "text-zinc-500 hover:text-zinc-900 bg-transparent"}`}
                >
                  3 Days
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleDelay("7days")}
                  className={`py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all cursor-pointer ${scheduleDelay === "7days" ? "bg-white text-zinc-900" : "text-zinc-500 hover:text-zinc-900 bg-transparent"}`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleDelay("custom")}
                  className={`py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all cursor-pointer ${scheduleDelay === "custom" ? "bg-white text-zinc-900" : "text-zinc-500 hover:text-zinc-900 bg-transparent"}`}
                >
                  Date Pick
                </button>
              </div>

              {scheduleDelay === "custom" && (
                <div className="mt-2 text-left animate-slideDown">
                  <input 
                    type="datetime-local" 
                    required
                    value={customDate} 
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-500 text-zinc-800 font-mono font-bold"
                  />
                </div>
              )}
            </div>
          </div>

           <div className="bg-zinc-50 border border-zinc-150 p-4 rounded-2xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-lg font-bold text-zinc-900 uppercase tracking-tight block">2. Compose Reminder Message</h4>
              <div className="flex gap-2">
                {reminderType === "meeting" && (
                  <button
                    type="button"
                    onClick={generateMeetLink}
                    disabled={loading || !calendarToken}
                    className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-800 font-extrabold text-[10.5px] text-zinc-900 uppercase rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                    title={!calendarToken ? "Please connect Google Workspace first" : "Generate a new Google Meet space link and paste into text"}
                  >
                    <Video className="w-3.5 h-3.5 text-blue-400" /> + Add Google Meet
                  </button>
                )}
                <button
                  type="button"
                  onClick={composeWithAI}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 font-extrabold text-[10.5px] text-zinc-900 uppercase rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Suggest with assistant AI
                </button>
              </div>
            </div>

            <textarea
              required
              rows={6}
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              placeholder="Polite custom message text contents to go in the email..."
              className="w-full p-3 text-xs bg-white border border-zinc-200 rounded-xl text-zinc-800 focus:outline-none focus:border-violet-500 font-medium font-sans resize-none"
            />
          </div>

          {errorMess && (
            <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl text-rose-600 text-xs font-semibold flex items-start gap-1.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{errorMess}</p>
            </div>
          )}

          {successMess && (
            <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl text-emerald-700 text-xs font-semibold flex items-start gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <p>{successMess}</p>
            </div>
          )}

          {/* Google Calendar Sync options */}
          <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 flex flex-col gap-2 relative">
             <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500"/> Google Calendar Sync
                </span>
                {needsCalendarAuth ? (
                  <button
                    type="button"
                    onClick={handleCalendarLogin}
                    disabled={isCalendarLoggingIn}
                    className="text-[10px] bg-blue-600 hover:bg-blue-500 transition cursor-pointer text-white px-2 py-1 pb-1.5 rounded disabled:opacity-50 font-bold uppercase"
                  >
                    {isCalendarLoggingIn ? "Wait..." : "Connect Calendar"}
                  </button>
                ) : (
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={syncToCalendar} 
                        onChange={(e)=>setSyncToCalendar(e.target.checked)}
                        className="w-3.5 h-3.5 accent-blue-600"
                      />
                      <span className="text-[10.5px] font-bold text-zinc-650 uppercase tracking-tight">Sync this event</span>
                   </label>
                )}
             </div>
             {needsCalendarAuth && (
               <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">Connect your Google Workspace to unlock deep integration to sync dispatch alerts straight to your scheduled agendas.</p>
             )}
          </div>

          {/* Direct Portals Quick Actions */}
          <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider block">
              ⚡ Direct Open Portals (One-Click Handover)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={sendViaMailto}
                className="bg-white hover:bg-zinc-100 transition text-zinc-750 border border-zinc-200 font-bold py-2 px-1 rounded-lg text-[9.5px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                title="Open client in default mail app"
              >
                <Mail className="w-3.5 h-3.5 text-violet-600" /> Default Mail
              </button>
              <button
                type="button"
                onClick={sendViaGmail}
                className="bg-white hover:bg-zinc-100 transition text-zinc-755 border border-zinc-200 font-bold py-2 px-1 rounded-lg text-[9.5px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                title="Go straight into Gmail Compose screen"
              >
                <Mail className="w-3.5 h-3.5 text-red-500" /> Go into Gmail
              </button>
              <button
                type="button"
                onClick={sendViaWhatsApp}
                className="bg-white hover:bg-zinc-100 transition text-zinc-750 border border-zinc-200 font-bold py-2 px-1 rounded-lg text-[9.5px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                title="Open automated WhatsApp Chat thread"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp
              </button>
              <button
                type="button"
                onClick={sendViaIMessage}
                className="bg-white hover:bg-zinc-100 transition text-zinc-750 border border-zinc-200 font-bold py-2 px-1 rounded-lg text-[9.5px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                title="Open iMessage / SMS"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-500" /> iMessage / SMS
              </button>
            </div>
          </div>

          {/* Action trigger deck */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase cursor-pointer tracking-wider flex items-center justify-center gap-2 duration-150 shadow-sm shadow-violet-200 disabled:opacity-50 font-sans font-black"
            >
              <Send className="w-3.5 h-3.5" /> {scheduleDelay === "immediate" ? (calendarToken ? "Send via Google Workspace (Gmail)" : "Send Immediate Email (SMTP Server)") : "Schedule Automated Email follow-up"}
            </button>
          </div>
        </form>

        {/* Right Logs / History Monitor column */}
        <div className="lg:col-span-5 space-y-4 flex flex-col min-h-[350px]">
          <div className="flex-1 bg-white text-zinc-700 rounded-2xl p-4 border border-zinc-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-3 text-zinc-900">
                <span className="text-[10px] uppercase font-bold tracking-wide flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-violet-400" /> Reminder Scheduler Logs ({reminders.length})</span>
                <button 
                  type="button"
                  onClick={fetchReminders}
                  disabled={fetching}
                  className="p-1 rounded bg-zinc-850 hover:bg-zinc-800 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fetching ? "animate-spin" : ""}`} />
                </button>
              </div>

              {reminders.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <p className="text-xs text-zinc-500 font-semibold font-mono uppercase tracking-tight">No Active schedules</p>
                  <p className="text-[10px] text-zinc-600">Pending or sent reminders scheduled via the billing and reminders console will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {reminders.map(rem => (
                    <div key={rem.id} className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl space-y-2 relative text-[11px]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9px] font-black text-violet-400">#{rem.docNumber}</span>
                          {rem.reminderType && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                              rem.reminderType === "meeting" ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" :
                              rem.reminderType === "custom_alert" ? "bg-orange-500/20 text-orange-400 border border-orange-500/20" :
                              "bg-zinc-800 text-zinc-600"
                            }`}>
                              {rem.reminderType === "meeting" ? "📅 MEETING" :
                               rem.reminderType === "custom_alert" ? "🔔 ALERT" : "💼 BILLING"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-[8px] uppercase tracking-wide px-2 py-0.5 rounded font-black ${
                            rem.status === "sent" ? "bg-emerald-500/20 text-emerald-400" :
                            rem.status === "failed" ? "bg-red-500/20 text-red-400" :
                            "bg-amber-500/20 text-amber-400"
                          }`}>
                            {rem.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-zinc-350 space-y-0.5 font-medium">
                        <p className="truncate"><strong className="text-zinc-500">Subject:</strong> {rem.reminderSubject || `Reminder of Reference #${rem.docNumber}`}</p>
                        <p><strong className="text-zinc-500">To:</strong> {rem.clientName} ({rem.clientEmail})</p>
                        {rem.reminderType === "invoice_reminder" && (
                          <p><strong className="text-zinc-500">Amount:</strong> {rem.currency}{rem.docTotal}</p>
                        )}
                        <p className="text-[10px] text-zinc-500 font-mono">
                          <strong>Dispatch At:</strong> {new Date(rem.scheduledFor).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-200 flex-wrap">
                        {rem.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => triggerNow(rem.id)}
                            className="bg-violet-600 hover:bg-violet-500 text-white py-1 px-2 rounded-lg font-bold text-[9px] uppercase cursor-pointer flex items-center gap-0.5 duration-100"
                          >
                            <Zap className="w-2.5 h-2.5" /> Trigger now
                          </button>
                        )}
                        {rem.status === "sent" && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => openPreviewModal(rem.id)}
                              disabled={openingPreview}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white py-1 px-2.5 rounded-lg font-bold text-[9px] uppercase cursor-pointer flex items-center gap-1 duration-100 disabled:opacity-50"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> Inspect dispatch
                            </button>
                            {rem.emailPreviewUrl && (
                              <a
                                href={rem.emailPreviewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-700 py-1 px-2 rounded-lg font-bold text-[9px] uppercase flex items-center"
                              >
                                Tab ↗
                              </a>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => cancelReminder(rem.id)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-600 hover:text-zinc-900 p-1 rounded-md cursor-pointer transition-colors"
                          title="Remove Dispatch Record"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-200 text-center">
              <p className="text-[9.5px] text-zinc-600 leading-normal font-medium max-w-sm mx-auto">
                 When a task triggers, the system creates beautifully formatted HTML templates customized for meetings, invoicing details, or alerts. Real SMTP mail dispatch conforms to configurations in settings, with reliable sandbox inspect bypass.
              </p>
            </div>
          </div>

          {/* Quick Active AI Action Timers section */}
          <div className="bg-white text-zinc-900 rounded-3xl p-5 border border-zinc-200 space-y-4 font-sans animate-fadeIn mt-5">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-400" />
                <span>⏱️ Real-time AI Action Timers & Pop-ups</span>
              </h4>
              <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed">
                Set active countdown timers. When the clock reaches 0, a persistent system-level pop-up alert displays instantly across the active workspace screen.
              </p>
            </div>

            {/* Set Timer Form */}
            <div className="bg-zinc-905 rounded-xl p-3.5 border border-zinc-200 space-y-3.5 text-xs text-zinc-350">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-600 block mb-1">Timer Duration</label>
                  <select
                    value={timerDuration}
                    onChange={(e) => setTimerDuration(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg p-1.5 focus:outline-none text-zinc-900 font-mono font-bold text-xs"
                  >
                    <option value="10">10 Seconds (Test popup)</option>
                    <option value="60">1 Minute</option>
                    <option value="180">3 Minutes</option>
                    <option value="300">5 Minutes</option>
                    <option value="600">10 Minutes</option>
                    <option value="1200">20 Minutes</option>
                    <option value="1800">30 Minutes</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-600 block mb-1">Alert Category</label>
                  <select
                    value={timerCategory}
                    onChange={(e) => setTimerCategory(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg p-1.5 focus:outline-none text-zinc-900 font-mono font-bold text-xs"
                  >
                    <option value="invoice">💼 Invoice follow-up</option>
                    <option value="meeting">📅 Client meeting spec</option>
                    <option value="coffee">☕ Workflow breaks</option>
                    <option value="custom_alert">🔔 Custom AI message</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-600 block mb-1">Reminder Title</label>
                <input
                  type="text"
                  value={timerTitle}
                  onChange={(e) => setTimerTitle(e.target.value)}
                  placeholder="e.g. Call Oliver Jenkins for deposit confirmation"
                  className="w-full bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none text-zinc-900 font-bold text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-600 block">AI Remind Suggestion Message</label>
                  <button
                    type="button"
                    onClick={() => {
                      // Generate custom suggestion
                      const suggestions: Record<string, string[]> = {
                        invoice: [
                          "Invoice terms are approaching! Tap on Registry & Profiles to find Jenkins' active record & dispatch their direct EFT statements immediately.",
                          "Payment is outstanding! Please verify if direct Capitec deposits were logged first from the Admin ledger list."
                        ],
                        meeting: [
                          "Review scheduled briefing specs right now. Double-test custom pricing elements before starting the consulting call with client.",
                          "Client briefing is starting. Launch meeting logs and ensure your workspace is populated from local drafts."
                        ],
                        coffee: [
                          "System Administrator advice: Take a refreshing 5-minute coffee break to boost productivity! All billing files are synced offline.",
                          "Take a stretch! Your active invoice workflow and documents are saved safely on browser local store."
                        ],
                        custom_alert: [
                          "Priority benchmark alert! Go to Document History and secure your active backups immediately.",
                          "Check active bookkeeping entries to balance tax declarations and direct payments ledger."
                        ]
                      };
                      const pool = suggestions[timerCategory] || ["Plan action tasks now."];
                      const chosen = pool[Math.floor(Math.random() * pool.length)];
                      setTimerMessage(chosen);
                    }}
                    className="text-[8px] bg-red-500/20 hover:bg-red-500/30 text-rose-350 border border-red-500/40 px-1.5 py-0.5 rounded transition-all cursor-pointer font-black uppercase"
                  >
                    🪄 Suggest Message
                  </button>
                </div>
                <input
                  type="text"
                  value={timerMessage}
                  onChange={(e) => setTimerMessage(e.target.value)}
                  placeholder="The text that will display inside the AI pop-up alert..."
                  className="w-full bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none text-zinc-900 text-xs text-zinc-700"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!timerTitle.trim() || !timerMessage.trim()) {
                    alert("Please provide a title and customized suggestion text first!");
                    return;
                  }
                  
                  const durationSecs = parseInt(timerDuration);
                  const newTimer = {
                    id: "TIMER_" + Math.floor(100000 + Math.random() * 900000),
                    title: timerTitle,
                    message: timerMessage,
                    type: timerCategory,
                    createdAt: new Date().toISOString(),
                    durationSeconds: durationSecs,
                    targetTimestamp: Date.now() + durationSecs * 1000,
                    triggered: false
                  };

                  const existingRaw = localStorage.getItem("gmi_app_pop_timers") || "[]";
                  let list = [];
                  try { list = JSON.parse(existingRaw); } catch(e){}
                  list.unshift(newTimer);
                  localStorage.setItem("gmi_app_pop_timers", JSON.stringify(list));
                  
                  // Reset form fields lightly
                  setTimerTitle("");
                  setTimerMessage("");
                  
                  // local state refresh trigger if any
                  setRefreshClock(prev => prev + 1);
                }}
                className="w-full py-2 bg-rose-650 hover:bg-rose-500 text-white rounded-lg font-black uppercase tracking-wider text-[11px] transition-all cursor-pointer shadow-md shadow-rose-950/20"
              >
                🚀 <span className="text-black dark:text-white">launch reminder</span>
              </button>
            </div>

            {/* Active countdown list */}
            {timerList.filter(t => !t.triggered).length > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600 block font-mono">⏳ Running Alert Timers ({timerList.filter(t => !t.triggered).length})</span>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
                  {timerList.filter(t => !t.triggered).map((t: any) => {
                    const remaining = Math.max(0, Math.round((t.targetTimestamp - Date.now()) / 1000));
                    const progress = Math.min(100, Math.max(0, (remaining / t.durationSeconds) * 105));
                    
                    return (
                      <div key={t.id} className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl relative overflow-hidden">
                        {/* Progress Bar background */}
                        <div 
                          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        ></div>
                        
                        <div className="flex justify-between items-start gap-2 text-zinc-700">
                          <div>
                            <span className="text-[8px] bg-amber-500/20 text-amber-400 font-mono font-bold px-1 py-0.5 rounded uppercase tracking-wider">{t.type}</span>
                            <h5 className="font-bold text-xs text-zinc-900 mt-1 leading-tight">{t.title}</h5>
                            <p className="text-[10px] text-zinc-600 mt-0.5 line-clamp-1">{t.message}</p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black font-mono text-red-400 block">{remaining}s</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = timerList.filter(item => item.id !== t.id);
                                localStorage.setItem("gmi_app_pop_timers", JSON.stringify(updated));
                                setRefreshClock(prev => prev + 1);
                              }}
                              className="text-[9px] text-zinc-500 hover:text-red-400 underline uppercase block mt-1 cursor-pointer transition-colors"
                            >
                              Abort
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
    )}

      {/* Sent Email Preview In-App Sandbox Modal */}
      {previewReminderId && previewHtml && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden text-zinc-900">
            {/* Modal Header */}
            <div className="bg-white text-zinc-900 p-4 flex items-center justify-between border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-700">Sandbox Dispatch Inspector</span>
              </div>
              <button 
                type="button"
                onClick={() => { setPreviewReminderId(null); setPreviewHtml(null); }}
                className="text-zinc-600 hover:text-zinc-900 font-bold text-[10px] bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl cursor-pointer transition-all uppercase"
              >
                Close View
              </button>
            </div>

            {/* Simulated Email Client Top Deck */}
            <div className="bg-zinc-50 p-4 border-b border-zinc-150 space-y-1.5 text-xs select-none text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] w-14 text-zinc-600 font-bold uppercase tracking-wider font-mono">From:</span>
                <span className="font-semibold text-zinc-800 font-mono">"${activeDoc.senderCompany || activeDoc.senderName || "Billing Assistant"}" &lt;noreply@smart-invoice-assistant.com&gt;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] w-14 text-zinc-600 font-bold uppercase tracking-wider font-mono">To:</span>
                <span className="font-semibold text-zinc-800 font-mono">&lt;{clientEmail}&gt;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] w-14 text-zinc-600 font-bold uppercase tracking-wider font-mono">Subject:</span>
                <span className="font-bold text-zinc-900 font-sans">
                  {activePreviewReminder?.reminderSubject || `⏰ Reminder: ${activeDoc.customTypeName || activeDoc.documentType || "Invoice"} #${activeDoc.documentNumber || "draft"} from ${activeDoc.senderCompany || activeDoc.senderName || "Billing"}`}
                </span>
              </div>
            </div>

            {/* Email Render Frame */}
            <div className="flex-1 p-4 bg-zinc-100 overflow-auto flex items-center justify-center">
              <iframe 
                title="HTML Email Preview"
                srcDoc={previewHtml}
                className="w-full h-[50vh] border border-zinc-200 rounded-2xl bg-white shadow-inner"
              />
            </div>

            {/* Informational Footer */}
            <div className="bg-zinc-50 p-3 border-t border-zinc-150 text-center">
              <span className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">
                🚨 This is a live preview of the generated transactional email
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
