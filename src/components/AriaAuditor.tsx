import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  FileCheck, 
  AlertCircle, 
  CheckCircle, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Wand2, 
  Layers, 
  Check, 
  BookOpen, 
  Activity,
  FileSpreadsheet,
  Upload,
  Clock,
  Unlock,
  Download
} from "lucide-react";
import { DocumentData, DocumentItem, UserAccount } from "../types";
import { applyForensicFix } from "../utils/applyForensicFix";

const simulatedExtractedInvoices = [
  {
    senderName: "Gold Standard Tech SA",
    senderCompany: "Gold Standard Technologies",
    senderEmail: "billing@goldstandard.co.za",
    senderPhone: "+27 11 405 8899",
    senderAddress: "12 Sandton Drive, Johannesburg, 2196",
    senderTaxId: "VAT-48901248",
    clientName: "Audit This Doc AI Client",
    clientCompany: "Audit This Doc AI",
    clientEmail: "procurement@auditaria.com",
    clientPhone: "+27 21 556 7788",
    clientAddress: "Greenstone Hill, Cape Town, 8001",
    documentNumber: "INV-2026-904",
    issueDate: "2026-06-12",
    dueDate: "2026-07-12",
    currency: "R",
    items: [
      { id: "item-1", name: "Cybersecurity Compliance Audit", description: "Comprehensive corporate firewall audit & pentesting.", quantity: 1, rate: 12500, taxPercent: 15, discountPercent: 0 },
      { id: "item-2", name: "Secure Server Hardening", description: "Configuring AES-256 cloud container encryptions.", quantity: 3, rate: 4500, taxPercent: 15, discountPercent: 10 }
    ],
    bankName: "Capitec Bank",
    bankAccountHolder: "Gold Standard Technologies",
    bankAccountNumber: "1002548811",
    bankSwiftCode: "CABLZAJJ",
    notes: "Scanned and auto-drafted via Forensic OCR Scan Engine.",
    terms: "Payment due within 30 days of invoice transmission."
  },
  {
    senderName: "Pixel Perfect Agency",
    senderCompany: "Pixel Perfect Digital",
    senderEmail: "finance@pixelperfect.design",
    senderPhone: "+27 31 889 0011",
    senderAddress: "88 Umhlanga Rocks Drive, Durban, 4051",
    senderTaxId: "VAT-55102948",
    clientName: "Audit This Doc AI",
    clientCompany: "Auditing Systems Ltd",
    clientEmail: "aria@auditingsystems.co.za",
    clientPhone: "+27 82 455 0092",
    clientAddress: "77 Rosebank Mall, Johannesburg, 2196",
    documentNumber: "PP-98831",
    issueDate: "2026-06-14",
    dueDate: "2026-06-28",
    currency: "R",
    items: [
      { id: "item-1", name: "High-Fidelity UI Interface Crafting", description: "Design of premium visual layouts and vector asset systems.", quantity: 24, rate: 850, taxPercent: 15, discountPercent: 5 },
      { id: "item-2", name: "Tailwind CSS Layout Optimization", description: "Optimizing responsive prefixes and typography pairing.", quantity: 8, rate: 950, taxPercent: 15, discountPercent: 0 }
    ],
    bankName: "FNB Bank",
    bankAccountHolder: "Pixel Perfect Digital Ltd",
    bankAccountNumber: "6289940122",
    bankSwiftCode: "FIRNZAJJ",
    notes: "Scanned and verified digitally via Audit This Doc AI Forensic parser.",
    terms: "EFT transfers clear instantly with reference PP-98831."
  }
];

interface AriaAuditorProps {
  activeDoc: DocumentData;
  setActiveDoc: React.Dispatch<React.SetStateAction<DocumentData>>;
  onShowAlert: (msg: string) => void;
  userProfile?: UserAccount | null;
  isUnlocked: boolean;
  onOpenPaymentModal: () => void;
  onDownloadPdf?: () => void;
  defaultDocTypeToScan?: "invoice" | "ledger" | "contract" | "tax" | "legal_risk";
}

export default function AriaAuditor({ 
  activeDoc, 
  setActiveDoc, 
  onShowAlert, 
  userProfile, 
  isUnlocked, 
  onOpenPaymentModal,
  onDownloadPdf,
  defaultDocTypeToScan = "invoice"
}: AriaAuditorProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState(0);
  const [hasScanned, setHasScanned] = useState(false);
  const [activeAuditorMode, setActiveAuditorMode] = useState<"workspace" | "external">("workspace");
  const [docTypeToScan, setDocTypeToScan] = useState<"invoice" | "ledger" | "contract" | "tax" | "legal_risk">(defaultDocTypeToScan);
  const [showMoreAuditTypes, setShowMoreAuditTypes] = useState(false);
  const [countryStandard, setCountryStandard] = useState("SA Standard");
  const scanIntervalRef = useRef<any>(null);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return "Morning, Boss! Ready to save some money?";
    if (hr >= 12 && hr < 17) return "Afternoon, Boss! Let's double check those VATs.";
    return "Evening, Boss! Wrapping up invoices for the day?";
  };

  // Drag and drop states for external invoice files
  const [dragActive, setDragActive] = useState(false);
  const [isOcrParsing, setIsOcrParsing] = useState(false);
  const [ocrStep, setOcrStep] = useState(0);
  const [scannedFilename, setScannedFilename] = useState("");
  const [aiAuditReport, setAiAuditReport] = useState<any>(null);

  const auditStages = useMemo(() => {
    if (docTypeToScan === "ledger") {
      return [
        "Analyzing double-entry journal balance parity...",
        "Scanning trial balance debits vs credits...",
        "Verifying asset & liability ledger reconciliation accounts...",
        "Checking GAAP depreciation & amortisation schedule postings...",
        "Identifying any accounting variance or unposted ledger adjustments...",
        "Grading overall ledger bookkeeping compliance...",
      ];
    } else if (docTypeToScan === "contract") {
      return [
        "Reading legal contracting parties, titles & definitions...",
        "Analyzing payment indemnity, liability limit & warranty sections...",
        "Verifying billing timeline clause compliance...",
        "Scanning cancellation penalty & force majeure provisions...",
        "Validating executive electronic signature certificates...",
        "Grading standard legal commercial compliance index...",
      ];
    } else if (docTypeToScan === "tax") {
      return [
        "Scanning tax disclosure corporate declarations...",
        "Verifying localized VAT, GST or sales tax rate calculations...",
        "Auditing input-tax credit eligibility claims...",
        "Cross-matching bank deposits with corresponding transactions...",
        "Inspecting tax evasion anomalies or threshold compliance...",
        "Grading legal taxation advisory report alignment...",
      ];
    } else if (docTypeToScan === "legal_risk") {
      return [
        "Reading administrative signatures and executing officer positions...",
        "Detecting procurement purchase order (PO) reference citations...",
        "Scanning potential default terms & contract liabilities...",
        "Auditing billing sequence validity and due date mismatch risks...",
        "Locating regulatory tax compliance anomalies...",
        "Formulating independent Ph.D compliance scoring metrics...",
      ];
    }
    // Default invoice / billing sheet audit stages
    return [
      "Checking legal corporate headers...",
      "Validating arithmetic totals & line prices...",
      "Inspecting CAPITEC/EFT settlement routing fields...",
      "Scanning tax compliance & legal disclosures...",
      "Authorizing digital signatures against journal audit records...",
      "Grading GAAP ledger eligibility status...",
    ];
  }, [docTypeToScan]);

  const ocrStages = useMemo(() => {
    if (docTypeToScan === "ledger") {
      return [
        "Extracting account list names and ledger balances...",
        "Mapping double-entry accounting matrix cell columns...",
        "Parsing cash collections, expense accounts, and equity journals...",
        "Resolving math formulas on general ledger outputs...",
        "Importing audited ledgers structure into active session memory...",
      ];
    } else if (docTypeToScan === "contract") {
      return [
        "Identifying governing jurisdictions and legal representation clauses...",
        "Performing legal layout optical-layer categorization...",
        "Isolating payment terms net period clauses (e.g., Net 30, COD)...",
        "Reading professional services outlines and pricing schedules...",
        "Saving compliance draft parameters to your workspace editor...",
      ];
    } else if (docTypeToScan === "tax") {
      return [
        "Parsing tax authority return templates and payment receipts...",
        "Detecting regional sales tax rates and tax bracket categories...",
        "Reconciling bank transaction entries with tax registration metadata...",
        "Decoding audit trail certificates and withholding tax declarations...",
        "Mapping computed tax metrics directly to workspace sheets...",
      ];
    } else if (docTypeToScan === "legal_risk") {
      return [
        "Scanning digital signing layers and timestamp credentials...",
        "Extracting buyer purchase order references and contracting indexes...",
        "Decoding backdated or mismatched date sequences...",
        "Analyzing VAT registrations and standard billing legislation codes...",
        "Synchronizing computed legal compliance scores back to active session database...",
      ];
    }
    return [
      "Reading file pixels & checking metadata structures...",
      "De-skewing document grids and mapping text layers...",
      "Locating primary corporate vendor & buyer VAT registration numbers...",
      "Reading line items, volumes, VAT rates & grand totals cell data...",
      "Fusing transaction ledger draft JSON to workspace draft parameters...",
    ];
  }, [docTypeToScan]);

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const trialStatus = useMemo(() => {
    return { active: false, daysLeft: 0, isExpired: false };
  }, [userProfile]);

  const canUseAudits = isUnlocked;

  // Track expanded audit citation detail item
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);

  // Parse saved history for duplicates check
  const savedHistory = useMemo(() => {
    try {
      const raw = localStorage.getItem("gmi_saved_history");
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return [];
  }, []);

  // Compute overall dynamic invoice total amount
  const activeInvoiceTotal = useMemo(() => {
    if (!activeDoc.items) return 0;
    let sum = 0;
    activeDoc.items.forEach(item => {
      const base = item.quantity * item.rate;
      const disc = base * ((item.discountPercent || 0) / 100) + (item.discountAmount || 0);
      const sub = Math.max(0, base - disc);
      const tax = sub * ((item.taxPercent || 0) / 100);
      sum += sub + tax;
    });
    return sum;
  }, [activeDoc.items]);

  // Compute the 8 specific Forensic Audit Checks
  const forensicChecks = useMemo(() => {
    // 1. Math Forensics
    const isMathOk = !!(activeDoc.items && activeDoc.items.length > 0 && activeDoc.items.every(
      item => item.quantity > 0 && item.rate >= 0
    ));
    const mathCheck = {
      key: "math_forensics",
      label: "Math Forensics Audits",
      status: isMathOk,
      desc: "Checking if items list arithmetic total matches subtotal calculation parameters.",
      errorMessage: "[ERROR] Math Mismatch: Line items contain undefined quantities, zero values, or negative pricing parameters. Line ledger total is mathematically unstable.",
      fixMessage: "[FIX] Configure positive rate and non-zero quantity fields in the item editor.",
      legalExplanation: "Why this matters legally: Under GAAS (Generally Accepted Auditing Standards) and IFRS, transactional computation must reconcile bulletproofly. Incorrect multipliers invalidate ledger representation and trigger tax audit queries.",
      severity: isMathOk ? "passed" : "critical"
    };

    // 2. Tax/VAT/GST Forensics
    const isExportClient = !!(activeDoc.clientEmail && (
      activeDoc.clientEmail.endsWith(".com") || 
      activeDoc.clientEmail.endsWith(".uk") || 
      activeDoc.clientEmail.endsWith(".eu") || 
      activeDoc.clientEmail.endsWith(".us") || 
      activeDoc.clientEmail.endsWith(".org")
    ) && !activeDoc.clientEmail.endsWith(".co.za"));
    
    // Mismatch when export target is charged local VAT rate (>0)
    const hasExportVAtMismatch = !!(isExportClient && activeDoc.items?.some(i => i.taxPercent > 0));
    const isTaxOk = !hasExportVAtMismatch;
    const taxCheck = {
      key: "tax_forensics",
      label: "Tax/VAT/GST Forensics Audits",
      status: isTaxOk,
      desc: "Auditing illegal international VAT surcharge boundaries on external exports.",
      errorMessage: `[ERROR] Tax rate is illegal for export invoices. Recipient email is foreign (${activeDoc.clientEmail || "unknown"}). Legal export rate is zero-rated (0%).`,
      fixMessage: "[FIX] Adjust all line item VAT percentages to 0% in your details, or attach customs clearance numbers.",
      legalExplanation: "Why this matters legally: Local tax authorities (like IRS, SARS, HMRC) require exports to be zero-rated. Failing to do so can trigger penalties up to 200% of the tax value for tax evasion or misfiling.",
      severity: isTaxOk ? "passed" : "critical"
    };

    // 3. Date Forensics
    let isDateOk = true;
    if (activeDoc.issueDate && activeDoc.dueDate) {
      const issueTime = new Date(activeDoc.issueDate).getTime();
      const dueTime = new Date(activeDoc.dueDate).getTime();
      isDateOk = dueTime >= issueTime;
    }
    const dateCheck = {
      key: "date_forensics",
      label: "Chronological Date Forensics",
      status: isDateOk,
      desc: "Validating timeline sequences to prevent reverse billing backdating indices.",
      errorMessage: `[ERROR] Chronological Deficit: Document issue date (${activeDoc.issueDate}) exceeds the designated payment due date (${activeDoc.dueDate}). Payment terms cannot expire before transaction inception.`,
      fixMessage: "[FIX] Correct the invoice due date to be at least same-day or a future date matching your Net-30/COD terms.",
      legalExplanation: "Why this matters legally: Backdating or forward-dating invoices to manipulate income between tax periods is a form of accounting fraud. Forensic auditors strictly check date chronology to confirm revenue matches of delivery.",
      severity: isDateOk ? "passed" : "critical"
    };

    // 4. Signature Forensics
    const isHighValue = activeInvoiceTotal > 1000 || (activeDoc.currency === "R" || activeDoc.currency === "ZAR" ? activeInvoiceTotal > 15000 : false);
    const hasSig = !!(activeDoc.signatureData || activeDoc.signatureName);
    const isSigOk = !(isHighValue && !hasSig);
    const sigCheck = {
      key: "signature_forensics",
      label: "Signature Forensics Audits",
      status: isSigOk,
      desc: "Enforcing dual authorized endorsement validation indexes on critical billing parameters.",
      errorMessage: `[ERROR] Missing Certified Signatory: This document total (${activeDoc.currency || "$"}${activeInvoiceTotal.toFixed(2)}) requires authorized execution. Missing signing officer's digital signature.`,
      fixMessage: "[FIX] Navigate to bottom of document page to draw a custom signature or type an authorized signing officer name.",
      legalExplanation: "Why this matters legally: For high-value transactions, corporate purchase rules and IRS §162 require written audit-trail endorsement to prove business expenses are legitimate. Unsigned corporate ledgers often get disallowed in audits.",
      severity: isSigOk ? "passed" : "warning"
    };

    // 5. Duplicate Forensics
    const isDuplicateInvoice = savedHistory.some((item: any) => 
      item.documentData?.documentNumber === activeDoc.documentNumber && 
      item.documentData?.clientCompany === activeDoc.clientCompany &&
      item.documentData?.issueDate === activeDoc.issueDate
    );
    const isDupOk = !isDuplicateInvoice;
    const dupCheck = {
      key: "duplicate_forensics",
      label: "Double-Billing Duplicate Forensics",
      status: isDupOk,
      desc: "Checking general ledger registry overlap to prevent accidental double-billing payouts.",
      errorMessage: `[ERROR] Redundant Invoice ID Registry Pattern: Invoice number (${activeDoc.documentNumber}) matches an existing transaction log in your active business ledger database.`,
      fixMessage: `[FIX] Increment your invoice serial code sequence (e.g., from ${activeDoc.documentNumber} to ${activeDoc.documentNumber}-B) to maintain a unique sequential audit trail.`,
      legalExplanation: "Why this matters legally: Attempting to process duplicate invoice serials is a major internal control failure. It causes duplicate vendor payments and triggers red flags on double-billing under accounting audits.",
      severity: isDupOk ? "passed" : "warning"
    };

    // 6. GAAP Forensics
    const mentionsAdvance = /deposit|advance|prepayment|retainer/i.test(activeDoc.notes || "") || /deposit|advance|prepayment|retainer/i.test(activeDoc.terms || "");
    const specifiesAccrualMilestones = /milestone|accrual|escrow|deferred|delivery/i.test(activeDoc.notes || "") || /milestone|accrual|escrow|deferred|delivery/i.test(activeDoc.terms || "");
    const isGaapOk = !(mentionsAdvance && !specifiesAccrualMilestones);
    const gaapCheck = {
      key: "gaap_forensics",
      label: "GAAP Revenue Recognition Forensics",
      status: isGaapOk,
      desc: "Scanning advance invoicing retainers rules and matching deferral timelines.",
      errorMessage: "[ERROR] Revenue Recognition Mismatch: Invoice notes claim advance deposit/prepayment or retainer without specifying performance milestones or deferred revenue accruals.",
      fixMessage: "[FIX] Append a timing clause to notes (e.g. \"Revenue recognized over time as performance milestones are finalized\") to satisfy deferral guidelines.",
      legalExplanation: "Why this matters legally: Under IFRS 15 / ASC 606 (Revenue from Contracts with Customers), companies cannot recognize cash inflows instantly before performance obligations are fully met. Unstructured retainers look like hidden pre-billing schedules to IRS inspectors.",
      severity: isGaapOk ? "passed" : "warning"
    };

    // 7. Contract Forensics
    const isCorporateClient = /corp|ltd|inc|pty|agency|group|solutions|technologies/i.test(activeDoc.clientCompany || "");
    const hasPoReference = !!(activeDoc.customFields?.some(f => /po|purchase\s*order/i.test(f.label)) || /po\s*#|purchase\s*order/i.test(activeDoc.notes || "") || /po\s*#|purchase\s*order/i.test(activeDoc.terms || ""));
    const isContractOk = !(isCorporateClient && !hasPoReference);
    const contractCheck = {
      key: "contract_forensics",
      label: "SLA & Contract Compliance Forensics",
      status: isContractOk,
      desc: "Validating major enterprise accounts and cross-docking PO procurement reference cards.",
      errorMessage: `[ERROR] Procurement Registry Invalidation: Invoice recipient represents a registered corporate enterprise (${activeDoc.clientCompany || "Unknown Corp"}) but no verified Purchase Order (PO) index has been filed.`,
      fixMessage: "[FIX] Add a client custom field labeled \"PO Number\" containing the official purchasing authorization index.",
      legalExplanation: "Why this matters legally: Enterprise audit systems reject billing models lacking exact purchase order references. Failing to define a buyer-approved PO voids contract alignment, creating a collection dispute liability.",
      severity: isContractOk ? "passed" : "warning"
    };

    // 8. Legal Forensics
    const isSARand = activeDoc.currency === "R" || activeDoc.currency === "ZAR" || activeDoc.senderAddress?.toLowerCase().includes("south africa") || activeDoc.senderAddress?.toLowerCase().includes("za");
    const isHighSA = isSARand && activeInvoiceTotal > 3000;
    const hasTaxID = !!activeDoc.senderTaxId;
    const isLegalOk = !(isHighSA && !hasTaxID);
    const legalCheck = {
      key: "legal_forensics",
      label: "Statutory Regulatory Forensics",
      status: isLegalOk,
      desc: "Enforcing statutory legal declarations (such as SARS Section 20(4) rules or domestic IRS filings).",
      errorMessage: `[ERROR] Statutory Tax Compliance Deficit: Invoice total (${activeDoc.currency || "R"}${activeInvoiceTotal.toFixed(2)}) is over R3,000 threshold but your VAT registration number is missing in sender records.`,
      fixMessage: "[FIX] Fill in a valid VAT number (e.g., VAT-45102948) in your Business profile or document tax registration field.",
      legalExplanation: "Why this matters legally: Section 20(4) of the South African Value Added Tax Act requires standard VAT registrations to appear clearly on any document over R3,000. Under SARS, noncompliance disqualifies the recipient from claiming input-tax deductions, nullifying document legitimacy.",
      severity: isLegalOk ? "passed" : "critical"
    };

    return [mathCheck, taxCheck, dateCheck, sigCheck, dupCheck, gaapCheck, contractCheck, legalCheck];
  }, [activeDoc, activeInvoiceTotal, savedHistory]);

  const auditItems = forensicChecks;

  const criticalItemsCount = auditItems.length;
  const criticalPassed = auditItems.filter(item => item.status).length;
  const rawScore = Math.round((criticalPassed / criticalItemsCount) * 100);

  // Letter grades
  let letterGrade = "F";
  let gradeColor = "text-rose-600";
  let gradeBg = "bg-rose-50";
  let gradeBorder = "border-rose-200";

  if (rawScore >= 95) {
    letterGrade = "A+";
    gradeColor = "text-indigo-600";
    gradeBg = "bg-indigo-50";
    gradeBorder = "border-indigo-150";
  } else if (rawScore >= 85) {
    letterGrade = "A";
    gradeColor = "text-emerald-650";
    gradeBg = "bg-emerald-50";
    gradeBorder = "border-emerald-200";
  } else if (rawScore >= 70) {
    letterGrade = "B";
    gradeColor = "text-amber-600";
    gradeBg = "bg-amber-50/70";
    gradeBorder = "border-amber-200";
  } else if (rawScore >= 50) {
    letterGrade = "C";
    gradeColor = "text-orange-600";
    gradeBg = "bg-orange-50/50";
    gradeBorder = "border-orange-200";
  }

  const handleStartScan = async () => {
    if (!canUseAudits) {
      onShowAlert("⚠️ Audit Blocked: Please select a subscription plan to unlock full auditing scans.");
      onOpenPaymentModal();
      return;
    }

    setIsScanning(true);
    setScanStage(0);
    setHasScanned(false);

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    // Progression of audit steps visually
    scanIntervalRef.current = setInterval(() => {
      setScanStage(prev => {
        if (prev < auditStages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    try {
      const res = await fetch("/api/ai/audit-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentData: activeDoc })
      });
      const data = await res.json();
      
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      if (data.error) {
        onShowAlert("❌ Audit Error: " + data.error);
        setIsScanning(false);
        return;
      }
      
      setAiAuditReport(data);
      setScanStage(auditStages.length - 1);
      setTimeout(() => {
        setIsScanning(false);
        setHasScanned(true);
        onShowAlert(`🎓 Audits complete! Comprehensive AI analysis verified.`);
      }, 500);

    } catch (e) {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      setIsScanning(false);
      onShowAlert("❌ Server error during document audit.");
    }
  };

  // File Upload Handler
  const handleFileUpload = (file: File) => {
    if (!canUseAudits) {
      onShowAlert("⚠️ Scan Blocked: Please select a subscription plan to unlock external invoice scanning.");
      onOpenPaymentModal();
      return;
    }

    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "text/plain"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|docx|xlsx|csv|txt)$/i)) {
      onShowAlert(`❌ Invalid File: "${file.name}" is not a supported document type (PDF, JPG, PNG, DOCX, XLSX, CSV, TXT).`);
      return;
    }

    setScannedFilename(file.name);
    setIsOcrParsing(true);
    setOcrStep(0);

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < ocrStages.length - 1) {
        setOcrStep(currentStep);
      }
    }, 1500);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      if (!base64) {
        clearInterval(interval);
        setIsOcrParsing(false);
        onShowAlert("❌ Failed to read file data.");
        return;
      }

      try {
        const res = await fetch("/api/ai/scan-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: base64,
            mimeType: file.type,
            filename: file.name
          })
        });

        const data = await res.json();
        clearInterval(interval);
        setIsOcrParsing(false);

        if (data.error) {
          onShowAlert("❌ Scan Error: " + data.error);
          return;
        }

        if (data.documentData) {
          setActiveDoc(prev => ({
            ...prev,
            ...data.documentData,
            notes: data.documentData.notes || `Extracted from uploaded doc structure: "${file.name}" via Audit This Doc AI's Forensic OCR Engine.`
          }));
          onShowAlert(`📝 OCR extraction complete! Transaction content loaded. You may review and correct before running final Audit.`);
          
          if (data.auditReport) {
            setAiAuditReport(data.auditReport);
          }
        } else {
          onShowAlert("❌ Could not extract document data.");
        }
      } catch (err) {
        clearInterval(interval);
        setIsOcrParsing(false);
        console.error(err);
        onShowAlert("❌ Server error during OCR scan.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Automated Quick Fix Helper
  const handleAutoFix = (type: string) => {
    setActiveDoc(prev => applyForensicFix(prev, type));
    onShowAlert("🎓 Forensic Fix Applied!");
  };

  const handleToggleReport = () => {
    setActiveDoc(prev => {
      const updated = { ...prev };
      updated.appendAuditReport = !updated.appendAuditReport;
      if (updated.appendAuditReport) {
        onShowAlert("👨‍🎓 Verified Independent Audit report page will append upon printed paper sheet!");
      } else {
        onShowAlert("❌ Appended audit statement paper page disabled.");
      }
      return updated;
    });
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-5 relative overflow-hidden select-none">
      
      {/* Visual background gradient accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/3 rounded-full filter blur-xl pointer-events-none"></div>
      
      {/* Inspector Title */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 leading-tight">Audit This Doc AI: Document Auditor</h3>
            <p className="text-[10px] text-zinc-500 font-bold leading-tight uppercase flex items-center gap-1 mt-0.5">
              <span>{getGreeting()}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            </p>
          </div>
        </div>
        
        {/* Visual indicators */}
        <div className="flex items-center gap-1.5">
          {!isUnlocked ? (
            <button
              onClick={onOpenPaymentModal}
              className="text-[9.5px] font-black text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer"
            >
              <Unlock className="w-2.5 h-2.5" />
              <span>Unlock Features</span>
            </button>
          ) : (
            <span className="text-[9.5px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
              👑 Unlimited Premium
            </span>
          )}
        </div>
      </div>

      {/* BEFORE SCAN LAYOUT OR IS SCANNING IN PROGRESS */}
      {!hasScanned && !isScanning && !isOcrParsing && (
        <div className="space-y-4">
          
          {/* Document Classification Selector */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest block font-mono">
                🛡️ Select Document Scope to Scan
              </span>
              <select 
                value={countryStandard}
                onChange={(e) => setCountryStandard(e.target.value)}
                className="text-[9px] font-bold text-zinc-600 bg-white border border-zinc-200 rounded-md px-2 py-0.5 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
              >
                <option value="SA Standard">SA Standard</option>
                <option value="US Standard">US Standard</option>
                <option value="UK Standard">UK Standard</option>
                <option value="EU Standard">EU Standard</option>
                <option value="AU Standard">AU Standard</option>
                <option value="Global Standard">Global Standard</option>
              </select>
            </div>
            
            {/* Primary Full Width Card */}
            <button
              type="button"
              onClick={() => {
                setDocTypeToScan("invoice");
                onShowAlert("📋 Switched scope to Invoice billing verification mode!");
              }}
              className={`w-full p-4 rounded-xl text-left border transition-all cursor-pointer flex items-start justify-between ${
                docTypeToScan === "invoice"
                  ? "bg-white text-indigo-950 border-indigo-505 ring-1 ring-indigo-500/20 font-bold shadow-2xs"
                  : "bg-white text-zinc-650 border-zinc-200/80 hover:bg-zinc-50 hover:border-zinc-350"
              }`}
            >
              <div className="space-y-1">
                <p className="text-xs sm:text-xs font-black leading-tight flex items-center gap-1.5 uppercase font-sans tracking-wide">
                  <span className={`w-2 h-2 rounded-full ${
                    docTypeToScan === "invoice" ? "bg-indigo-600 animate-pulse" : "bg-zinc-300"
                  }`}></span>
                  Check My Invoice
                </p>
                <p className="text-[10px] text-zinc-500 font-semibold font-sans">VAT/Tax, pricing, payment details</p>
              </div>
              <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-150 uppercase tracking-wide">{countryStandard}</span>
            </button>

            {/* "More audit types ▼" button */}
            <div className="flex justify-center pt-0.5">
              <button
                type="button"
                onClick={() => setShowMoreAuditTypes(!showMoreAuditTypes)}
                className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-600 hover:text-indigo-900 transition-colors flex items-center gap-1 px-3 py-1 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 shadow-3xs cursor-pointer"
              >
                <span>{showMoreAuditTypes ? "More audit types ▲" : "More audit types ▼"}</span>
              </button>
            </div>

            {/* Accordion / Hidden other options */}
            {showMoreAuditTypes && (
              <div className="grid grid-cols-2 gap-1.5 pt-1.5 animate-fadeIn">
                {[
                  { id: "ledger", label: "Check My Books", desc: "Balance sheet & credit/debit parity", spanClass: "" },
                  { id: "contract", label: "Check My Contracts", desc: "Indemnities & billing clauses", spanClass: "" },
                  { id: "tax", label: "Check My VAT", desc: "VAT returns & payment proofing", spanClass: "" },
                  { id: "legal_risk", label: "Contract + Signature Compliance", desc: "Checks missing signatures, wrong PO numbers, illegal terms, date mismatches that void contracts", spanClass: "col-span-2" }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setDocTypeToScan(type.id as any);
                      onShowAlert(`📋 Switched scope to ${type.label} mode!`);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${type.spanClass} ${
                      docTypeToScan === type.id
                        ? "bg-white text-indigo-950 border-indigo-400 font-bold shadow-xs flex flex-col justify-between"
                        : "bg-white text-zinc-650 border-zinc-200/80 hover:bg-zinc-50 hover:border-zinc-350 flex flex-col justify-between"
                    }`}
                  >
                    <p className="text-[10px] font-extrabold leading-tight flex items-center gap-1 uppercase tracking-wide">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        docTypeToScan === type.id ? "bg-indigo-600 animate-pulse" : "bg-zinc-300"
                      }`}></span>
                      {type.label}
                    </p>
                    <p className="text-[8.5px] text-zinc-600 mt-0.5 leading-snug font-sans">{type.desc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabs to select active module mode */}
          <div className="flex bg-zinc-100 p-1 rounded-2xl border border-zinc-200 shrink-0">
            <button
              type="button"
              onClick={() => setActiveAuditorMode("workspace")}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${activeAuditorMode === "workspace" ? "bg-white text-zinc-950 shadow-2xs border border-zinc-150" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              Audit Workspace Draft
            </button>
            <button
              type="button"
              onClick={() => setActiveAuditorMode("external")}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${activeAuditorMode === "external" ? "bg-white text-zinc-950 shadow-2xs border border-zinc-150" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              Upload PDF/Images
            </button>
          </div>

          {activeAuditorMode === "workspace" ? (
            <div className="space-y-4 py-3 text-center">
              <BookOpen className="w-10 h-10 text-indigo-200 mx-auto animate-bounce" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-800">Ready to Scan</h4>
                <p className="text-[10.5px] text-zinc-450 leading-relaxed max-w-xs mx-auto">
                  Audit This Doc AI will check VAT 15%, unit pricing + legal terms in 3 seconds
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartScan}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm hover:shadow active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Scan Document Now - Free</span>
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => {
                const fileInput = document.getElementById("external_ocr_file_input");
                fileInput?.click();
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                dragActive ? "border-violet-500 bg-violet-50/20" : "border-zinc-250 hover:border-zinc-350 bg-zinc-50/50"
              }`}
            >
              <input
                id="external_ocr_file_input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-9 h-9 text-zinc-350 mx-auto mb-2 animate-bounce" />
              <div className="space-y-1">
                <p className="text-xs font-black text-zinc-805">Drag & Drop Document (PDF or JPG/PNG Image) here</p>
                <p className="text-[10px] text-zinc-500 font-medium font-sans">Supports invoices, contracts, receipts, PDFs or JPG/PNG Images (Max 15MB)</p>
                <p className="text-[9px] bg-emerald-100/60 border border-emerald-150 text-[#00875A] rounded px-2 py-0.5 inline-block font-sans font-black tracking-wide mt-1 uppercase">
                  ⚡ Auto-extrapolate items & VAT compliance
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE OCR PARSING PROGRESS STATE */}
      {isOcrParsing && (
        <div className="space-y-4 py-4 text-center animate-pulse">
          <div className="relative w-12 h-12 flex items-center justify-center mx-auto">
            <span className="absolute animate-ping inline-flex h-10 w-10 rounded-full bg-indigo-400 opacity-40"></span>
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
          </div>
          <div className="space-y-2 max-w-xs mx-auto">
            <span className="text-[10px] uppercase font-mono font-black tracking-widest text-[#00875A] block">OCR Extraction Active</span>
            <p className="text-xs font-bold text-zinc-700 truncate font-mono italic">
              File: "{scannedFilename}"
            </p>
            <p className="text-[10.5px] font-sans font-extrabold text-zinc-550 leading-snug">
              {ocrStages[ocrStep]}
            </p>
            {/* Visual progress bar */}
            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${((ocrStep + 1) / ocrStages.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE SCANNING PANEL */}
      {isScanning && (
        <div className="space-y-4 py-4 animate-pulse">
          <div className="flex items-center justify-center">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <span className="absolute animate-ping inline-flex h-10 w-10 rounded-full bg-indigo-450 opacity-40"></span>
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
            </div>
          </div>
          <div className="space-y-2 text-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-650 block">Audit Matrix Run-through</span>
            <p className="text-xs font-bold text-zinc-700 font-mono italic">
              {auditStages[scanStage]}
            </p>
            {/* Progress line */}
            <div className="w-full bg-zinc-100 h-1.5 rounded-full max-w-xs mx-auto overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${((scanStage + 1) / auditStages.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED REPORT DETAILS SCREEN */}
      {hasScanned && (
        <div className="space-y-5 animate-fadeIn">
          
          {aiAuditReport ? (
            <div className="space-y-4">
              <div className={`border p-4 rounded-2xl flex items-center gap-4 ${aiAuditReport.overallAuditScore >= 85 ? 'bg-emerald-50 border-emerald-200' : aiAuditReport.overallAuditScore >= 70 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}>
                
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="26" strokeWidth="5" stroke="#e2e8f0" fill="transparent" />
                    <circle cx="32" cy="32" r="26" strokeWidth="5" 
                      stroke={aiAuditReport.overallAuditScore >= 85 ? "#10b981" : aiAuditReport.overallAuditScore >= 70 ? "#f59e0b" : "#ef4444"} 
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - (aiAuditReport.overallAuditScore || 0) / 100)}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                    <span className={`text-[9.5px] font-black font-mono transition-all ${aiAuditReport.overallAuditScore >= 85 ? 'text-emerald-700' : 'text-zinc-800'}`}>
                      {aiAuditReport.overallAuditScore}%
                    </span>
                    <span className="text-[7px] font-extrabold text-zinc-450 uppercase tracking-tighter mt-0.5">
                      SCORE
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <h4 className={`text-sm font-black font-serif ${aiAuditReport.overallAuditScore >= 85 ? 'text-emerald-700' : 'text-zinc-900'}`}>
                    Risk Level: {aiAuditReport.riskLevel}
                  </h4>
                  <p className="text-[10.5px] text-zinc-600 font-medium leading-tight">
                    {aiAuditReport.executiveSummary}
                  </p>
                </div>
              </div>

              {aiAuditReport.detectedIssues && aiAuditReport.detectedIssues.length > 0 && (
                <div className="p-4 rounded-2xl border bg-rose-50/50 border-rose-200 space-y-3 text-left">
                  <h4 className="text-[11px] font-black uppercase text-rose-900">Detected Issues ({aiAuditReport.detectedIssues.length})</h4>
                  <div className="space-y-2">
                    {aiAuditReport.detectedIssues.map((issue: any, idx: number) => (
                      <div key={idx} className="bg-white border border-rose-100 p-2.5 rounded-xl shadow-xs">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wide">{issue.field}</span>
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${issue.severity === 'Critical' ? 'bg-rose-600 text-white' : issue.severity === 'High' ? 'bg-orange-500 text-white' : 'bg-amber-300 text-amber-900'}`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-700 font-medium">{issue.description}</p>
                        <p className="text-[9.5px] text-indigo-700 font-semibold mt-1 flex gap-1">
                          <Sparkles className="w-3 h-3 inline" />
                          {issue.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiAuditReport.complianceFindings && aiAuditReport.complianceFindings.length > 0 && (
                <div className="p-4 rounded-2xl border bg-indigo-50/50 border-indigo-150 space-y-2 text-left">
                  <h4 className="text-[11px] font-black uppercase text-indigo-900">Compliance Findings</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {aiAuditReport.complianceFindings.map((finding: string, idx: number) => (
                      <li key={idx} className="text-[10px] text-indigo-800 font-medium">{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Circular SVG Meter & Overview Info Row */}
              <div className={`border p-4 rounded-2xl flex items-center gap-4 ${gradeBorder} ${gradeBg}`}>
                
                {/* Circular Gauge */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  strokeWidth="5"
                  stroke={rawScore >= 70 ? "#e2e8f0" : "#fee2e2"}
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  strokeWidth="5"
                  stroke={rawScore >= 85 ? "#10b981" : rawScore >= 70 ? "#4f46e5" : "#f59e0b"}
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - rawScore / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className={`text-[9.5px] font-black font-mono transition-all ${gradeColor}`}>
                  {rawScore}%
                </span>
                <span className="text-[7.5px] font-extrabold text-zinc-450 uppercase tracking-tighter mt-0.5">
                  GRADE
                </span>
              </div>
            </div>

            {/* Verdict Explanation text */}
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-1">
                <h4 className={`text-sm font-black font-serif ${gradeColor}`}>
                  Ledger Credential: {letterGrade}
                </h4>
                {rawScore >= 85 ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-650 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </div>
              <p className="text-[10.5px] text-zinc-500 font-medium leading-tight">
                {rawScore >= 95 ? (
                  "Pristinely audited document structure. Entirely qualified for financial submission and corporate claiming."
                ) : rawScore >= 70 ? (
                  "Minor administrative references omitted. Fully legal, but adding references will maximize deductibility."
                ) : (
                  "Fails crucial audit control factors! Settle VAT details and add digital sign-off tags prior to billing."
                )}
              </p>
            </div>
          </div>

          {/* Flagged issues detection */}
          {(() => {
            const flaggedIssues = auditItems.filter(item => !item.status);
            const flaggedCount = flaggedIssues.length;
            return (
              <div className={`p-5 rounded-2xl border space-y-4 text-left shadow-xs transition-all ${
                flaggedCount > 0 
                  ? "bg-rose-50/50 border-rose-200" 
                  : "bg-emerald-50/50 border-emerald-200"
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black font-mono text-xs shadow-xs border ${
                      flaggedCount > 0 
                        ? "bg-rose-100 text-rose-700 border-rose-200" 
                        : "bg-emerald-100 text-[#00875A] border-emerald-200"
                    }`}>
                      {flaggedCount}
                    </div>
                    <div>
                      <h4 className={`text-[11px] font-black uppercase tracking-wider font-sans leading-none ${
                        flaggedCount > 0 ? "text-rose-950" : "text-emerald-950"
                      }`}>
                        {flaggedCount > 0 ? "Audit Discrepancy Registry" : "Verified Compliance Seal"}
                      </h4>
                      <p className={`text-[9.5px] font-bold font-sans uppercase mt-1 leading-none ${
                        flaggedCount > 0 ? "text-rose-700" : "text-emerald-700"
                      }`}>
                        {flaggedCount > 0 ? "Non-Compliant Items Isolated" : "100% Tax Deductible & SARS Ready"}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[8.5px] font-black uppercase font-mono px-2 py-0.5 rounded-full border ${
                    flaggedCount > 0 
                      ? "bg-rose-100 text-rose-800 animate-pulse border-rose-250" 
                      : "bg-[#E6F4EA] text-[#137333] border-[#A3E2A5]"
                  }`}>
                    {flaggedCount === 0 ? "Compliance Approved" : `${flaggedCount} Critical Flags`}
                  </span>
                </div>

                {flaggedCount > 0 ? (
                  <div className="space-y-3.5">
                    <div className="space-y-2">
                      <p className="text-[10px] text-zinc-650 font-semibold leading-relaxed font-sans">
                        Our forensic scan has flagged <strong className="text-rose-700">{flaggedCount} structural anomalies</strong> which invalidate legal tax claims. Activate our automated AI fixes underneath:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {flaggedIssues.map((item) => (
                          <span 
                            key={item.key} 
                            className="text-[8.5px] font-black uppercase tracking-wide bg-white border border-rose-150 text-rose-700 px-2 py-0.7 rounded-lg shadow-3xs"
                          >
                            ⚠ {item.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Majestic Global One-Click Autofix button */}
                    <div className="bg-white/80 border border-indigo-150 rounded-xl p-3 text-center space-y-2 shadow-2xs">
                      <p className="text-[9.5px] text-indigo-950 font-bold leading-none uppercase tracking-wide flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>Audit This Doc AI Forensic Repair Engine</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDoc(prev => {
                            let updated = prev;

                            flaggedIssues.forEach(issue => {
                              updated = applyForensicFix(updated, issue.key);
                            });

                            return updated;
                          });

                          onShowAlert("✨ Awesome! One-Click Auto-Fix parsed & repaired all compliance mistakes instantly!");
                        }}
                        className="w-full flex items-center justify-center gap-2 text-xs font-black text-zinc-900 bg-indigo-650 hover:bg-indigo-750 rounded-xl py-3 transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99] uppercase tracking-wider font-sans"
                      >
                        <Wand2 className="w-4 h-4 text-yellow-300 animate-pulse" />
                        <span>One-Click Auto-Fix All Issues ({flaggedCount})</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] text-[#137333] font-bold leading-relaxed font-sans flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-650 shrink-0" />
                      <span>Perfect Score! This document is 100% compliant and legally safe to issue.</span>
                    </p>

                    {onDownloadPdf && (
                      <div className="bg-emerald-500/10 border border-emerald-250 rounded-xl p-3 text-center space-y-2">
                        <p className="text-[9.5px] text-[#137333] font-black uppercase tracking-wide">
                          📥 High-Fidelity Compliant PDF Available
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            onDownloadPdf();
                            onShowAlert("📥 Exporting your newly audited, 100% verified document PDF...");
                          }}
                          className="w-full flex items-center justify-center gap-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl py-2.5 transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99] uppercase tracking-wider font-sans"
                        >
                          <Download className="w-4 h-4 text-emerald-100" />
                          <span>Download Verified PDF Statement</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Staggered Audited checks list */}
          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {auditItems.map((item, idx) => {
              const isOk = item.status;
              const isExpanded = expandedCheckId === item.key;
              return (
                <div 
                  key={item.key} 
                  className={`p-3 rounded-2xl border flex flex-col gap-2 transition-all hover:border-zinc-400 cursor-pointer ${
                    isOk ? "bg-zinc-50/25 border-zinc-200" : "bg-rose-50/20 border-rose-200/80"
                  }`}
                  onClick={() => setExpandedCheckId(isExpanded ? null : item.key)}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {isOk ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-zinc-800 tracking-tight leading-none">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {!isOk ? (
                            <span className="text-[8px] uppercase tracking-wider font-black text-rose-700 bg-rose-100/60 border border-rose-200 px-1.5 py-0.5 rounded leading-none">
                              {item.severity === "critical" ? "Critical Deficit" : "Forensic Warning"}
                            </span>
                          ) : (
                            <span className="text-[8px] uppercase tracking-wider font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded leading-none">
                              Verified
                            </span>
                          )}
                          <span className="text-[9px] text-zinc-600 font-mono font-bold">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-normal font-sans pr-1.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* Expanded PhD-Level Forensic Explanations Details */}
                  {isExpanded && (
                    <div 
                      className="mt-1 pl-6.5 text-[10px] text-zinc-650 space-y-2 border-t border-dashed border-zinc-200/60 pt-2 animate-fadeIn"
                      onClick={(e) => e.stopPropagation()} // retain details interactions
                    >
                      {/* Monospaced audit outcomes */}
                      {!isOk ? (
                        <div className="font-mono text-[9px] bg-rose-50/80 border border-rose-200 rounded-xl p-2.5 text-rose-800 space-y-1.5 shadow-3xs">
                          <p className="font-bold leading-normal">{item.errorMessage}</p>
                          <p className="font-black text-indigo-700">{item.fixMessage}</p>
                        </div>
                      ) : (
                        <div className="font-mono text-[9px] bg-emerald-50/50 border border-emerald-150 rounded-xl p-2.5 text-emerald-800 shadow-3xs">
                          <p className="font-medium leading-normal">✓ Check passed: Transaction ledger conforms entirely to standard certified bookkeeping parameters.</p>
                        </div>
                      )}

                      {/* Theoretical Legal explanation cite */}
                      <div className="bg-zinc-100/85 border border-zinc-200 rounded-xl p-2.5 text-[9.5px] leading-relaxed text-zinc-600 font-sans space-y-1 shadow-3xs">
                        <span className="block font-black text-[8px] text-zinc-800 uppercase tracking-widest font-mono">
                          📚 PH.D FORENSIC AUDITING EXPOSITION:
                        </span>
                        <p>{item.legalExplanation}</p>
                      </div>

                      {/* Auto Fix Actions Trigger */}
                      {!isOk && (
                        <button
                          type="button"
                          onClick={() => {
                            handleAutoFix(item.key);
                            setExpandedCheckId(null);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 text-[9px] font-black text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl py-2 transition-all cursor-pointer uppercase tracking-wider font-sans"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>Run Audit This Doc AI Forensic Remediation (Autofix)</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </>
          )}

          {/* Toggle appending report page */}
          <div className="pt-3 border-t border-zinc-150 space-y-3.5">
            <button
              type="button"
              onClick={handleToggleReport}
              className={`w-full py-2.5 border rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-bold text-xs ${
                activeDoc.appendAuditReport 
                  ? "bg-indigo-650 hover:bg-indigo-750 text-zinc-900 border-indigo-700 shadow-sm" 
                  : "bg-white hover:bg-zinc-50 text-black border-zinc-200"
              }`}
            >
              {activeDoc.appendAuditReport ? (
                <ShieldCheck className="w-4 h-4 text-emerald-250 animate-pulse" />
              ) : (
                <Layers className="w-4 h-4 text-zinc-600" />
              )}
              <span className="uppercase tracking-wider text-[11px] font-black">
                {activeDoc.appendAuditReport ? "✓ Independent Audit Page Appended" : "Append External Audit Statement"}
              </span>
            </button>
            <p className="text-[10px] text-zinc-450 italic leading-snug text-center">
              Toggling appends an <strong>Independent Audit Report signed by Audit This Doc AI</strong> onto a separate printable block, perfect for official proof of GAAP verification.
            </p>
          </div>

          {/* Rerun Scan Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setHasScanned(false);
                setIsScanning(false);
              }}
              className="flex-1 text-[9.5px] uppercase font-black text-zinc-500 hover:text-zinc-800 bg-zinc-105 hover:bg-zinc-150 transition-colors py-2 rounded-xl text-center cursor-pointer tracking-wider"
            >
              Back to Modes
            </button>
            <button
              type="button"
              onClick={handleStartScan}
              className="flex-1 text-[9.5px] uppercase font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-colors py-2 rounded-xl text-center cursor-pointer tracking-wider"
            >
              Re-Scan Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
