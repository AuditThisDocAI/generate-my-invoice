const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /const pdf = await generateStructuredPDF\(activeDoc, logoPreviewUrl, signaturePreviewUrl, totals\);/;
const replacement = `let signatureUrl: string | null = null;
      if (canvasRef.current && !isCanvasEmpty(canvasRef.current)) {
        signatureUrl = canvasRef.current.toDataURL("image/png");
      }
      const pdf = await generateStructuredPDF(activeDoc, logoPreviewUrl, signatureUrl, totals);`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched generatePDF");
} else {
  console.log("Could not find line to patch in App.tsx");
}
