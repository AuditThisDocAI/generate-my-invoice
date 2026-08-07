import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DocumentData, DocumentItem } from "../types";

const themeColors: Record<string, number[]> = {
  violet: [99, 102, 241],
  gold: [217, 119, 6],
  emerald: [16, 185, 129],
  sapphire: [59, 130, 246],
  rose: [244, 63, 94],
  charcoal: [31, 41, 55],
};

const BLACK = [0, 0, 0] as const;
const PAGE_MARGIN = 40;
const BOTTOM_MARGIN = 60;
const TABLE_MARGIN_TOP = 20;
const LINE_HEIGHT = 16;

const safeNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatCurrency = (value: number, symbol: string): string => {
  return `${symbol}${value.toFixed(2)}`;
};

const loadImageDataUrl = async (url: string | null): Promise<string | null> => {
  if (!url) return null;

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(null);
        return;
      }
      context.drawImage(image, 0, 0);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
};

const ensurePageSpace = (doc: jsPDF, currentY: number, requiredHeight: number): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + requiredHeight > pageHeight - BOTTOM_MARGIN) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return currentY;
};

const drawFooter = (doc: jsPDF, pageNumber: number, pageCount: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // subtle separator line
  doc.setDrawColor(220);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGIN, pageHeight - BOTTOM_MARGIN + 10, pageWidth - PAGE_MARGIN, pageHeight - BOTTOM_MARGIN + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - PAGE_MARGIN, pageHeight - BOTTOM_MARGIN + 24, {
    align: "right",
  });
};

const drawPageNumberFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawFooter(doc, page, pageCount);
  }
};

const lightenColor = (color: number[], factor = 0.85) => {
  return color.map((v) => Math.round(255 - (255 - v) * factor));
};

const renderHeader = (
  doc: jsPDF,
  docData: DocumentData,
  logoDataUrl: string | null,
  qrDataUrl: string | null,
  currentY: number,
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const title = (docData.customTypeName || docData.documentType || "INVOICE").toUpperCase();
  const accentColor = themeColors[docData.themeColor] || themeColors.violet;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...BLACK);
  doc.text(title, pageWidth - PAGE_MARGIN, currentY, { align: "right" });

  if (logoDataUrl) {
    const logoWidth = 120;
    const logoHeight = 45;
    doc.addImage(logoDataUrl, "PNG", PAGE_MARGIN, currentY - 12, logoWidth, logoHeight, undefined, "FAST");
  }

  if (qrDataUrl) {
    const qrSize = 72;
    doc.addImage(qrDataUrl, "PNG", pageWidth - PAGE_MARGIN - qrSize, currentY + 10, qrSize, qrSize, undefined, "FAST");
  }

  const infoY = currentY + 35;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BLACK);

  const metadata = [
    [`Document #`, docData.documentNumber || ""],
    [`Issue Date`, docData.issueDate || ""],
    [`Due Date`, docData.dueDate || ""],
    [`Status`, docData.status || ""],
  ].filter(([, value]) => value);

  metadata.forEach((item, index) => {
    doc.text(`${item[0]}: ${item[1]}`, pageWidth - PAGE_MARGIN, infoY + index * 12, {
      align: "right",
    });
  });

  const accentY = currentY + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  // ensure title on the left is black as requested
  doc.setTextColor(...BLACK);
  doc.text(title, PAGE_MARGIN, accentY);

  return infoY + metadata.length * 12 + 14;
};

const renderPartyBlocks = (doc: jsPDF, docData: DocumentData, currentY: number): number => {
  const leftX = PAGE_MARGIN;
  const rightX = doc.internal.pageSize.getWidth() / 2 + 10;
  const blockWidth = doc.internal.pageSize.getWidth() / 2 - PAGE_MARGIN - 10;

  const senderLines = [
    docData.senderCompany || docData.senderName,
    docData.senderName && docData.senderCompany && docData.senderName !== docData.senderCompany ? docData.senderName : undefined,
    docData.senderAddress,
    docData.senderEmail,
    docData.senderPhone,
    docData.senderTaxId ? `Tax ID: ${docData.senderTaxId}` : undefined,
  ].filter(Boolean) as string[];

  const clientLines = [
    docData.clientCompany || docData.clientName,
    docData.clientName && docData.clientCompany && docData.clientName !== docData.clientCompany ? docData.clientName : undefined,
    docData.clientAddress,
    docData.clientEmail,
    docData.clientPhone,
    docData.clientTaxId ? `Tax ID: ${docData.clientTaxId}` : undefined,
  ].filter(Boolean) as string[];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text("FROM", leftX, currentY);
  doc.text("BILL TO", rightX, currentY);

  currentY += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);

  // Render each side using full wrapped text to avoid overlapping lines
  const maxLines = Math.max(senderLines.length, clientLines.length);
  for (let i = 0; i < maxLines; i += 1) {
    const senderText = senderLines[i] ? doc.splitTextToSize(senderLines[i], blockWidth) : [];
    const clientText = clientLines[i] ? doc.splitTextToSize(clientLines[i], blockWidth) : [];

    // print all wrapped sender lines
    for (let s = 0; s < senderText.length; s += 1) {
      doc.text(senderText[s], leftX, currentY);
      currentY += 12;
    }

    // for client, we need to track its own Y without advancing sender's vertical position incorrectly
    const clientStartY = currentY - (senderText.length * 12);
    for (let c = 0; c < clientText.length; c += 1) {
      doc.text(clientText[c], rightX, clientStartY + c * 12);
    }

    // ensure a small gap after rendering this pair
    if (senderText.length === 0 && clientText.length === 0) {
      currentY += 12;
    }
  }

  return currentY + 10;
};

const renderItemsTable = (doc: jsPDF, docData: DocumentData, currentY: number): number => {
  const tableColumns = [
    { header: "Description", dataKey: "description" },
    { header: "Qty", dataKey: "qty" },
    { header: "Rate", dataKey: "rate" },
    { header: "Tax", dataKey: "tax" },
    { header: "Amount", dataKey: "amount" },
  ];

  const body = docData.items.map((item: DocumentItem) => {
    const descriptionLines = item.description ? `${item.name}\n${item.description}` : item.name;
    const amount = item.quantity * item.rate;
    return {
      description: descriptionLines,
      qty: item.quantity != null ? String(item.quantity) : "",
      rate: formatCurrency(item.rate, docData.currency),
      tax: item.taxPercent ? `${item.taxPercent}%` : "",
      amount: formatCurrency(amount, docData.currency),
    };
  });

  const headerFill = lightenColor(themeColors[docData.themeColor] || themeColors.violet, 0.9);

  autoTable(doc, {
    startY: currentY,
    head: [tableColumns.map((column) => column.header)],
    body: body.map((row) => [row.description, row.qty, row.rate, row.tax, row.amount]),
    theme: "grid",
    headStyles: {
      fillColor: headerFill,
      textColor: [...BLACK],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      textColor: [...BLACK],
      fontSize: 9,
      minCellHeight: 18,
    },
    styles: {
      halign: "left",
      valign: "middle",
      overflow: "linebreak",
      cellPadding: 6,
      lineColor: [230, 230, 230],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { cellWidth: 240 },
      1: { halign: "center", cellWidth: 45 },
      2: { halign: "right", cellWidth: 80 },
      3: { halign: "right", cellWidth: 55 },
      4: { halign: "right", cellWidth: 80 },
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    pageBreak: "auto",
    didDrawPage: () => {
      /* footer will be painted later */
    },
  });

  return (doc as any).lastAutoTable?.finalY ?? currentY;
};

const renderTotals = (doc: jsPDF, totals: any, currentY: number, currency: string): number => {
  const x = doc.internal.pageSize.getWidth() - PAGE_MARGIN;
  const items = [
    { label: "Subtotal", value: safeNumber(totals.subtotal ?? totals.subTotal ?? totals.subtotalAmount) },
    { label: "Tax", value: safeNumber(totals.tax ?? totals.taxTotal ?? totals.taxAmount) },
    { label: "Discount", value: safeNumber(totals.discount ?? totals.discountTotal ?? totals.discountAmount) },
    { label: "Shipping", value: safeNumber(totals.shipping ?? totals.shippingTotal ?? totals.shippingAmount) },
    { label: "Deposit", value: safeNumber(totals.deposit ?? totals.amountPaid ?? totals.depositAmount) },
    { label: "Balance Due", value: safeNumber(totals.balanceDue ?? totals.outstanding ?? totals.amountDue) },
    { label: "Total", value: safeNumber(totals.total ?? totals.grandTotal ?? totals.totalAmount) },
  ].filter((item) => item.value !== 0 || item.label === "Total");

  if (items.length === 0) {
    return currentY;
  }

  const rowHeight = 18;
  const blockHeight = items.length * rowHeight + 18;
  currentY = ensurePageSpace(doc, currentY, blockHeight + 20);

  const boxWidth = 220;
  const boxX = x - boxWidth;
  doc.setDrawColor(220);
  doc.setFillColor(255, 255, 255);
  doc.rect(boxX, currentY - 8, boxWidth, blockHeight, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);

  items.forEach((item, index) => {
    const y = currentY + index * rowHeight;
    doc.text(item.label, boxX + 8, y);
    doc.text(formatCurrency(item.value, currency), x - 8, y, { align: "right" });
  });

  return currentY + blockHeight + 10;
};

const renderBankDetails = (doc: jsPDF, docData: DocumentData, currentY: number): number => {
  const bankLines = [
    docData.bankName ? `Bank: ${docData.bankName}` : undefined,
    docData.bankAccountHolder ? `Account: ${docData.bankAccountHolder}` : undefined,
    docData.bankAccountNumber ? `Account No: ${docData.bankAccountNumber}` : undefined,
    docData.bankBranchCode ? `Branch: ${docData.bankBranchCode}` : undefined,
    docData.bankSwiftCode ? `SWIFT: ${docData.bankSwiftCode}` : undefined,
    docData.bankIban ? `IBAN: ${docData.bankIban}` : undefined,
  ].filter(Boolean) as string[];

  if (!bankLines.length) return currentY;

  currentY = ensurePageSpace(doc, currentY, bankLines.length * 12 + 30);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text("Bank Details", PAGE_MARGIN, currentY);
  currentY += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);

  bankLines.forEach((line) => {
    doc.text(line, PAGE_MARGIN, currentY);
    currentY += 12;
  });

  return currentY + 8;
};

const renderBlockText = (doc: jsPDF, title: string, value: string, currentY: number): number => {
  if (!value) return currentY;

  const maxWidth = doc.internal.pageSize.getWidth() - PAGE_MARGIN * 2;
  const lines = doc.splitTextToSize(value, maxWidth);
  const blockHeight = lines.length * 12 + 26;
  currentY = ensurePageSpace(doc, currentY, blockHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(title, PAGE_MARGIN, currentY);
  currentY += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text(lines, PAGE_MARGIN, currentY);

  return currentY + lines.length * 12 + 14;
};

const renderSignature = async (doc: jsPDF, signatureUrl: string | null, currentY: number): Promise<number> => {
  const signatureHeight = 50;
  const requiredHeight = signatureUrl ? signatureHeight + 30 : 30;
  currentY = ensurePageSpace(doc, currentY, requiredHeight);

  if (signatureUrl) {
    const signatureDataUrl = await loadImageDataUrl(signatureUrl);
    if (signatureDataUrl) {
      const width = 140;
      const height = 50;
      doc.addImage(signatureDataUrl, "PNG", PAGE_MARGIN, currentY, width, height, undefined, "FAST");
      currentY += height + 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...BLACK);
      doc.text("Authorized Signature", PAGE_MARGIN, currentY);
      return currentY + 18;
    }
  }

  doc.setDrawColor(220);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGIN, currentY + 24, PAGE_MARGIN + 180, currentY + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text("Authorized Signature", PAGE_MARGIN, currentY + 38);
  return currentY + 48;
};

export const generateStructuredPDF = async (
  docData: DocumentData,
  logoUrl: string | null,
  signatureUrl: string | null,
  totals: any,
) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();

  const logoDataUrl = await loadImageDataUrl(logoUrl);
  const qrDataUrl = await loadImageDataUrl(docData.qrCodeDestinationUrl || null);

  let currentY = PAGE_MARGIN;
  currentY = renderHeader(doc, docData, logoDataUrl, qrDataUrl, currentY);
  currentY = renderPartyBlocks(doc, docData, currentY);
  currentY = renderTotals(doc, totals, currentY, docData.currency);
  currentY = renderBankDetails(doc, docData, currentY);

  currentY = ensurePageSpace(doc, currentY, TABLE_MARGIN_TOP);
  currentY += 4;
  currentY = renderItemsTable(doc, docData, currentY);

  currentY = await renderSignature(doc, signatureUrl, currentY + 16);
  currentY = renderBlockText(doc, "Notes", docData.notes, currentY + 10);
  currentY = renderBlockText(doc, "Terms & Conditions", docData.terms, currentY);

  drawPageNumberFooter(doc);

  return doc;
};
