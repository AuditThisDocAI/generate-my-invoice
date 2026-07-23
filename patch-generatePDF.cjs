const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldPdfGenRegex = /const generatePDF = async \(\) => \{[\s\S]*?setPdfGenerating\(false\);\n\n      if \(autoClearSignature\) \{\n        clearSignature\(true\);\n      \}\n    \}\n  \};/;

const newPdfGen = `const generatePDF = async () => {
    const proceed = await confirmIncompleteLines();
    if (!proceed) {
      setEditorTab("items");
      return;
    }

    if (!isUnlocked) {
      handleShowAlert(
        "⚠️ Purchase required: Please select a payment option to print or save this document.",
      );
      setIsPaymentOpen(true);
      return;
    }

    setPdfGenerating(true);
    handleShowAlert("⏳ Generating structured high-fidelity PDF document...");

    try {
      const totals = calculateSavedDocTotals(activeDoc);
      const pdf = await generateStructuredPDF(activeDoc, logoPreviewUrl, signaturePreviewUrl, totals);
      
      const pdfOutput = pdf.output("arraybuffer");
      if (pdfOutput.byteLength < 100) {
         throw new Error("Generated PDF is blank or invalid");
      }
      
      const pdfBlob = new Blob([pdfOutput], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const docTypeSlug = (activeDoc.documentType || "document")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");
      const docNumSlug = (activeDoc.documentNumber || "draft")
        .replace(/[^a-zA-Z0-9-]/g, "-")
        .replace(/-+/g, "-");
      const filename = \`\${docTypeSlug}-\${docNumSlug}.pdf\`;
      
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);

      handleShowAlert(
        "🎉 PDF generated and downloaded successfully! Professionally formatted.",
      );
    } catch (err: any) {
      console.error("Detailed PDF generation failure log:", err);
      handleShowAlert(
        \`⚠️ PDF Engine Error: Failed to compile format (\${err.message || "Unknown error"}). Running automatic fallback to download as high-fidelity PNG picture instead...\`,
      );
      try {
        setTimeout(() => {
          generatePNG();
        }, 150);
      } catch (fallbackErr: any) {
        console.error("PNG Fallback error:", fallbackErr);
        handleShowAlert(
          \`❌ Fallback Error: Failed to save as PNG image asset. Details: \${fallbackErr.message}\`,
        );
      }
    } finally {
      setPdfGenerating(false);

      if (autoClearSignature) {
        clearSignature(true);
      }
    }
  };`;

if(code.match(oldPdfGenRegex)) {
  code = code.replace(oldPdfGenRegex, newPdfGen);
  fs.writeFileSync('src/App.tsx', code);
  console.log("generatePDF replaced successfully.");
} else {
  console.log("Could not find generatePDF to replace");
}
