/**
 * Data structures for "Audit This Doc AI" app
 */

export interface DocumentItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  taxPercent: number; // e.g., 8 means 8%
  discountPercent: number; // e.g., 5 means 5%
  discountAmount?: number; // fixed discount amount per item
  includeTaxInRate?: boolean;
  forcePageBreakBefore?: boolean;
}

export interface CustomField {
  label: string;
  value: string;
}

export interface DocumentData {
  documentType: 'invoice' | 'receipt' | 'quote' | 'purchase_order' | 'delivery_note' | 'custom' | 'letterhead' | 'resume';
  customTypeName: string; // e.g. "Storage Order" or "Freelance Slip"
  documentNumber: string;
  logoUrl?: string; // Built-in templates support or base64 uploads
  logoText?: string; // Text logo fallback
  logoWidth?: number; // 10 to 100, percentage
  logoAlign?: 'left' | 'center' | 'right'; // Preset alignment
  logoRotation?: number; // 0 to 360, degrees
  issueDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  currency: string; // e.g., "$", "€", "£", "¥", "Rp", "R$" or words "USD", "ZAR"
  
  // Dual Currency Support
  dualCurrencyEnabled?: boolean;
  secondaryCurrency?: string; // e.g. "$", "€", "£", "¥", "Rp", "ZAR", "USD"
  secondaryCurrencyRate?: number; // Exchange rate multiplier from base to secondary
  
  // Sender Corporate Info
  senderName: string;
  senderCompany: string;
  senderEmail: string;
  senderPhone: string;
  senderAddress: string;
  senderTaxId?: string; // VAT or Tax ID
  senderTaxCountry?: string;
  
  // Client Corporate Info
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientAddressType?: 'Billing' | 'Shipping' | 'Physical';
  clientTaxId?: string;
  clientTaxCountry?: string;

  // Custom Fields
  customFields: CustomField[];

  // Dynamic Item Grid
  items: DocumentItem[];

  // Global Charges/Adjustments
  discountRate: number; // Flat discount
  taxRate: number; // Flat global tax percentage
  shippingCharge: number; // Flat shipping rate
  amountPaid: number; // Deposit or payment already made
  taxInclusive?: boolean; // Whether rates are tax-inclusive
  status?: string;

  // Automated Email Nudges
  nudgeEnabled?: boolean;
  nudgeDaysOverdue?: number;

  // Meta notes & legal
  notes: string;
  terms: string;

  // Signatures
  signatureData?: string; // Drawing Pad payload url/base64
  signatureName?: string; // Signature name typed
  
  // Letterhead fields
  letterSubject?: string;
  letterSalutation?: string;
  letterBody?: string;
  letterSignoff?: string;
  letterSenderTitle?: string;

  // Resume fields
  resumePhotoUrl?: string;
  resumeObjective?: string;
  resumeSkills?: string;
  resumeEducation?: string;
  resumeCertifications?: string;
  resumeLanguages?: string;

  // Visual Styling Themes
  themeColor: 'violet' | 'gold' | 'emerald' | 'sapphire' | 'rose' | 'charcoal';
  themeLayout: 'elegant_standard' | 'modern_bold' | 'minimalist_swiss' | 'compact_grid' | 'neon_digital';
  dateFormat?: string; // e.g. "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY" | "DD-MM-YYYY" | "MMM DD, YYYY"
  fontFamily?: 'sans' | 'serif' | 'mono';
  baseFontSize?: number;

  // Layout specific fields (optional)
  receiptPaymentMethod?: string;
  receiptCashierName?: string;
  receiptReferenceId?: string;
  quoteExpiryDate?: string;
  quoteDepositPercentage?: number;
  poDeliveryDate?: string;
  poApproverName?: string;
  poDepartmentCode?: string;
  deliveryPersonName?: string;
  deliveryVehicleReg?: string;
  deliveryTrackingId?: string;
  deliveryReceivedBy?: string;

  // QR Code customizations
  qrCodeEnabled?: boolean;
  qrCodeDestinationUrl?: string;

  // Bank Details for Invoice Templates
  bankName?: string;
  bankAccountHolder?: string;
  bankAccountNumber?: string;
  bankBranchCode?: string;
  bankSwiftCode?: string;
  bankIban?: string;

  // Real-time Doctorate Auditing & Reconciliation fields
  appendAuditReport?: boolean;
  auditComplianceScore?: number;
  auditStatus?: 'untested' | 'approved' | 'warnings';
  auditNarrative?: string;

  // WhatsApp sharing metadata
  last_sent_via_whatsapp?: string;

  // Watermark parameters
  applyPaidWatermark?: boolean;
}

export type ActiveDoc = DocumentData;

export interface RecentWaContact {
  name: string;
  phone: string;
  timestamp: string;
}

export interface SavedHistory {
  id: string;
  timestamp: string;
  documentData: DocumentData;
}

export interface ProfileCatalog {
  savedSenders: { id: string; name: string; company: string; email: string; address: string; phone: string; taxId?: string }[];
  savedClients: { id: string; name: string; company: string; email: string; address: string; phone: string; taxId?: string }[];
  savedProducts: { id: string; name: string; description: string; rate: number; taxPercent: number }[];
}

export interface UserAccount {
  uid: string;
  email: string;
  paymentTier: "free" | "starter" | "professional" | "business" | "enterprise";
  invoiceCredits: number;
  amountPaid: number;
  invoicesCount: number;
  createdAt: string;
  isSubscriptionCancelled?: boolean;
  debitOrderEnabled?: boolean;
  debitOrderBank?: string;
  debitOrderAccNumber?: string;
  debitOrderAccType?: string;
  debitOrderAccHolder?: string;
  debitOrderDate?: string;
  subscriptionType?: "card" | "debit_order" | "paypal" | "trial";
  trialActive?: boolean;
  trialStartDate?: string;
  country?: string;
  isPro?: boolean;
  aiCreditsRemaining?: number;
  aiCreditsTotal?: number;
}

export interface ScheduledReminder {
  id: string;
  senderCompany: string;
  clientEmail: string;
  clientName: string;
  docNumber: string;
  docType: string;
  docTotal: string;
  currency: string;
  reminderText: string;
  scheduledFor: string;
  status: "pending" | "sent" | "failed";
  sentAt?: string;
  emailPreviewUrl?: string;
  reminderType?: "invoice_reminder" | "meeting" | "custom_alert";
  reminderSubject?: string;
}

export interface RecurringSchedule {
  id: string;
  clientEmail: string;
  clientName: string;
  clientCompany: string;
  senderCompany: string;
  frequency: "weekly" | "monthly" | "biweekly" | "yearly";
  nextRunDate: string;
  documentData: DocumentData;
  status: "active" | "paused";
  createdAt: string;
  lastTriggeredAt?: string;
}

export interface InvoiceReminder {
  id: string;
  message: string;
  scheduledTime: string; // ISO string of reminder datetime
  triggered: boolean;
  documentNumber: string;
}

export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  category: string; // e.g. "Rent", "Software", etc.
  vendor: string;
  amount: number;
  currency: string;
  notes: string;
  taxDeductible: boolean;
  receiptAttached?: boolean;
  type?: "income" | "expense";
}

export interface WorkTask {
  id: string;
  name: string;
  completed: boolean;
  subTasks?: WorkTask[];
}

export interface WorkJob {
  id: string;
  name: string;
  clientName: string;
  linkedInvoiceId: string;
  linkedInvoiceNum: string;
  status: 'pending' | 'in_progress' | 'completed';
  tasks: WorkTask[];
  dueDate?: string;
}

export interface ClientCallLog {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // in minutes
  callType: 'incoming' | 'outgoing' | 'missed' | 'scheduled';
  notes: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface CreditorRecord {
  id: string;
  vendorName: string;
  category: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'unpaid' | 'paid' | 'overdue';
  notes: string;
  contactEmail?: string;
  contactPhone?: string;
  taxReference?: string;
}

export interface DebtorRecord {
  id: string;
  clientName: string;
  clientCompany?: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'unpaid' | 'paid' | 'overdue';
  notes: string;
  contactEmail?: string;
  contactPhone?: string;
  taxReference?: string;
}





export interface TaxReturnRecord {
  id: string;
  year: number;
  dateFiled: string;
  status: "pending" | "filed" | "accepted" | "rejected";
  category: "Personal" | "Business" | "Capital Gains" | string;
  totalIncome: number;
  totalTax: number;
  notes: string;
}
