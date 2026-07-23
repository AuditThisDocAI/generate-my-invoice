const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldImageGenRegex = /const generateImage = async \(\) => \{[\s\S]*?setImageGenerating\(false\);\n\n      if \(autoClearSignature\) \{\n        clearSignature\(true\);\n      \}\n    \}\n  \};/;

const newImageGen = `const generateImage = async () => {
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

    if (!isInvoiceReady) {
      handleShowAlert(
        "⏳ Please wait, the stationary document is currently compiling...",
      );
      return;
    }

    let element: HTMLElement;
    try {
      element = await getInvoiceTemplateWithWait();
    } catch (err) {
      console.error(
        "PNG download aborted: Invoice template not resolving in DOM.",
      );
      return;
    }

    setImageGenerating(true);
    handleShowAlert(
      "⏳ Converting document template to premium high-resolution PNG image...",
    );

    try {
      // Validate element dimensions
      if (element.offsetWidth === 0 || element.offsetHeight === 0) {
        throw new Error("Element has 0 width or height");
      }
      
      const previousShadow = element.style.boxShadow;
      const previousBorderRadius = element.style.borderRadius;
      const previousBorder = element.style.border;

      // Adapt styling for crisp boundaries
      element.style.boxShadow = "none";
      element.style.borderRadius = "0px";
      element.style.border = "none";

      const dataUrl = await toPng(element, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2.5,
        filter: (node) => {
          if (node.classList && node.classList.contains('no-print')) return false;
          return true;
        }
      });
      
      element.style.boxShadow = previousShadow;
      element.style.borderRadius = previousBorderRadius;
      element.style.border = previousBorder;

      if (dataUrl === 'data:,') {
        throw new Error("Rendered image is blank/empty.");
      }

      const link = document.createElement("a");
      link.download = \`\${(activeDoc.documentType || "document").toLowerCase()}-\${(activeDoc.documentNumber || "draft").replace(/[^a-zA-Z0-9-]/g, "-")}.png\`;
      link.href = dataUrl;
      link.click();
      
      handleShowAlert(
        "🎉 PNG Image downloaded successfully! Saved as high-fidelity image file.",
      );
    } catch (err: any) {
      console.error("Detailed PNG engine failure log:", err);
      handleShowAlert(
        \`❌ PNG Engine Error: Failed to compile PNG layout correctly. Details: \${err.message || "Failure compiling DOM layout"}\`,
      );
    } finally {
      setImageGenerating(false);

      if (autoClearSignature) {
        clearSignature(true);
      }
    }
  };`;

if(code.match(oldImageGenRegex)) {
  code = code.replace(oldImageGenRegex, newImageGen);
  fs.writeFileSync('src/App.tsx', code);
  console.log("generateImage replaced successfully.");
} else {
  console.log("Could not find generateImage to replace");
}
