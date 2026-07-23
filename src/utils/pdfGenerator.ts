import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DocumentData } from "../types";

const themeColors: Record<string, number[]> = {
  emerald: [16, 185, 129],
  blue: [59, 130, 246],
  indigo: [99, 102, 241],
  violet: [139, 92, 246],
  fuchsia: [217, 70, 239],
  rose: [244, 63, 94],
  amber: [245, 158, 11],
  slate: [100, 116, 139],
  zinc: [113, 113, 122],
  neutral: [115, 115, 115],
  stone: [120, 113, 108],
  orange: [249, 115, 22],
};

export const generateStructuredPDF = async (docData: DocumentData, logoUrl: string | null, signatureUrl: string | null, totals: any) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 40;

  const themeName = docData.themeColor || "violet";
  const primaryColor = themeColors[themeName] || [139, 92, 246];
  const textColor = [40, 40, 40];
  const grayColor = [110, 110, 110];

  // Header Background for some themes
  if ((docData.themeLayout as any) === "modern_wave" || (docData.themeLayout as any) === "impact_solid") {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 100, 'F');
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  }

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  const docTitle = (docData.customTypeName || docData.documentType || "INVOICE").toUpperCase();
  doc.text(docTitle, pageWidth - 40, 60, { align: 'right' });
  
  if (logoUrl) {
    try {
      doc.addImage(logoUrl, 'PNG', 40, 30, 120, 45, undefined, 'FAST');
    } catch (e) {
      console.warn("Failed to embed logo", e);
    }
  }

  currentY = 130;
  
  // Document Info
  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text(`Reference: ${docData.documentNumber || ""}`, pageWidth - 40, currentY, { align: 'right' });
  currentY += 15;
  doc.setFont("helvetica", "normal");
  doc.text(`Issue Date: ${docData.issueDate || ""}`, pageWidth - 40, currentY, { align: 'right' });
  currentY += 15;
  if (docData.dueDate) {
    doc.text(`Due Date: ${docData.dueDate || ""}`, pageWidth - 40, currentY, { align: 'right' });
  }

  currentY -= 30; // reset to align with left side

  // Parties
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("FROM:", 40, currentY);
  doc.text("TO:", 250, currentY);
  
  currentY += 15;
  doc.setFontSize(11);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(docData.senderCompany || docData.senderName || "", 40, currentY);
  doc.text(docData.clientCompany || docData.clientName || "", 250, currentY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  currentY += 15;
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  const senderLines = [
    docData.senderName !== docData.senderCompany ? docData.senderName : null,
    docData.senderAddress,
    docData.senderEmail,
    docData.senderPhone,
    docData.senderTaxId ? `Tax ID: ${docData.senderTaxId}` : null
  ].filter(Boolean);

  const clientLines = [
    docData.clientName !== docData.clientCompany ? docData.clientName : null,
    docData.clientAddress,
    docData.clientEmail,
    docData.clientPhone,
    docData.clientTaxId ? `Tax ID: ${docData.clientTaxId}` : null
  ].filter(Boolean);

  let i = 0;
  while (i < senderLines.length || i < clientLines.length) {
    if (senderLines[i]) doc.text(senderLines[i] as string, 40, currentY);
    if (clientLines[i]) doc.text(clientLines[i] as string, 250, currentY);
    currentY += 14;
    i++;
  }

  currentY += 30;

  // Table
  const tableCols = ["Description", "Qty", "Rate", "Tax", "Amount"];
  const tableRows = docData.items.map((item: any) => [
    item.name + (item.description ? `\n${item.description}` : ""),
    item.quantity.toString(),
    `${docData.currency || "$"}${item.rate.toFixed(2)}`,
    `${item.taxPercent || 0}%`,
    `${docData.currency || "$"}${(item.quantity * item.rate).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [tableCols],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: primaryColor as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 10, 
      cellPadding: 8,
      lineColor: [230, 230, 230],
      lineWidth: 0.5
    },
    columnStyles: {
      0: { cellWidth: 220 },
      1: { halign: 'center', cellWidth: 50 },
      2: { halign: 'right', cellWidth: 70 },
      3: { halign: 'right', cellWidth: 50 },
      4: { halign: 'right', cellWidth: 80 }
    },
    margin: { left: 40, right: 40 },
    didDrawPage: (data) => {
      // Add footer to each page
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${(doc.internal as any).getNumberOfPages()}`, pageWidth - 40, pageHeight - 20, { align: 'right' });
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Check page break
  if (currentY > pageHeight - 150) {
    doc.addPage();
    currentY = 40;
  }

  // Totals
  const totalsX = pageWidth - 40;
  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  doc.text(`Subtotal:`, totalsX - 90, currentY, { align: 'right' });
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`${docData.currency || "$"}${totals.subtotal.toFixed(2)}`, totalsX, currentY, { align: 'right' });
  currentY += 18;
  
  if (totals.taxTotal > 0) {
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`Tax:`, totalsX - 90, currentY, { align: 'right' });
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`${docData.currency || "$"}${totals.taxTotal.toFixed(2)}`, totalsX, currentY, { align: 'right' });
    currentY += 18;
  }
  
  if (totals.discountTotal > 0) {
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`Discount:`, totalsX - 90, currentY, { align: 'right' });
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`-${docData.currency || "$"}${totals.discountTotal.toFixed(2)}`, totalsX, currentY, { align: 'right' });
    currentY += 18;
  }

  currentY += 5;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Grand Total:`, totalsX - 90, currentY, { align: 'right' });
  doc.text(`${docData.currency || "$"}${totals.grandTotal.toFixed(2)}`, totalsX, currentY, { align: 'right' });
  
  currentY += 40;

  // Signature
  if (signatureUrl) {
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 40;
    }
    try {
      doc.addImage(signatureUrl, 'PNG', 40, currentY, 120, 40, undefined, 'FAST');
      currentY += 45;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text("Authorized Signature", 40, currentY);
    } catch(e) {}
  }

  currentY += 40;

  // Notes and Terms
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  if (docData.notes) {
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 40;
    }
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 40, currentY);
    currentY += 15;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(docData.notes, 40, currentY, { maxWidth: pageWidth - 80 });
    currentY += 40;
  }
  
  if (docData.terms) {
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 40;
    }
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions:", 40, currentY);
    currentY += 15;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(docData.terms, 40, currentY, { maxWidth: pageWidth - 80 });
  }

  return doc;
};
