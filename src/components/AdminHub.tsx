import React, { useState, useEffect } from "react";
import { 
  Users, 
  TrendingUp, 
  Coins, 
  ShieldCheck, 
  Search, 
  Download, 
  UserPlus, 
  Gift, 
  Zap, 
  Trash2, 
  ArrowUpDown, 
  DollarSign,
  AlertCircle,
  Mail,
  Calendar,
  Layers,
  Sparkles,
  Award,
  FileCheck,
  Paperclip,
  MessageSquare,
  Clock,
  Send,
  Calculator
} from "lucide-react";
import { UserAccount } from "../types";
import SimpleCalculator from "./SimpleCalculator";

interface AdminHubProps {
  currentAdminEmail: string;
  onUserDbChange?: () => void;
}

export default function AdminHub({ currentAdminEmail, onUserDbChange }: AdminHubProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | "free" | "starter" | "professional" | "business" | "enterprise">("all");
  const [sortField, setSortField] = useState<"email" | "amountPaid" | "createdAt" | "invoiceCredits">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Admin tab routing state
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<"users" | "gateways" | "eft_clearances" | "support_chats" | "notifications" | "calculator" | "failed_transactions">("users");

  // Support Chats internal states
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [selectedChatUserEmail, setSelectedChatUserEmail] = useState<string | null>(null);
  const [adminReplyInput, setAdminReplyInput] = useState("");

  // EFT manual deposits claim list
  const [eftSubmissions, setEftSubmissions] = useState<any[]>([]);

  // Admin inbound payment alerts
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  
  // Failed Stripe Transactions Logs
  const [failedLogs, setFailedLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchFailedLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const response = await fetch("/api/stripe/failed-logs");
      if (response.ok) {
        const data = await response.json();
        setFailedLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Failed to fetch logs:", e);
    }
    setIsLoadingLogs(false);
  };

  const loadNotifications = () => {
    const list = JSON.parse(localStorage.getItem("gmi_admin_notifications") || "[]");
    setAdminNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleClearNotifications = () => {
    localStorage.setItem("gmi_admin_notifications", "[]");
    setAdminNotifications([]);
    triggerAlert("🧹 Cleared all payment notifications!");
  };

  const handleMarkAllRead = () => {
    const list = JSON.parse(localStorage.getItem("gmi_admin_notifications") || "[]");
    const updated = list.map((n: any) => ({ ...n, unread: false }));
    localStorage.setItem("gmi_admin_notifications", JSON.stringify(updated));
    setAdminNotifications(updated);
    triggerAlert("👀 Marked all notifications as read!");
  };

  const handleTriggerTestPayment = () => {
    const list = JSON.parse(localStorage.getItem("gmi_admin_notifications") || "[]");
    const randEmail = `user_${Math.floor(1000 + Math.random() * 9000)}@sandbox.co`;
    const randTiers = ["starter", "growth", "pro"];
    const chosenTier = randTiers[Math.floor(Math.random() * randTiers.length)];
    const price = chosenTier === "starter" ? 7.00 : chosenTier === "growth" ? 15.00 : 29.00;
    
    const newNotif = {
      id: "NOTIF_" + Math.floor(100000 + Math.random() * 900000),
      title: "💰 Subscription Payout Received",
      message: `User ${randEmail} upgraded to ${chosenTier.toUpperCase()} plan via CARD for $${price.toFixed(2)}.`,
      timestamp: new Date().toISOString(),
      userEmail: randEmail,
      amount: price,
      plan: chosenTier,
      method: "card",
      unread: true
    };
    list.unshift(newNotif);
    localStorage.setItem("gmi_admin_notifications", JSON.stringify(list));
    setAdminNotifications(list);
    triggerAlert("🔔 Test subscription notification of $" + price + " logged and simulated email alert dispatched to brigittalombard09@gmail.com!");
  };

  // PayPal credentials
  const [paypalEmail, setPaypalEmail] = useState(() => {
    const cfg = localStorage.getItem("gmi_merchant_config");
    if (cfg) {
      try { return JSON.parse(cfg).paypalEmail || "brigittalombard09@gmail.com"; } catch (e) {}
    }
    return "brigittalombard09@gmail.com";
  });
  const [paypalLink, setPaypalLink] = useState(() => {
    const cfg = localStorage.getItem("gmi_merchant_config");
    if (cfg) {
      try { return JSON.parse(cfg).paypalLink || ""; } catch (e) {}
    }
    return "";
  });

  // Bank EFT credentials
  const [eftActive, setEftActive] = useState(() => {
    const cfg = localStorage.getItem("gmi_merchant_config");
    if (cfg) {
      try { return JSON.parse(cfg).eftActive ?? true; } catch (e) {}
    }
    return true;
  });
  const [eftBank, setEftBank] = useState(() => {
    const cfg = localStorage.getItem("gmi_merchant_config");
    if (cfg) {
      try { return JSON.parse(cfg).eftBank || "Capitec Bank"; } catch (e) {}
    }
    return "Capitec Bank";
  });
  const [eftAccount, setEftAccount] = useState(() => {
    const cfg = localStorage.getItem("gmi_merchant_config");
    if (cfg) {
      try { return JSON.parse(cfg).eftAccount || "2547977857"; } catch (e) {}
    }
    return "2547977857";
  });
  const [eftBranch, setEftBranch] = useState(() => {
    const cfg = localStorage.getItem("gmi_merchant_config");
    if (cfg) {
      try { return JSON.parse(cfg).eftBranch || "CABLZAJJ"; } catch (e) {}
    }
    return "CABLZAJJ";
  });
  const [eftHolder, setEftHolder] = useState(() => {
    const cfg = localStorage.getItem("gmi_merchant_config");
    if (cfg) {
      try { return JSON.parse(cfg).eftHolder || "Audit This Doc AI"; } catch (e) {}
    }
    return "Audit This Doc AI";
  });

  const [smtpHost, setSmtpHost] = useState(() => {
    const cfg = localStorage.getItem("gmi_merchant_config");
    if (cfg) {
      try { return JSON.parse(cfg).smtpHost || ""; } catch (e) {}
    }
    return "";
  });
  const [smtpPort, setSmtpPort] = useState(() => {
    const cfg = localStorage.getItem("gmi_merchant_config");
    if (cfg) {
      try { return JSON.parse(cfg).smtpPort || "587"; } catch (e) {}
    }
    return "587";
  });
  const [smtpSecure, setSmtpSecure] = useState(() => {
    const cfg = localStorage.getItem("gmi_merchant_config");
    if (cfg) {
      try { return JSON.parse(cfg).smtpSecure ?? false; } catch (e) {}
    }
    return false;
  });
  const [smtpUser, setSmtpUser] = useState(() => {
    const cfg = localStorage.getItem("gmi_merchant_config");
    if (cfg) {
      try { return JSON.parse(cfg).smtpUser || ""; } catch (e) {}
    }
    return "";
  });
  const [smtpPass, setSmtpPass] = useState(() => {
    const cfg = localStorage.getItem("gmi_merchant_config");
    if (cfg) {
      try { return JSON.parse(cfg).smtpPass || ""; } catch (e) {}
    }
    return "";
  });

  const [googleVerificationCode, setGoogleVerificationCode] = useState(() => {
    const cfg = localStorage.getItem("gmi_merchant_config");
    if (cfg) {
      try { return JSON.parse(cfg).googleVerificationCode || ""; } catch (e) {}
    }
    return "";
  });

  const handleSaveMerchantConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      paypalEmail,
      paypalLink,
      eftActive,
      eftBank,
      eftAccount,
      eftBranch,
      eftHolder,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,
      googleVerificationCode
    };
    localStorage.setItem("gmi_merchant_config", JSON.stringify(config));
    
    // Inject or update meta tag dynamically on save
    if (googleVerificationCode.trim()) {
      let meta = document.querySelector('meta[name="google-site-verification"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'google-site-verification');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', googleVerificationCode.trim());
    }
    
    triggerAlert("💰 Payout routing, gateway credentials, SMTP configurations, and Search Console verification codes synchronized successfully!");
  };

  // State for creating a simulated test user
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newTier, setNewTier] = useState<"free" | "unlimited" | "bundle" | "payg">("unlimited");
  const [newPassword, setNewPassword] = useState("password123");

  const [notification, setNotification] = useState<string | null>(null);

  // Trigger brief alert banner
  const triggerAlert = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Load users and support messages on mount
  useEffect(() => {
    loadUsersDatabase();
    loadSupportChats();
    const chatInterval = setInterval(loadSupportChats, 3000); // Check every 3 seconds for messages
    return () => clearInterval(chatInterval);
  }, []);

  const loadSupportChats = () => {
    const raw = localStorage.getItem("gmi_support_chat_messages");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSupportMessages(parsed);
      } catch (err) {
        console.error("Failed to parse support messages in admin hub:", err);
      }
    }
  };

  const loadUsersDatabase = () => {
    const rawUsers = localStorage.getItem("gmi_simulated_db_users");
    let usersList: Record<string, any> = rawUsers ? JSON.parse(rawUsers) : {};

    // If completely empty database, let's populate with beautiful mock users representing signups and payments to give the tracker life!
    if (Object.keys(usersList).length === 0) {
      const mockSetup: Record<string, any> = {
        "brigittalombard09@gmail.com": {
          uid: "sim_admin_01",
          email: "brigittalombard09@gmail.com",
          paymentTier: "unlimited",
          invoiceCredits: 999999,
          amountPaid: 50.00,
          invoicesCount: 14,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), // 12 days ago
          mockPassword: "password"
        },
        "brent.spence@techsolutions.io": {
          uid: "sim_usr_102",
          email: "brent.spence@techsolutions.io",
          paymentTier: "unlimited",
          invoiceCredits: 999999,
          amountPaid: 50.00,
          invoicesCount: 38,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), // 8 days ago
          mockPassword: "password123"
        },
        "lucile.freelance@parisdesign.fr": {
          uid: "sim_usr_205",
          email: "lucile.freelance@parisdesign.fr",
          paymentTier: "bundle",
          invoiceCredits: 12,
          amountPaid: 8.00,
          invoicesCount: 8,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
          mockPassword: "password123"
        },
        "clint.beukes@agency.co.za": {
          uid: "sim_usr_301",
          email: "clint.beukes@agency.co.za",
          paymentTier: "payg",
          invoiceCredits: 0,
          amountPaid: 1.60, // Paid for 4 documents ($0.40 each)
          invoicesCount: 4,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          mockPassword: "password123"
        },
        "samantha.reed@gmail.com": {
          uid: "sim_usr_440",
          email: "samantha.reed@gmail.com",
          paymentTier: "free",
          invoiceCredits: 2, // 1 credit used of the starting 3 free credits
          amountPaid: 0.00,
          invoicesCount: 1,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
          mockPassword: "password123"
        }
      };

      localStorage.setItem("gmi_simulated_db_users", JSON.stringify(mockSetup));
      usersList = mockSetup;
    }

    // Convert keys object to clean array
    const sortedArray = Object.keys(usersList).map(emailKey => {
      const item = usersList[emailKey];
      return {
        uid: item.uid,
        email: item.email || emailKey,
        paymentTier: item.paymentTier || "free",
        invoiceCredits: item.invoiceCredits ?? 3,
        amountPaid: item.amountPaid ?? 0,
        invoicesCount: item.invoicesCount ?? 0,
        createdAt: item.createdAt || new Date().toISOString()
      };
    });

    setUsers(sortedArray);
  };

  const loadEftSubmissions = () => {
    const rawSubmissions = localStorage.getItem("gmi_pending_eft_submissions");
    let list = rawSubmissions ? JSON.parse(rawSubmissions) : [];

    // Pre-populate if empty to showcase a live, interactive EFT review dashboard.
    if (list.length === 0) {
      list = [
        {
          id: "eft_demo_1",
          email: "samantha.reed@gmail.com",
          plan: "unlimited_yearly",
          planLabel: "Unlimited Generator Pro",
          amount: 50.00,
          currency: "$",
          proofFileName: "fnb_eft_rec_samantha.pdf",
          reference: "SAM_REED_EFT",
          submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
          status: "pending",
          documentNumber: "INV-2026-042"
        },
        {
          id: "eft_demo_2",
          email: "clint.beukes@agency.co.za",
          plan: "credit_bundle",
          planLabel: "20-Invoices Credit Bundle",
          amount: 8.00,
          currency: "$",
          proofFileName: "standardbank_pop.jpg",
          reference: "CLINT_B_EFT",
          submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
          status: "approved",
          documentNumber: "INV-2026-039"
        }
      ];
      localStorage.setItem("gmi_pending_eft_submissions", JSON.stringify(list));
    }

    setEftSubmissions(list);
  };

  const handleApproveEft = (submission: any) => {
    // 1. Mark status as approved
    const updatedSubmissions = eftSubmissions.map(sub => {
      if (sub.id === submission.id) {
        return { ...sub, status: "approved" };
      }
      return sub;
    });
    setEftSubmissions(updatedSubmissions);
    localStorage.setItem("gmi_pending_eft_submissions", JSON.stringify(updatedSubmissions));

    // 2. Locate the user profile if possible to grant access
    const rawUsers = localStorage.getItem("gmi_simulated_db_users");
    const usersList = rawUsers ? JSON.parse(rawUsers) : {};
    const lowerEmail = submission.email.toLowerCase();

    let targetUser = usersList[lowerEmail];
    if (!targetUser) {
      targetUser = {
        uid: "sim_usr_" + Math.floor(Math.random() * 88999 + 10000),
        email: submission.email,
        paymentTier: "free",
        invoiceCredits: 3,
        amountPaid: 0,
        invoicesCount: 0,
        createdAt: new Date().toISOString()
      };
    }

    if (submission.plan === "unlimited_yearly") {
      targetUser.paymentTier = "unlimited";
      targetUser.invoiceCredits = 999999;
      targetUser.amountPaid = (targetUser.amountPaid || 0) + submission.amount;
    } else if (submission.plan === "credit_bundle") {
      targetUser.paymentTier = "bundle";
      targetUser.invoiceCredits = (targetUser.invoiceCredits || 0) + 20;
      targetUser.amountPaid = (targetUser.amountPaid || 0) + submission.amount;
    } else if (submission.plan === "single_doc") {
      targetUser.invoiceCredits = (targetUser.invoiceCredits || 0) + 1;
      targetUser.amountPaid = (targetUser.amountPaid || 0) + submission.amount;
    }

    // Clean up their pending banner info on user object
    delete targetUser.pendingEft;
    delete targetUser.pendingEftRef;
    delete targetUser.pendingEftPlan;
    delete targetUser.pendingEftAmount;

    usersList[lowerEmail] = { ...targetUser, mockPassword: "password123" };
    localStorage.setItem("gmi_simulated_db_users", JSON.stringify(usersList));

    loadUsersDatabase();
    if (onUserDbChange) {
      onUserDbChange();
    }

    triggerAlert(`✅ Cleared Direct EFT! Upgraded ${submission.email} to ${submission.planLabel || "Pro"}!`);
  };

  const handleDeclineEft = (submission: any) => {
    const updatedSubmissions = eftSubmissions.map(sub => {
      if (sub.id === submission.id) {
        return { ...sub, status: "rejected" };
      }
      return sub;
    });
    setEftSubmissions(updatedSubmissions);
    localStorage.setItem("gmi_pending_eft_submissions", JSON.stringify(updatedSubmissions));

    // Clean up pending indicator on user object
    const rawUsers = localStorage.getItem("gmi_simulated_db_users");
    const usersList = rawUsers ? JSON.parse(rawUsers) : {};
    const lowerEmail = submission.email.toLowerCase();

    if (usersList[lowerEmail]) {
      const u = usersList[lowerEmail];
      delete u.pendingEft;
      delete u.pendingEftRef;
      delete u.pendingEftPlan;
      delete u.pendingEftAmount;
      usersList[lowerEmail] = u;
      localStorage.setItem("gmi_simulated_db_users", JSON.stringify(usersList));
    }

    loadUsersDatabase();
    if (onUserDbChange) {
      onUserDbChange();
    }

    triggerAlert(`❌ Rejected Direct EFT claim ID: ${submission.reference}.`);
  };

  const handleDeleteEftLog = (id: string) => {
    const fresh = eftSubmissions.filter(s => s.id !== id);
    setEftSubmissions(fresh);
    localStorage.setItem("gmi_pending_eft_submissions", JSON.stringify(fresh));
    triggerAlert("🗑️ Removed transfer record from logs catalog successfully.");
  };

  // Manual trigger to sync changes back to localStorage
  const saveUserToSimDB = (updatedUser: UserAccount) => {
    const rawUsers = localStorage.getItem("gmi_simulated_db_users");
    const usersList = rawUsers ? JSON.parse(rawUsers) : {};
    const lowerEmail = updatedUser.email.toLowerCase();

    if (usersList[lowerEmail]) {
      usersList[lowerEmail] = { ...usersList[lowerEmail], ...updatedUser };
    } else {
      // Just in case
      usersList[lowerEmail] = { ...updatedUser, mockPassword: "password123" };
    }

    localStorage.setItem("gmi_simulated_db_users", JSON.stringify(usersList));
    loadUsersDatabase();
    if (onUserDbChange) {
      onUserDbChange();
    }
  };

  const handleToggleAdminSubscriptionCancel = (user: UserAccount) => {
    const isNowCancelled = !user.isSubscriptionCancelled;
    const fresh: UserAccount = {
      ...user,
      isSubscriptionCancelled: isNowCancelled
    };
    saveUserToSimDB(fresh);
    triggerAlert(
      isNowCancelled 
        ? `🛑 Cancelled subscription auto-renewal for ${user.email}.`
        : `✅ Reactivated auto-renewal for ${user.email}.`
    );
  };

  // Sorting helper
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Support tools: Manual action toggles
  const handleGiftCredits = (user: UserAccount) => {
    const fresh: UserAccount = {
      ...user,
      paymentTier: user.paymentTier === "free" ? "starter" : user.paymentTier, // change free state if obtaining bundle
      invoiceCredits: (user.invoiceCredits === 999999 ? 0 : user.invoiceCredits) + 10,
    };
    saveUserToSimDB(fresh);
    triggerAlert(`🎁 Gifted +10 credits to ${user.email} successfully!`);
  };

  const handleUpgradeToPro = (user: UserAccount) => {
    const fresh: UserAccount = {
      ...user,
      paymentTier: "enterprise",
      invoiceCredits: 999999,
      aiCreditsTotal: Infinity,
      aiCreditsRemaining: Infinity,
      amountPaid: user.amountPaid + 199.00 // simulate annual pay upgrade
    };
    saveUserToSimDB(fresh);
    triggerAlert(`👑 Upgraded ${user.email} to Enterprise subscription!`);
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (user.email.toLowerCase() === "brigittalombard09@gmail.com") {
      triggerAlert("❌ Cannot delete the main administrator account!");
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to delete profile: ${user.email}?`);
    if (!confirmDelete) return;

    const rawUsers = localStorage.getItem("gmi_simulated_db_users");
    const usersList = rawUsers ? JSON.parse(rawUsers) : {};
    delete usersList[user.email.toLowerCase()];
    localStorage.setItem("gmi_simulated_db_users", JSON.stringify(usersList));
    
    loadUsersDatabase();
    triggerAlert(`🗑️ Deleted profile ${user.email} from simulated ecosystem.`);
  };

  // Submit trigger to add a user
  const handleCreateTestUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) {
      alert("Please provide a valid email address");
      return;
    }

    const lower = newEmail.toLowerCase();
    const rawUsers = localStorage.getItem("gmi_simulated_db_users");
    const usersList = rawUsers ? JSON.parse(rawUsers) : {};

    if (usersList[lower]) {
      alert("A user with this email already exists in storage.");
      return;
    }

    let initialCredits = 3;
    let amtPaid = 0;

    if (newTier === "unlimited") {
      initialCredits = 999999;
      amtPaid = 50.00;
    } else if (newTier === "bundle") {
      initialCredits = 20;
      amtPaid = 8.00;
    } else if (newTier === "payg") {
      initialCredits = 0;
      amtPaid = 0.40; // assume they paid for their first doc
    }

    const testUser: UserAccount = {
      uid: "sim_usr_" + Math.floor(Math.random() * 88999 + 10000),
      email: newEmail,
      paymentTier: newTier,
      invoiceCredits: initialCredits,
      amountPaid: amtPaid,
      invoicesCount: Math.floor(Math.random() * 6 + 1),
      createdAt: new Date().toISOString()
    };

    usersList[lower] = { ...testUser, mockPassword: newPassword };
    localStorage.setItem("gmi_simulated_db_users", JSON.stringify(usersList));

    setNewEmail("");
    setShowAddUser(false);
    loadUsersDatabase();
    triggerAlert(`✨ Successfully registered simulated test user ${testUser.email}!`);
  };

  // Export JSON payload of users database
  const handleExportData = () => {
    const rawUsers = localStorage.getItem("gmi_simulated_db_users");
    const blob = new Blob([rawUsers || "{}"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `assistinvoicer_Admin_Users_Export_${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    triggerAlert("📥 Exported users JSON ledger successfully!");
  };

  // Filters & Search computations
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.uid.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === "all" || user.paymentTier === filterTier;
    return matchesSearch && matchesTier;
  });

  // Sort computation
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === "string") {
      valA = valA.toLowerCase();
      valB = (valB as string).toLowerCase();
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Metrics breakdowns
  const totalUsersCount = users.length;
  const totalRevenue = users.reduce((sum, u) => sum + (u.amountPaid || 0), 0);
  const paidUsersCount = users.filter(u => u.amountPaid > 0).length;
  const tierCounts = {
    free: users.filter(u => u.paymentTier === "free").length,
    starter: users.filter(u => u.paymentTier === "starter").length,
    professional: users.filter(u => u.paymentTier === "professional").length,
    business: users.filter(u => u.paymentTier === "business").length,
    enterprise: users.filter(u => u.paymentTier === "enterprise").length,
  };

  // STRICT SECURITY CHECK - ONLY Brigittalombard09@gmail.com IS ALLOWED
  if (!currentAdminEmail || currentAdminEmail.toLowerCase() !== "brigittalombard09@gmail.com") {
    return (
      <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-4 animate-fadeIn my-10 font-sans">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-rose-650 uppercase tracking-tight">Access Locked & Unauthorized Alert</h2>
          <p className="text-xs text-zinc-550 font-bold uppercase tracking-widest mt-0.5">Audit This Doc AI Guard Engine</p>
        </div>
        <p className="text-sm text-zinc-650 leading-relaxed">
          The manual bookkeeping ledger suite and payments configurations are strictly reserved for <strong>brigittalombard09@gmail.com</strong>.
        </p>
        <p className="text-xs text-zinc-600 font-medium">
          Access from {currentAdminEmail || "Anonymous Session"} has been rejected. Switch account layers or sign in with valid administrator credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-xs max-w-5xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Alert Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-50 border border-zinc-200 text-zinc-900 py-3.5 px-5 rounded-2xl shadow-xl flex items-center gap-2.5 max-w-sm animate-scaleUp text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Head header with details */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-50 text-red-600 border border-red-100 font-extrabold text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3" /> Secure Admin Space
            </span>
          </div>
          <h2 className="text-xl font-sans font-black tracking-tight text-zinc-900 mt-1 uppercase">
            User Tracking & Revenue Controller
          </h2>
          <p className="text-xs text-zinc-500 font-medium">
            Logged in as <strong className="text-zinc-800 font-black">{currentAdminEmail}</strong>. Live ecosystem tracking of registrations, subscription plans, and invoice checkouts.
          </p>
        </div>

        {activeAdminSubTab === "users" && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAddUser(!showAddUser)}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {showAddUser ? "Hide Test Creator" : "Add Simulation User"}
            </button>
            
            <button
              type="button"
              onClick={handleExportData}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-zinc-200 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              Export Ledger
            </button>
          </div>
        )}
      </div>

      {/* Admin Tab Navigation Submenu */}
      <div className="flex border-b border-zinc-200 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveAdminSubTab("users")}
          className={`px-5 py-3 font-sans font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px cursor-pointer whitespace-nowrap ${activeAdminSubTab === "users" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-600 hover:text-zinc-700"}`}
        >
          👥 User Ledger & Registrations ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveAdminSubTab("gateways")}
          className={`px-5 py-3 font-sans font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeAdminSubTab === "gateways" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-600 hover:text-zinc-700"}`}
        >
          💰 Gateway Routing & Payout Keys
          {eftActive && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveAdminSubTab("eft_clearances")}
          className={`px-5 py-3 font-sans font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeAdminSubTab === "eft_clearances" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-600 hover:text-zinc-700"}`}
        >
          📋 Direct EFT Approvals
          {eftSubmissions.filter(sub => sub.status === "pending").length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[9.5px] px-2 py-0.5 rounded-full font-black animate-pulse font-mono">
              {eftSubmissions.filter(sub => sub.status === "pending").length} Pending
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveAdminSubTab("support_chats")}
          className={`px-5 py-3 font-sans font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeAdminSubTab === "support_chats" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-600 hover:text-zinc-700"}`}
        >
          🎧 Audit This Doc AI Support Chats
          {supportMessages.length > 0 ? (
            <span className="bg-violet-100 text-violet-800 text-[9.5px] px-2 py-0.5 rounded-full font-black font-mono">
              {(() => {
                const grouped: Record<string, any[]> = {};
                supportMessages.forEach(m => {
                  if (!grouped[m.userEmail]) grouped[m.userEmail] = [];
                  grouped[m.userEmail].push(m);
                });
                return Object.values(grouped).filter(msgs => {
                  if (msgs.length === 0) return false;
                  const sorted = [...msgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                  return sorted[sorted.length - 1]?.sender === "user";
                }).length;
              })()}{" "}
              Needs Reply
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveAdminSubTab("notifications");
            // mark unread as read when entering
            const list = JSON.parse(localStorage.getItem("gmi_admin_notifications") || "[]");
            const updated = list.map((n: any) => ({ ...n, unread: false }));
            localStorage.setItem("gmi_admin_notifications", JSON.stringify(updated));
            setAdminNotifications(updated);
          }}
          className={`px-5 py-3 font-sans font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeAdminSubTab === "notifications" ? "border-zinc-950 text-zinc-950 border-b-2" : "border-transparent text-zinc-600 hover:text-zinc-700"}`}
        >
          🔔 Payments & Alerts
          {adminNotifications.filter(n => n.unread).length > 0 && (
            <span className="bg-rose-500 text-white text-[9.5px] px-1.5 py-0.5 rounded-full font-black animate-pulse font-mono">
              {adminNotifications.filter(n => n.unread).length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveAdminSubTab("calculator")}
          className={`px-5 py-3 font-sans font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeAdminSubTab === "calculator" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-600 hover:text-zinc-700"}`}
        >
          <Calculator className="w-4 h-4 text-emerald-600" />
          Calculator
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveAdminSubTab("failed_transactions");
            fetchFailedLogs();
          }}
          className={`px-5 py-3 font-sans font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeAdminSubTab === "failed_transactions" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-600 hover:text-zinc-700"}`}
        >
          <AlertCircle className="w-4 h-4 text-rose-600" />
          Failed Stripe Logs
        </button>
      </div>

      {activeAdminSubTab === "users" && (
        <>
          {/* Test User Creator Drawer / Banner */}
          {showAddUser && (
            <form onSubmit={handleCreateTestUserSubmit} className="bg-zinc-50 border border-zinc-200 p-5 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-200">
                <Award className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-bold text-zinc-805 uppercase tracking-wider">Simulated Inbound Registrant Constructor</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 block mb-1 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="customer.account@corp.co.uk"
                    className="w-full px-3 py-2 bg-white border border-zinc-205 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 block mb-1 uppercase">Subscription Tier Option</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-zinc-205 rounded-xl text-xs font-bold focus:outline-none focus:border-violet-500 text-zinc-700"
                  >
                    <option value="free">Free Tier ($0.00 / 3 Credits)</option>
                    <option value="unlimited">Unlimited Pro Plan ($50.00 / year)</option>
                    <option value="bundle">Credit Bundle Plan ($8.00 / 20 Invoices)</option>
                    <option value="payg">Pay-As-You-Go ($0.40 initial)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 block mb-1 uppercase">Database Simulated Password</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-205 rounded-xl text-xs font-mono focus:outline-none focus:border-violet-500 text-zinc-650"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3.5 py-1.5 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-zinc-50 hover:bg-zinc-800 text-zinc-900 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Confirm Account Creation
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {activeAdminSubTab === "users" && (
        <>
          {/* Modern Bento Matrix Cards of Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Users */}
        <div className="bg-zinc-50 border border-zinc-200/80 p-5 rounded-2xl hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-600/5 rounded-full filter blur-lg pointer-events-none group-hover:scale-125 transition-transform"></div>
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[9.5px] font-bold text-zinc-600 uppercase tracking-widest font-mono">Ecosystem Reach</span>
            <Users className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 font-sans tracking-tight">
            {totalUsersCount} <span className="text-[11px] font-medium text-zinc-600">accounts</span>
          </div>
          <p className="text-[9.5px] text-zinc-500 font-medium mt-1 leading-tight">
            Cumulative registered entities recorded in local simulated base.
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-zinc-50 border border-zinc-200/80 p-5 rounded-2xl hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-600/5 rounded-full filter blur-lg pointer-events-none group-hover:scale-125 transition-transform"></div>
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[9.5px] font-bold text-zinc-600 uppercase tracking-widest font-mono">Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-sans tracking-tight flex items-baseline">
            <span className="text-lg font-extrabold mr-0.5">$</span>
            {totalRevenue.toFixed(2)}
          </div>
          <p className="text-[9.5px] text-emerald-600 font-bold mt-1 leading-tight">
            📈 {paidUsersCount} paying clients ({((paidUsersCount / Math.max(1, totalUsersCount)) * 100).toFixed(0)}% conversion rate)
          </p>
        </div>

        {/* Pro Subscribers */}
        <div className="bg-zinc-50 border border-zinc-200/80 p-5 rounded-2xl hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full filter blur-lg pointer-events-none group-hover:scale-125 transition-transform"></div>
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[9.5px] font-bold text-zinc-600 uppercase tracking-widest font-mono">Enterprise Plans</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 font-sans tracking-tight">
            {tierCounts.enterprise} <span className="text-[11px] font-medium text-zinc-600">active</span>
          </div>
          <p className="text-[9.5px] text-zinc-500 font-medium mt-1 leading-tight">
            Subscribed yearly at <strong className="text-zinc-700">$199/month</strong> premium pricing tiers.
          </p>
        </div>

        {/* Micro-Payments */}
        <div className="bg-zinc-50 border border-zinc-200/80 p-5 rounded-2xl hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-teal-600/5 rounded-full filter blur-lg pointer-events-none group-hover:scale-125 transition-transform"></div>
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[9.5px] font-bold text-zinc-600 uppercase tracking-widest font-mono">Mid-Tier Accounts</span>
            <Coins className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 font-sans tracking-tight">
            {tierCounts.professional + tierCounts.business} <span className="text-[11px] font-medium text-zinc-600">clients</span>
          </div>
          <p className="text-[9.5px] text-zinc-500 font-medium mt-1 leading-tight">
            {tierCounts.professional} Pro Plan accounts and {tierCounts.business} Business accounts.
          </p>
        </div>

      </div>

      {/* Visual Proportional Metrics Progress Bar - Graphic Craft */}
      <div className="bg-zinc-50/50 border border-zinc-150 p-4.5 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between font-mono text-[9.5px] font-bold uppercase tracking-wider text-zinc-550">
          <span>Subscription Allocation Ratio</span>
          <span className="text-zinc-600">Weighted Scale</span>
        </div>
        <div className="h-3 rounded-xl bg-zinc-205 overflow-hidden flex shadow-sm border border-zinc-200/40">
          <div 
            style={{ width: `${(tierCounts.enterprise / Math.max(1, totalUsersCount)) * 100}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-450 hover:opacity-90 transition-opacity"
            title={`Enterprise: ${tierCounts.enterprise} accounts`}
          />
          <div 
            style={{ width: `${(tierCounts.business / Math.max(1, totalUsersCount)) * 100}%` }}
            className="h-full bg-gradient-to-r from-violet-500 to-violet-450 hover:opacity-90 transition-opacity"
            title={`Business: ${tierCounts.business} accounts`}
          />
          <div 
            style={{ width: `${(tierCounts.professional / Math.max(1, totalUsersCount)) * 100}%` }}
            className="h-full bg-gradient-to-r from-amber-400 to-amber-450 hover:opacity-90 transition-opacity"
            title={`Pro Plan: ${tierCounts.professional} accounts`}
          />
          <div 
            style={{ width: `${(tierCounts.free / Math.max(1, totalUsersCount)) * 100}%` }}
            className="h-full bg-gradient-to-r from-zinc-300 to-zinc-350 hover:opacity-90 transition-opacity"
            title={`Free Tier: ${tierCounts.free} accounts`}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-zinc-650 uppercase font-mono">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block shrink-0"></span>
            <span>ENTERPRISE {((tierCounts.enterprise / Math.max(1, totalUsersCount)) * 100).toFixed(0)}% ({tierCounts.enterprise})</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-zinc-650 uppercase font-mono">
            <span className="w-2.5 h-2.5 rounded bg-violet-500 inline-block shrink-0"></span>
            <span>BUSINESS {((tierCounts.business / Math.max(1, totalUsersCount)) * 100).toFixed(0)}% ({tierCounts.business})</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-zinc-650 uppercase font-mono">
            <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block shrink-0"></span>
            <span>PRO {((tierCounts.professional / Math.max(1, totalUsersCount)) * 100).toFixed(0)}% ({tierCounts.professional})</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-zinc-650 uppercase font-mono">
            <span className="w-2.5 h-2.5 rounded bg-zinc-300 inline-block shrink-0"></span>
            <span>FREE {((tierCounts.free / Math.max(1, totalUsersCount)) * 100).toFixed(0)}% ({tierCounts.free})</span>
          </div>
        </div>
      </div>

      {/* Main filter, search and sorting bar */}
      <div className="space-y-4">
        
        {/* Controls block */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-zinc-50 border border-zinc-150 p-3 rounded-2xl">
          
          <div className="relative w-full md:max-w-xs shrink-0">
            <Search className="w-4 h-4 text-zinc-600 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email, uid..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-500 text-zinc-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto md:justify-end">
            <span className="text-[10px] uppercase font-bold text-zinc-600 font-mono tracking-wider mr-1">Filter Tier:</span>
            <button
              type="button"
              onClick={() => setFilterTier("all")}
              className={`px-3 py-1.5 text-[10.5px] rounded-lg font-bold uppercase tracking-tight cursor-pointer transition-all ${filterTier === "all" ? "bg-zinc-50 text-zinc-900" : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300"}`}
            >
              All ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTier("free")}
              className={`px-3 py-1.5 text-[10.5px] rounded-lg font-bold uppercase tracking-tight cursor-pointer transition-all ${filterTier === "free" ? "bg-zinc-400 text-zinc-900" : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300"}`}
            >
              Free ({tierCounts.free})
            </button>
            <button
              type="button"
              onClick={() => setFilterTier("starter")}
              className={`px-3 py-1.5 text-[10.5px] rounded-lg font-bold uppercase tracking-tight cursor-pointer transition-all ${filterTier === "starter" ? "bg-emerald-600 text-white" : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300"}`}
            >
              Starter ({tierCounts.starter})
            </button>
            <button
              type="button"
              onClick={() => setFilterTier("professional")}
              className={`px-3 py-1.5 text-[10.5px] rounded-lg font-bold uppercase tracking-tight cursor-pointer transition-all ${filterTier === "professional" ? "bg-violet-600 text-white" : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300"}`}
            >
              Pro ({tierCounts.professional})
            </button>
            <button
              type="button"
              onClick={() => setFilterTier("business")}
              className={`px-3 py-1.5 text-[10.5px] rounded-lg font-bold uppercase tracking-tight cursor-pointer transition-all ${filterTier === "business" ? "bg-amber-500 text-white" : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300"}`}
            >
              Business ({tierCounts.business})
            </button>
            <button
              type="button"
              onClick={() => setFilterTier("enterprise")}
              className={`px-3 py-1.5 text-[10.5px] rounded-lg font-bold uppercase tracking-tight cursor-pointer transition-all ${filterTier === "enterprise" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300"}`}
            >
              Enterprise ({tierCounts.enterprise})
            </button>
          </div>

        </div>

        {/* Data Table of users */}
        {sortedUsers.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-zinc-200 rounded-3xl space-y-2">
            <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto" />
            <h4 className="font-semibold text-xs text-zinc-705">No matches found in register matching criteria</h4>
            <p className="text-[10px] text-zinc-450">Try broadening your search phrasing or clear active tier selectors.</p>
          </div>
        ) : (
          <div className="border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200/80 text-[10px] uppercase font-bold text-zinc-455 font-mono">
                    <th 
                      onClick={() => handleSort("email")} 
                      className="p-3 pl-4 cursor-pointer select-none hover:bg-zinc-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Client Account <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("createdAt")} 
                      className="p-3 cursor-pointer select-none hover:bg-zinc-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Signed Up Date <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                      </div>
                    </th>
                    <th className="p-3">Payment Tier</th>
                    <th 
                      onClick={() => handleSort("invoiceCredits")} 
                      className="p-3 cursor-pointer select-none hover:bg-zinc-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Credits <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("amountPaid")} 
                      className="p-3 text-right cursor-pointer select-none hover:bg-zinc-100 transition-colors"
                    >
                      <div className="flex items-center gap-1 justify-end">
                        Total paid <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                      </div>
                    </th>
                    <th className="p-3 text-center">Invoices</th>
                    <th className="p-3 text-right pr-4">Admin Control Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70 bg-white font-medium text-zinc-700">
                  {sortedUsers.map(user => {
                    const isCurrentUserAdmin = user.email.toLowerCase() === "brigittalombard09@gmail.com";
                    return (
                      <tr 
                        key={user.uid} 
                        className={`hover:bg-zinc-50/50 transition-colors ${isCurrentUserAdmin ? "bg-indigo-50/15" : ""}`}
                      >
                        {/* Email Details */}
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-zinc-550 shrink-0 text-[11px] uppercase">
                              {user.email.substring(0, 2)}
                            </div>
                            <div className="truncate max-w-[180px]">
                              <span className="text-zinc-900 font-bold block leading-tight truncate">
                                {user.email}
                              </span>
                              <span className="text-[9px] text-zinc-600 font-mono block">
                                #{user.uid}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Created At */}
                        <td className="p-3 text-zinc-500 text-[11px] font-mono">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          }) : "-"} 
                          <span className="text-[9px] block text-zinc-350">{user.createdAt ? new Date(user.createdAt).toLocaleTimeString() : ""}</span>
                        </td>

                        {/* Plan Tier Badge */}
                        <td className="p-3">
                          {user.paymentTier === "enterprise" && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              👑 Enterprise
                            </span>
                          )}
                          {user.paymentTier === "business" && (
                            <span className="bg-[#fffbeb] text-[#d97706] border border-[#fde68a] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-sans">
                              🏢 Business
                            </span>
                          )}
                          {user.paymentTier === "professional" && (
                            <span className="bg-[#faf5ff] text-[#6b21a8] border border-[#edf2f7] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-sans">
                              🌟 Pro Plan
                            </span>
                          )}
                          {user.paymentTier === "starter" && (
                            <span className="bg-[#eef2ff] text-[#4338ca] border border-[#c7d2fe] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-sans">
                              💼 Starter
                            </span>
                          )}
                          {user.paymentTier === "free" && (
                            <span className="bg-zinc-100 text-zinc-650 border border-zinc-200 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                              🎁 free
                            </span>
                          )}

                          {/* Display Debit Order status if active */}
                          {user.debitOrderEnabled && (
                            <div className="mt-1.5 p-2 bg-violet-50/70 border border-violet-100 rounded-xl text-[9px] text-violet-950 font-medium font-sans leading-normal space-y-0.5 select-all max-w-[190px]">
                              <p className="font-extrabold text-[9.5px] text-violet-900 flex items-center gap-1">🏦 Direct Debit Active</p>
                              <div className="text-[8.5px] text-zinc-500 font-mono flex flex-col space-y-0.5">
                                <div><span className="font-sans font-bold text-zinc-650">Bank:</span> {user.debitOrderBank}</div>
                                <div><span className="font-sans font-bold text-zinc-650">Acc No:</span> {user.debitOrderAccNumber}</div>
                                <div><span className="font-sans font-bold text-zinc-650">Type:</span> {user.debitOrderAccType || "Savings"}</div>
                                <div><span className="font-sans font-bold text-zinc-650">Holder:</span> {user.debitOrderAccHolder || "Unspecified"}</div>
                                <div><span className="font-sans font-bold text-zinc-650">Debit Day:</span> {user.debitOrderDate || "1st"} of Mo.</div>
                              </div>
                            </div>
                          )}

                          {/* Subscription status */}
                          {user.isSubscriptionCancelled ? (
                            <span className="block mt-1 text-[8px] font-extrabold text-rose-650 bg-rose-50 px-1 py-0.5 rounded border border-rose-100 font-mono tracking-wider w-fit uppercase">
                              🛑 Lapsing (Termed)
                            </span>
                          ) : (
                            ["starter", "professional", "business", "enterprise"].includes(user.paymentTier || "") && (
                              <span className="block mt-1 text-[8px] font-bold text-emerald-600 font-mono uppercase tracking-wide">
                                ● Auto-renew Active
                              </span>
                            )
                          )}
                        </td>

                        {/* Credits Remaining */}
                        <td className="p-3">
                          {user.paymentTier === "unlimited" ? (
                            <span className="text-zinc-450 font-bold">♾️ Unlimited</span>
                          ) : (
                            <span className="font-mono font-bold text-zinc-750">
                              {user.invoiceCredits} credits
                            </span>
                          )}
                        </td>

                        {/* Total Payments */}
                        <td className="p-3 text-right font-mono font-bold text-zinc-900">
                          ${(user.amountPaid ?? 0).toFixed(2)}
                        </td>

                        {/* Invoices Count */}
                        <td className="p-3 text-center font-mono font-semibold text-zinc-500">
                          {user.invoicesCount ?? 0}
                        </td>

                        {/* Action controllers */}
                        <td className="p-3 text-right pr-4">
                          <div className="inline-flex items-center gap-1 max-w-[300px]">
                            
                            {user.paymentTier !== "enterprise" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleGiftCredits(user)}
                                  className="p-1 px-2 text-[9.5px] uppercase font-mono font-black border border-violet-200 hover:border-violet-300 text-violet-700 bg-violet-50/30 hover:bg-violet-50/80 rounded-lg cursor-pointer transition-colors"
                                  title="Add credits"
                                >
                                  +10 credits
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpgradeToPro(user)}
                                  className="p-1 px-2 text-[9.5px] uppercase font-mono font-black border border-emerald-200 hover:border-emerald-300 text-emerald-700 bg-emerald-50/30 hover:bg-emerald-50/80 rounded-lg cursor-pointer transition-colors"
                                  title="Upgrade user to Enterprise"
                                >
                                  ENTR
                                </button>
                              </>
                            )}

                            {["starter", "professional", "business", "enterprise"].includes(user.paymentTier || "") && (
                              <button
                                type="button"
                                onClick={() => handleToggleAdminSubscriptionCancel(user)}
                                className={`p-1 px-2 text-[9.5px] uppercase font-mono font-black border rounded-lg cursor-pointer transition-colors ${
                                  user.isSubscriptionCancelled
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-rose-50 text-[#e11d48] border-rose-200 hover:bg-rose-100"
                                }`}
                                title={user.isSubscriptionCancelled ? "Resume auto-renew debit orders" : "Cancel subscription auto-renew mandate"}
                              >
                                {user.isSubscriptionCancelled ? "Resume Sub" : "Cancel Sub"}
                              </button>
                            )}

                            {!isCurrentUserAdmin ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                className="p-1.5 text-zinc-600 hover:text-red-650 hover:bg-red-50 rounded-lg cursor-pointer transition-all border border-transparent hover:border-red-100"
                                title="Remove User profile"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-600 font-mono italic pr-2 font-semibold">SUPERADMIN</span>
                            )}

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
        </>
      )}

      {activeAdminSubTab === "gateways" && (
        <form onSubmit={handleSaveMerchantConfig} className="space-y-6 animate-fadeIn pb-4">
          {/* Introduction box */}
          <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-600/5 rounded-full filter blur-xl pointer-events-none animate-pulse"></div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-800 flex items-center gap-1.5 font-mono">
              <Layers className="w-4 h-4 text-violet-600" /> Direct Payout Setup Parameters
            </h3>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed max-w-2xl">
              This billing engine supports direct merchant account integration. Customizing these credentials dictates where users route checkout payments. When production is active, clicks on invoice payments will go directly to your configured merchant processing gateway securely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* PayPal Destination Routing */}
            <div className="bg-zinc-50/50 border border-zinc-200 rounded-3xl p-6 space-y-4 hover:border-zinc-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-150">
                <h4 className="font-black text-xs uppercase text-zinc-800 flex items-center gap-1.5 align-middle">
                  🇺🇸 PayPal & Card Settlement
                </h4>
                <span className="text-[8px] font-mono bg-indigo-50 px-2 py-0.5 rounded-full text-indigo-805 font-black">USD / EUR / FOREX</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[9.5px] font-black text-zinc-600 block mb-1 uppercase tracking-wider font-mono">Your PayPal Account Email</label>
                  <input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="your-email@payout.com"
                    className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-zinc-800"
                  />
                  <p className="text-[9px] text-zinc-600 mt-1">Acts as the standard secure transfer recipient target email.</p>
                </div>

                <div className="bg-blue-50/50 border border-blue-150 p-3.5 rounded-2xl text-[10px] text-blue-800 leading-relaxed font-medium">
                  ℹ️ **Bank Account Settlement:** Card payments, checks and funds authorized securely by customers inside the PayPal dialog automatically cash out and route into your registered Capitec Business bank account details under our unified settlement protocols.
                </div>
              </div>
            </div>

            {/* Custom SMTP Email Dispatch Config Card */}
            <div className="bg-zinc-50/50 border border-zinc-200 rounded-3xl p-6 space-y-4 hover:border-zinc-350 transition-colors shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-150 font-sans">
                <h4 className="font-black text-xs uppercase text-zinc-805 flex items-center gap-1.5 align-middle">
                  📧 Email Dispatch & SMTP Server
                </h4>
                <span className="text-[8px] font-mono bg-violet-100 px-2 py-0.5 rounded-full text-violet-800 font-extrabold tracking-wider">OUTBOUND SERVER</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-zinc-600 block mb-1 uppercase tracking-wider font-mono">SMTP Host</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="e.g. smtp.gmail.com"
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-500 text-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-600 block mb-1 uppercase tracking-wider font-mono">Port</label>
                    <input
                      type="text"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-550 text-zinc-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-600 block mb-1 uppercase tracking-wider font-mono">SMTP Email/Username</label>
                    <input
                      type="text"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="billing@yourdomain.com"
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-500 text-zinc-850 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-600 block mb-1 uppercase tracking-wider font-mono">App Password Code</label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-500 text-zinc-800"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1 font-sans">
                  <input
                    type="checkbox"
                    id="smtp_secure_check"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                    className="rounded text-violet-600 focus:ring-violet-500 h-3.5 w-3.5"
                  />
                  <label htmlFor="smtp_secure_check" className="text-[9.5px] font-bold text-zinc-650 uppercase tracking-tight cursor-pointer select-none">
                    Use SSL/TLS Secure Link (Port 465)
                  </label>
                </div>

                <div className="bg-amber-50/70 border border-amber-150 p-2.5 rounded-2xl text-[9px] text-amber-800 leading-normal font-semibold font-sans">
                  💡 <strong>Direct Dispatch Testing:</strong> Leave other SMTP settings blank to route automatically via our <strong>Ethereal Sandbox server</strong>. Ethereal simulates direct outbound queues and generates direct click-to-view email inbox URLs on reminders!
                </div>
              </div>
            </div>

            {/* Google Search Console Verification Card */}
            <div className="bg-zinc-50/50 border border-zinc-200 rounded-3xl p-6 space-y-4 hover:border-zinc-350 transition-colors shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-150 font-sans">
                <h4 className="font-black text-xs uppercase text-zinc-805 flex items-center gap-1.5 align-middle">
                  🔍 Google Search Console
                </h4>
                <span className="text-[8px] font-mono bg-emerald-100 px-2 py-0.5 rounded-full text-emerald-800 font-extrabold tracking-wider">SEO & INDEXING</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-zinc-600 block mb-1 uppercase tracking-wider font-mono">Meta Verification Content / Token</label>
                  <input
                    type="text"
                    value={googleVerificationCode}
                    onChange={(e) => setGoogleVerificationCode(e.target.value)}
                    placeholder="e.g. googleabcdef12356"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-zinc-800 font-mono"
                  />
                  <p className="text-[9px] text-zinc-600 mt-1">
                    Paste the inner <code className="bg-zinc-100 font-mono px-1 py-0.2 rounded text-[8.5px] text-zinc-700">content</code> value from your Google meta verification tag.
                  </p>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-150 p-3 rounded-2xl text-[9.5px] text-emerald-850 leading-relaxed font-semibold font-sans space-y-1.5">
                  <p>
                    ⚡ <strong>Automated Bypass Solution Active:</strong>
                  </p>
                  <p>
                    If you prefer Google's standard <strong>HTML File Verification method</strong> (e.g., verifying via <code className="bg-emerald-100/80 px-1 py-0.5 rounded font-mono text-[9px]">google1234567890abcdef.html</code>), you don't even have to write or configure anything!
                  </p>
                  <p>
                    Our high-performance production Node.js server serves a dynamic SEO auto-responder that automatically intercepts and validates file-based verification requests. Just choose **HTML File** on Search Console and click verify immediately!
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* South Africa EFT direct banking details section */}
          <div className="bg-zinc-50/50 border border-zinc-200 rounded-3xl p-6 space-y-4 hover:border-zinc-350 transition-colors shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-zinc-150 gap-2">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-xs uppercase text-zinc-805">
                  Direct EFT (Bank Payout Details)
                </h4>
                <span className="text-[8.5px] font-bold bg-violet-100 px-2 py-0.5 rounded text-violet-700">EXTREMELY POPULAR & RELIABLE</span>
              </div>
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={eftActive}
                  onChange={(e) => setEftActive(e.target.checked)}
                  className="rounded text-violet-600 focus:ring-violet-500 h-4 w-4"
                />
                <span className="text-[10px] font-black text-zinc-700 uppercase">Enable Manual Bank Transfer</span>
              </label>
            </div>

            {eftActive ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-scaleUp pt-2">
                <div>
                  <label className="text-[9px] font-bold text-zinc-600 block mb-1 uppercase font-mono">Bank Name</label>
                  <select
                    value={eftBank}
                    onChange={(e) => setEftBank(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold font-mono text-zinc-800 focus:outline-none"
                  >
                    <option value="First National Bank (FNB)">First National Bank (FNB)</option>
                    <option value="Standard Bank">Standard Bank</option>
                    <option value="ABSA Bank">ABSA Bank</option>
                    <option value="Capitec Bank">Capitec Bank</option>
                    <option value="Nedbank">Nedbank</option>
                    <option value="TymeBank">TymeBank</option>
                    <option value="Investec">Investec</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-600 block mb-1 uppercase font-mono">Account Holder Name</label>
                  <input
                    type="text"
                    value={eftHolder}
                    onChange={(e) => setEftHolder(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-600 block mb-1 uppercase font-mono">Account Number</label>
                  <input
                    type="text"
                    required={eftActive}
                    value={eftAccount}
                    onChange={(e) => setEftAccount(e.target.value.replace(/\s/g, ""))}
                    placeholder="e.g. 62810484592"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold font-mono focus:outline-none focus:border-violet-550"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-600 block mb-1 uppercase font-mono">Branch Code</label>
                  <input
                    type="text"
                    value={eftBranch}
                    onChange={(e) => setEftBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold font-mono focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[10.5px] text-zinc-600 italic font-semibold">
                Direct EFT payment mode is currently disabled. Toggle the checkbox to turn it on and provide banking information for your South African invoice clients.
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-white hover:bg-zinc-850 text-zinc-900 font-black text-xs px-6 py-3 rounded-2xl transition-all cursor-pointer active:scale-98 uppercase tracking-tight shadow-md"
            >
              🔒 Apply & Save Merchant Credentials
            </button>
          </div>
        </form>
      )}

      {activeAdminSubTab === "eft_clearances" && (
        <div className="space-y-6 animate-fadeIn pb-4 text-zinc-800">
          {/* Header Dashboard Banner */}
          <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 text-zinc-900 p-6 rounded-3xl relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-505/10 rounded-full filter blur-xl pointer-events-none animate-pulse"></div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/50 flex items-center justify-center text-white border border-indigo-400/30">
                <FileCheck className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900">
                  Capitec Direct EFT Clearance Desk
                </h3>
                <p className="text-indigo-200 text-xs mt-0.5 font-medium">Verify incoming direct bank transfer claims & unlock customer premium tiers manually.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-indigo-900">
              <div className="bg-indigo-900/40 p-3 rounded-2xl border border-indigo-800/50">
                <span className="text-[9px] font-bold text-indigo-300 block uppercase tracking-widest font-mono">Pending Statement Audits</span>
                <span className="text-lg font-black font-mono text-amber-300">
                  {eftSubmissions.filter(sub => sub.status === "pending").length} items
                </span>
              </div>
              <div className="bg-indigo-900/40 p-3 rounded-2xl border border-indigo-800/50">
                <span className="text-[9px] font-bold text-indigo-300 block uppercase tracking-widest font-mono">Cleared & Approved Transfer Volume</span>
                <span className="text-lg font-black font-mono text-emerald-300">
                  {eftSubmissions.filter(sub => sub.status === "approved").length} settled
                </span>
              </div>
              <div className="bg-indigo-900/40 p-3 rounded-2xl border border-indigo-800/50">
                <span className="text-[9px] font-bold text-indigo-300 block uppercase tracking-widest font-mono">Rejected / Flagged Claims</span>
                <span className="text-lg font-black font-mono text-rose-300">
                  {eftSubmissions.filter(sub => sub.status === "rejected").length} denied
                </span>
              </div>
            </div>
          </div>

          {/* List of Transactions */}
          <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-zinc-150 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-805">Inbound Bank Draft Registry Log</h4>
                <p className="text-[10.5px] text-zinc-450 mt-1 leading-none font-medium">Matches references with Capitec account holder statement logs.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("gmi_pending_eft_submissions");
                  loadEftSubmissions();
                  triggerAlert("♻️ Reset Direct EFT submissions list to mockup defaults.");
                }}
                className="text-[9.5px] font-mono text-violet-700 hover:text-white bg-violet-50 hover:bg-violet-700 border border-violet-150 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer"
              >
                Reset Default Mockups
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-zinc-750">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-150 font-bold text-[9.5px] text-zinc-600 font-mono uppercase">
                    <th className="p-4">Reference & Date</th>
                    <th className="p-4">Inquirer & Client</th>
                    <th className="p-4 text-center">Intended Plan</th>
                    <th className="p-4 text-right">Transfer Amount</th>
                    <th className="p-4 text-center">Simulated Proof</th>
                    <th className="p-4 text-center">Status Badge</th>
                    <th className="p-4 text-right">Action Desk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150">
                  {eftSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-450 italic font-semibold">
                        No direct EFT payment claims found in simulated memory base yet.
                      </td>
                    </tr>
                  ) : (
                    eftSubmissions.map((sub: any) => {
                      return (
                        <tr key={sub.id} className="hover:bg-zinc-50/70 transition-colors font-sans border-b border-zinc-100 last:border-0">
                          <td className="p-4 font-semibold">
                            <div className="font-mono text-[10.5px] text-zinc-900 font-black tracking-tight">{sub.reference}</div>
                            <span className="text-[9.5px] text-zinc-600 block mt-0.5">{new Date(sub.submittedAt).toLocaleString()}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-zinc-800 font-sans">{sub.email}</span>
                            <span className="text-[9px] text-zinc-600 block mt-0.5 uppercase font-mono tracking-widest">Doc Reference: {sub.documentNumber || "N/A"}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block font-mono text-[8.5px] font-black uppercase px-2 py-0.5 rounded leading-none ${
                              sub.plan === "unlimited_yearly" ? "bg-violet-50 text-violet-700 border border-violet-150" : 
                              sub.plan === "credit_bundle" ? "bg-emerald-50 text-emerald-700 border border-emerald-150" : 
                              "bg-zinc-100 text-zinc-700 border border-zinc-200"
                            }`}>
                              {sub.planLabel || sub.plan}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black font-mono text-zinc-900">
                            {sub.currency || "$"}{sub.amount.toFixed(2)}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                alert(`📄 Simulated File View Mode:\nFilename: ${sub.proofFileName}\nReference: ${sub.reference}\nSubmitted by: ${sub.email}\nStatus: ${sub.status.toUpperCase()}\n\nVerified authentic SHA-256 digital signature signature.`);
                              }}
                              className="text-[9.5px] bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-650 px-2 py-1 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer font-bold"
                            >
                              <Paperclip className="w-3 h-3 text-zinc-600" />
                              <span className="max-w-[120px] truncate">{sub.proofFileName}</span>
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            {sub.status === "pending" ? (
                              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 font-extrabold text-[9px] font-mono px-2 py-0.5 rounded-full leading-none border border-amber-150 uppercase animate-pulse">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Pending Statement Match
                              </span>
                            ) : sub.status === "approved" ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-extrabold text-[9px] font-mono px-2 py-0.5 rounded-full leading-none border border-emerald-150 uppercase">
                                ✓ Cleared & Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 font-extrabold text-[9px] font-mono px-2 py-0.5 rounded-full leading-none border border-red-150 uppercase">
                                🚫 Claim Rejected
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {sub.status === "pending" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveEft(sub)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-tight cursor-pointer transition-all active:scale-95"
                                    title="Confirm direct payment in banker statements and activate tier access"
                                  >
                                    Confirm Cleared ✓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeclineEft(sub)}
                                    className="bg-zinc-100 hover:bg-red-50 hover:text-red-700 text-zinc-600 font-bold text-[10px] px-2 py-1 rounded-lg uppercase tracking-tight cursor-pointer border border-zinc-200 hover:border-red-150 transition-all active:scale-95"
                                  >
                                    Decline ✘
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEftLog(sub.id)}
                                  className="p-1 px-2 hover:bg-red-50 hover:text-red-600 text-zinc-450 border border-zinc-200 hover:border-red-100 rounded-lg cursor-pointer transition-all font-bold text-[9.5px] uppercase"
                                  title="Prune this completed claim from active logs"
                                >
                                  Delete Log
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeAdminSubTab === "support_chats" && (
        <div className="space-y-6 animate-fadeIn pb-4 text-zinc-850">
          
          {/* Audit This Doc AI Intelligent Alerts & Account Notifications Panel */}
          {(() => {
            const usersDb = (() => {
              try {
                const raw = localStorage.getItem("gmi_simulated_db_users");
                return raw ? JSON.parse(raw) : {};
              } catch (e) { return {}; }
            })();

            // Find all active/flagged messages matching keywords or flagged explicitly
            const alerts: {
              email: string;
              uid: string;
              reason: string;
              text: string;
              timestamp: string;
              id: string;
            }[] = [];

            const userEmailsSeen = new Set<string>();

            // Scan supportMessages newer-first
            [...supportMessages]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .forEach(m => {
                const textLower = (m.text || "").toLowerCase();
                const emailLower = (m.userEmail || "").toLowerCase();
                if (userEmailsSeen.has(emailLower)) return;

                let isFlagged = m.needsAdminAttention === true;
                let detectedReason = m.alertReason || "";

                if (!isFlagged && m.sender === "user") {
                  if (/refund|chargeback|money\s*back|reimburse/i.test(textLower)) {
                    isFlagged = true;
                    detectedReason = "Refund / Chargeback Assistance Requested";
                  } else if (/account|profile|subscription|settings|credentials|password|login|signin|reset|register/i.test(textLower)) {
                    isFlagged = true;
                    detectedReason = "Account Support / Access Authorization Issue";
                  } else if (/payout|pay|eft|statement|stripe|capitec|receipt|verification|credits|billing|card|limit/i.test(textLower)) {
                    isFlagged = true;
                    detectedReason = "Payment Support & Upgrade Settle Alert";
                  } else if (/support|error|fail|broken|help|trouble/i.test(textLower)) {
                    isFlagged = true;
                    detectedReason = "Technical Assistance or General Helpdesk Alert";
                  }
                }

                if (isFlagged) {
                  userEmailsSeen.add(emailLower);
                  const registeredUid = usersDb[emailLower]?.uid || m.userUid || "GUEST-USER-ID";
                  alerts.push({
                    email: m.userEmail,
                    uid: registeredUid,
                    reason: detectedReason || "Urgent Support / Account Checkup Requested",
                    text: m.text,
                    timestamp: m.timestamp,
                    id: m.id
                  });
                }
              });

            if (alerts.length === 0) return null;

            return (
              <div className="bg-gradient-to-br from-violet-900 via-zinc-950 to-indigo-950 text-zinc-900 rounded-3xl p-6 shadow-xl border border-violet-500/35 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="bg-rose-500/25 text-rose-300 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-rose-500/30 font-mono tracking-widest inline-flex items-center gap-1 leading-none animate-pulse">
                      Audit This Doc AI Intelligent Dispatcher • Active Alerts
                    </span>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2 pt-1.5 font-sans">
                      ⚠️ Audit This Doc AI Smart Admin Alerts: Account & Refund Notifications
                    </h3>
                    <p className="text-[11px] text-zinc-350 max-w-2xl leading-relaxed">
                      Our interactive billing agent **Audit This Doc AI** has flagged active inquiries concerning user account configurations, refund policies, billing limits, or manual statement approvals. Urgent items display target verified emails and unique registration credentials.
                    </p>
                  </div>
                  <div className="hidden sm:block text-right bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <span className="text-2xl font-black font-mono block text-rose-450 leading-none">{alerts.length}</span>
                    <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest font-mono">Pending Desk Action</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 pt-1.5">
                  {alerts.map(al => (
                    <div key={al.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/8 transition-all hover:border-violet-500/30">
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2">
                          <span className="bg-rose-450/20 text-rose-300 text-[8.5px] font-black uppercase px-2 py-0.5 rounded font-mono border border-rose-400/20 tracking-wider">
                            {al.reason}
                          </span>
                          <span className="text-[8.5px] font-mono text-zinc-600 font-bold shrink-0">
                            {new Date(al.timestamp).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11.5px] font-extrabold text-zinc-100 flex items-center gap-1 break-all ink-0" title={al.email}>
                            📧 Email: <span className="font-semibold text-zinc-700 font-mono">{al.email}</span>
                          </p>
                          <p className="text-[10px] font-bold text-zinc-600 flex items-center gap-1 select-all">
                            🆔 Account ID: <span className="font-mono text-violet-300 tracking-wide font-black">{al.uid}</span>
                          </p>
                        </div>

                        <div className="bg-zinc-50/50 rounded-xl p-2.5 border border-white/5">
                          <p className="text-[11px] font-semibold text-zinc-350 italic line-clamp-3">
                            "{al.text}"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChatUserEmail(al.email);
                            const element = document.getElementById("admin-chat-layout-container");
                            if (element) {
                              element.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-extrabold py-2 px-3 rounded-lg uppercase tracking-wide transition-all cursor-pointer text-center font-sans"
                        >
                          🎯 Reply Convo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const rawMsgs = localStorage.getItem("gmi_support_chat_messages");
                            if (rawMsgs) {
                              try {
                                const parsed = JSON.parse(rawMsgs);
                                const updated = parsed.map((m: any) => {
                                  if (m.userEmail.toLowerCase() === al.email.toLowerCase()) {
                                    return { ...m, needsAdminAttention: false };
                                  }
                                  return m;
                                });
                                localStorage.setItem("gmi_support_chat_messages", JSON.stringify(updated));
                                setSupportMessages(updated);
                                triggerAlert("Successfully marked support alert as Handled/Solved!");
                              } catch (e) {}
                            }
                          }}
                          className="bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-zinc-900 text-[10px] font-extrabold py-2 px-3 rounded-lg uppercase tracking-wide transition-all cursor-pointer font-sans"
                        >
                          ✓ Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Threads grid container */}
          <div id="admin-chat-layout-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Threads List Column (Left) */}
            <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-violet-600" /> Support Conversation Threads
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Live incoming customer questions and logs from the floating chat widget.</p>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {(() => {
                // Group messages by userEmail
                const grouped: Record<string, any[]> = {};
                supportMessages.forEach(m => {
                  if (!grouped[m.userEmail]) grouped[m.userEmail] = [];
                  grouped[m.userEmail].push(m);
                });

                const threads = Object.keys(grouped).map(email => {
                  const msgs = grouped[email].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                  const latestMsg = msgs[msgs.length - 1];
                  const needsReply = latestMsg?.sender === "user" || latestMsg?.sender === "guest";
                  return {
                    email,
                    messages: msgs,
                    latestMsg,
                    needsReply
                  };
                }).sort((a,b) => new Date(b.latestMsg?.timestamp).getTime() - new Date(a.latestMsg?.timestamp).getTime());

                if (threads.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-600 font-medium">
                      <p className="text-xs font-bold uppercase tracking-wide">No active conversations found</p>
                      <p className="text-[10px] mt-1">Users will appear here as soon as they message Audit This Doc AI or Support!</p>
                    </div>
                  );
                }

                return threads.map(th => (
                  <button
                    key={th.email}
                    onClick={() => {
                      setSelectedChatUserEmail(th.email);
                      setAdminReplyInput("");
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-100 flex flex-col justify-between cursor-pointer hover:border-violet-300 relative ${
                      selectedChatUserEmail?.toLowerCase() === th.email.toLowerCase()
                        ? "bg-violet-50/50 border-violet-500 ring-1 ring-violet-500"
                        : "bg-zinc-50 border-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-[11.5px] text-zinc-900 truncate max-w-[180px]" title={th.email}>
                        👤 {th.email}
                      </span>
                      <span className="text-[9.5px] font-mono font-medium text-zinc-600">
                        {th.latestMsg ? new Date(th.latestMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-500 line-clamp-2 mt-2 font-medium">
                      {th.latestMsg?.text || "(Empty chat)"}
                    </p>

                    <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-dashed border-zinc-200 w-full">
                      <span className="text-[9.5px] font-bold text-zinc-600 uppercase font-mono">
                        {th.messages.length} total message{th.messages.length !== 1 ? "s" : ""}
                      </span>
                      {th.needsReply ? (
                        <span className="bg-rose-100 text-rose-800 text-[8.5px] font-extrabold px-2 py-0.5 rounded-full uppercase leading-none border border-rose-150 animate-pulse font-mono flex items-center gap-1">
                          ⚠️ Needs Reply
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-800 text-[8.5px] font-extrabold px-2 py-0.5 rounded-full uppercase leading-none border border-emerald-150 font-mono">
                          ✓ Handled
                        </span>
                      )}
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>

          {/* Active Conversation screen & Replying (Right) */}
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm min-h-[460px] flex flex-col justify-between">
            {selectedChatUserEmail ? (
              <div className="flex flex-col h-full justify-between flex-1">
                
                {/* Active Chat Header */}
                <div className="border-b border-zinc-100 pb-4 mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-sm text-zinc-900 uppercase tracking-tight flex items-center gap-1.5">
                      💬 Conversing with: {selectedChatUserEmail}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-medium font-mono">TYPE: Persistent Local Storage Channel</p>
                  </div>
                  <button
                    onClick={() => {
                      // Prune chat history
                      if (confirm(`Are you sure you want to completely erase chat logs for ${selectedChatUserEmail}?`)) {
                        const updated = supportMessages.filter(m => m.userEmail.toLowerCase() !== selectedChatUserEmail.toLowerCase());
                        localStorage.setItem("gmi_support_chat_messages", JSON.stringify(updated));
                        setSupportMessages(updated);
                        setSelectedChatUserEmail(null);
                        triggerAlert("Erase chat history complete!");
                      }
                    }}
                    className="text-red-500 hover:text-red-650 font-bold text-[10px] uppercase cursor-pointer"
                  >
                    Clear History 🗑️
                  </button>
                </div>

                {/* Message logs list bucket */}
                <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3.5 max-h-[340px] overflow-y-auto mb-4">
                  {supportMessages
                    .filter(m => m.userEmail.toLowerCase() === selectedChatUserEmail.toLowerCase())
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((msg: any) => {
                      const isAdmin = msg.sender === "admin";
                      const isAria = msg.sender === "aria";
                      return (
                        <div key={msg.id} className={`flex gap-2 max-w-[85%] ${isAdmin ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-black uppercase ${
                            isAdmin ? "bg-amber-600 text-zinc-900" : isAria ? "bg-violet-100 text-violet-700" : "bg-zinc-200 text-zinc-800"
                          }`}>
                            {isAdmin ? "AD" : isAria ? "AR" : "ME"}
                          </div>
                          <div>
                            <span className="block text-[8.5px] font-mono text-zinc-600 font-bold px-0.5">
                              {msg.senderName} • {new Date(msg.timestamp).toLocaleString()}
                            </span>
                            <div className={`mt-0.5 px-3 py-2 rounded-2xl text-[11px] leading-relaxed font-semibold ${
                              isAdmin 
                                ? "bg-zinc-50 text-zinc-900 rounded-tr-none" 
                                : isAria 
                                ? "bg-white border border-zinc-200 text-zinc-700"
                                : "bg-violet-50 text-violet-950 border border-violet-100 rounded-tl-none"
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Reply section form */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[9px] text-zinc-600 flex items-center font-bold uppercase tracking-widest font-mono shrink-0 mr-1.5 mt-1">Quick responses:</span>
                    <button
                      type="button"
                      onClick={() => setAdminReplyInput("Hi! Your manual Capitec EFT transfer has been successfully verified, cleared, and your dynamic credits have been updated. Log out and back in to refresh instantly! Let us know if we can assist further.")}
                      className="text-[9.5px] bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900 text-zinc-650 font-bold px-2 py-1 rounded-lg border border-zinc-200 cursor-pointer"
                    >
                      💰 EFT Cleared
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminReplyInput("Thank you for reaching out to Audit This Doc AI support. Could you please copy your payment receipt reference or attach your EFT PDF statement voucher so our accounts admin team can audit it directly?")}
                      className="text-[9.5px] bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900 text-zinc-650 font-bold px-2 py-1 rounded-lg border border-zinc-200 cursor-pointer"
                    >
                      📋 Request Statement Proof
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminReplyInput("Hello! I am one of the administrators here. Your configuration has been fully reset and your subscription registry verified as active. Let me know if you run into any layout issues.")}
                      className="text-[9.5px] bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900 text-zinc-650 font-bold px-2 py-1 rounded-lg border border-zinc-200 cursor-pointer"
                    >
                      🛠️ Setup Resolved
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!adminReplyInput.trim()) return;

                      const replyMsg = {
                        id: "msg-admin-" + Date.now(),
                        sender: "admin",
                        senderName: "Audit This Doc AI Admin Support",
                        text: adminReplyInput,
                        timestamp: new Date().toISOString(),
                        userEmail: selectedChatUserEmail
                      };

                      const raw = localStorage.getItem("gmi_support_chat_messages");
                      let allMsgs = [];
                      if (raw) {
                        try { allMsgs = JSON.parse(raw); } catch (e) {}
                      }
                      allMsgs.push(replyMsg);
                      localStorage.setItem("gmi_support_chat_messages", JSON.stringify(allMsgs));
                      
                      // Refresh messages locally
                      setSupportMessages(allMsgs);
                      setAdminReplyInput("");
                      triggerAlert("Reply successfully dispatched to support state!");
                    }}
                    className="flex flex-col gap-2"
                  >
                    <textarea
                      rows={3}
                      value={adminReplyInput}
                      onChange={(e) => setAdminReplyInput(e.target.value)}
                      placeholder={`Type reply message to ${selectedChatUserEmail}...`}
                      className="w-full p-3 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium text-zinc-800"
                    />
                    <button
                      type="submit"
                      disabled={!adminReplyInput.trim()}
                      className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all self-end cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispatch Admin Reply
                    </button>
                  </form>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-zinc-600 space-y-3.5">
                <div className="w-14 h-14 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-zinc-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-zinc-900 uppercase tracking-tight">No Chat Thread Selected</h4>
                  <p className="text-[11px] text-zinc-500 max-w-sm mt-1">Select one of the support conversation lists on the left to read user logs and directly reply.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      )}

      {/* RENDER NEW PAYMENTS LEDGER SUBTAB */}
      {activeAdminSubTab === "notifications" && (
        <div className="space-y-6 animate-fadeIn mt-6 bg-zinc-50/40 p-6 rounded-3xl border border-zinc-200">
          
          {/* Header Summary Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-left">
            <div className="bg-emerald-950 border border-emerald-800 rounded-3xl p-5 text-zinc-900 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-350 block font-mono">Gross Workspace Revenue</span>
                <h3 className="text-2xl font-black mt-2 font-sans tracking-tight text-zinc-900">
                  ${adminNotifications.reduce((acc, n) => acc + (n.amount || 0), 0).toFixed(2)}
                </h3>
              </div>
              <p className="text-[10px] text-emerald-300 mt-2">
                Processed via secure Visa/Mastercard credit checkouts and verified direct Capitec statements.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-5 text-zinc-900 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600 block font-mono">Total Successful Sales</span>
                <h3 className="text-2xl font-black mt-2 font-sans tracking-tight text-zinc-900">
                  {adminNotifications.length} Transactions
                </h3>
              </div>
              <p className="text-[10px] text-zinc-600 mt-2">
                All accounts successfully updated and limits topped-up instantly inside local tables.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm text-zinc-900 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block font-mono">Real-time Admin Dispatch</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                  <span className="font-extrabold text-sm uppercase">Active Dispatcher</span>
                </div>
              </div>
              <p className="text-[10.5px] text-zinc-500 mt-2 font-medium">
                Admin alerts automatically dispatched to <strong className="text-zinc-900 font-bold">brigittalombard09@gmail.com</strong> for real-time checkouts.
              </p>
            </div>
          </div>

          {/* Core Payments Ledger Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left mt-4">
            <div className="lg:col-span-4 space-y-4 font-sans">
              
              {/* Quick Actions Panel */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">Ledger Actions</h4>
                  <p className="text-[10.5px] text-zinc-500 mt-0.5">Control simulation triggers and notifications storage records.</p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleTriggerTestPayment}
                    className="w-full text-center bg-white hover:bg-zinc-850 text-zinc-900 font-extrabold text-[11px] uppercase py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>💸 Simulate Cards Checkout</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="w-full text-center bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold text-[11px] uppercase py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Mark All Notifications Read
                  </button>

                  <button
                    type="button"
                    onClick={handleClearNotifications}
                    className="w-full text-center bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-[11px] uppercase py-2.5 rounded-xl transition-all cursor-pointer border border-rose-150"
                  >
                    Clear Ledger History 🗑️
                  </button>
                </div>
              </div>

              {/* Secure SMTP details */}
              <div className="bg-white text-zinc-600 rounded-3xl p-5 border border-zinc-200 text-xs leading-normal">
                <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase block font-mono mb-1">Secure SMTP Service</span>
                <p className="text-[11px] text-zinc-350 leading-relaxed">
                  Every inbound payment automatically constructs a dispatch email request on our secure server, notifying <strong className="text-zinc-900 font-bold font-mono text-[10px]">brigittalombard09@gmail.com</strong>. View sandbox actions anytime from local transaction feeds.
                </p>
              </div>

            </div>

            {/* Inbound Notifications List */}
            <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm min-h-[400px]">
              <div className="border-b border-zinc-100 pb-4 mb-4 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-zinc-950 uppercase tracking-tight">Real-time payment logs</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Sorted chronologically (Newest first)</p>
                </div>
                <span className="text-xs bg-zinc-100 font-bold px-3 py-1 rounded-full text-zinc-650">
                  Total logged: {adminNotifications.length}
                </span>
              </div>

              {adminNotifications.length === 0 ? (
                <div className="py-20 text-center text-zinc-600 space-y-3.5">
                  <div className="w-14 h-14 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center mx-auto">
                    <AlertCircle className="w-7 h-7 text-zinc-600" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-zinc-900 uppercase">Payment feeds are empty</h5>
                    <p className="text-[11px] text-zinc-500 max-w-sm mt-1 mx-auto">Click the &quot;Simulate Cards Checkout&quot; action button on the left or sign up a user & settle dynamic plans to spawn real logs!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {adminNotifications.map((notif: any) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-3 w-full text-left relative overflow-hidden ${
                        notif.unread 
                          ? "bg-violet-50/60 border-violet-200" 
                          : "bg-zinc-50/70 border-zinc-200/80"
                      }`}
                    >
                      {/* Glow indicator for new transactions */}
                      {notif.unread && (
                        <span className="absolute top-0 bottom-0 left-0 w-1 bg-violet-600 animate-pulse"></span>
                      )}

                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 select-none bg-emerald-100 text-emerald-800">
                        {notif.method === 'debit_order' ? '🏦' : '💳'}
                      </div>

                      <div className="flex-1 space-y-1 text-zinc-900">
                        <div className="flex items-center justify-between">
                          <h5 className="font-sans font-bold text-xs text-zinc-950 tracking-tight">{notif.title}</h5>
                          <span className="text-[9px] font-mono text-zinc-600 font-bold">{new Date(notif.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-zinc-650 font-medium leading-relaxed">{notif.message}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[8.5px] bg-zinc-50 text-zinc-900 font-mono font-bold uppercase px-1.5 py-0.5 rounded">ID: {notif.id}</span>
                          <span className="text-[8.5px] bg-indigo-50 text-indigo-700 font-black uppercase px-2 py-0.5 rounded border border-indigo-100">Method: {notif.method}</span>
                          <span className="text-[8.5px] bg-rose-50 text-rose-700 font-sans font-bold uppercase px-2 py-0.5 rounded border border-rose-100">Tier: {notif.plan}</span>
                          <span className="text-[9.5px] ml-auto font-black text-emerald-700 font-mono">${notif.amount?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>
      )}
      {activeAdminSubTab === "calculator" && (
        <div className="space-y-6 animate-fadeIn mt-6 bg-zinc-50/40 p-6 rounded-3xl border border-zinc-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200">
              <Calculator className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h3 className="font-bold text-lg uppercase tracking-wider text-zinc-900">
                Financial Calculator
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5 font-medium">Quick admin calculator for tax & margin checks.</p>
            </div>
          </div>
          <div className="max-w-md mx-auto">
            <SimpleCalculator />
          </div>
        </div>
      )}

      {activeAdminSubTab === "failed_transactions" && (
        <div className="space-y-6 animate-fadeIn mt-6 bg-zinc-50/40 p-6 rounded-3xl border border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center border border-rose-200">
                <AlertCircle className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="font-bold text-lg uppercase tracking-wider text-zinc-900">
                  Failed Stripe Transactions
                </h3>
                <p className="text-zinc-500 text-xs mt-0.5 font-medium">Real-time troubleshooting logs for failed payments.</p>
              </div>
            </div>
            <button
              onClick={fetchFailedLogs}
              disabled={isLoadingLogs}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              <ArrowUpDown className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              {isLoadingLogs ? "Fetching..." : "Refresh Logs"}
            </button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            {isLoadingLogs ? (
              <div className="p-8 text-center text-zinc-500 text-sm font-medium animate-pulse">
                Fetching secure transaction logs from Stripe...
              </div>
            ) : failedLogs.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-zinc-900 font-bold tracking-wide">No Failed Transactions Detected</p>
                  <p className="text-zinc-500 text-xs mt-1 font-medium">All recent Stripe payments processed successfully or there are no logs available.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-4 font-mono">Date</th>
                      <th className="p-4">Customer Email</th>
                      <th className="p-4 font-mono">Amount</th>
                      <th className="p-4 text-rose-600">Error Code</th>
                      <th className="p-4">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs font-medium">
                    {failedLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-4 font-mono text-zinc-600 whitespace-nowrap">
                          {new Date(log.created * 1000).toLocaleString()}
                        </td>
                        <td className="p-4 text-zinc-800 font-bold">{log.customer_email}</td>
                        <td className="p-4 font-mono font-black text-zinc-900">
                          {log.currency.toUpperCase()} {(log.amount / 100).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md font-mono text-[10px] font-bold">
                            {log.error_code}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-600 text-[11px] leading-relaxed">
                          {log.error_message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-yellow-50/40 border border-yellow-200 rounded-2xl p-4 text-[11px] text-yellow-805 leading-relaxed font-semibold">
        💡 <strong className="text-yellow-905 uppercase">Sandbox Database Model Note:</strong> User data persistence maps dynamically to the browser's persistent Local Database. Operations made inside this panel immediately modify active system user limits and registration tables in the local environment, facilitating painless multi-tier testing!
      </div>

    </div>
  );
}
