import type { ActiveDoc } from "../types";

export function applyForensicFix(doc: ActiveDoc, type: string): ActiveDoc {
  const updated = { ...doc };

  switch (type) {
    case "math_forensics": {
      if (!updated.items || updated.items.length === 0) {
        updated.items = [{
          id: "item-" + Math.floor(100 + Math.random() * 900),
          name: "Audited Ledger Line Item",
          description: "Standard business delivery",
          quantity: 1,
          rate: 1000,
          taxPercent: 15,
          discountPercent: 0,
        }];
      } else {
        updated.items = updated.items.map(item => {
          const next = { ...item };
          if (next.quantity <= 0) next.quantity = 1;
          if (next.rate < 0) next.rate = Math.abs(next.rate) || 100;
          return next;
        });
      }
      break;
    }

    case "tax_forensics": {
      if (updated.items) {
        updated.items = updated.items.map(item => ({
          ...item,
          taxPercent: 0,
        }));
      }
      break;
    }

    case "date_forensics": {
      const issueDate = updated.issueDate || new Date().toISOString().split("T")[0];
      const thirtyDaysLater = new Date(new Date(issueDate).getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      updated.dueDate = thirtyDaysLater;
      break;
    }

    case "signature_forensics": {
      updated.signatureName = updated.senderName || "Authorized Master Auditing Officer";
      break;
    }

    case "duplicate_forensics": {
      if (updated.documentNumber) {
        updated.documentNumber = updated.documentNumber + "-B";
      } else {
        updated.documentNumber = "INV-2026-001-B";
      }
      break;
    }

    case "gaap_forensics": {
      const extraNote = "Billing Policy: Revenue recognized incrementally matching monthly accrual timelines as core operational SLA milestones are completed.";
      updated.notes = updated.notes ? updated.notes + "\n" + extraNote : extraNote;
      break;
    }

    case "contract_forensics": {
      if (!updated.customFields) updated.customFields = [];
      const poExists = updated.customFields.some(f => /po|purchase/i.test(f.label));
      if (!poExists) {
        updated.customFields.push({
          id: "po-" + Math.floor(100 + Math.random() * 900),
          label: "Purchase Order #",
          value: "PO-" + Math.floor(100000 + Math.random() * 900000),
        });
      }
      break;
    }

    case "legal_forensics": {
      updated.senderTaxId = "VAT-45102948";
      break;
    }

    default:
      break;
  }

  return updated;
}
