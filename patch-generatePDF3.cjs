const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /let signatureUrl: string \| null = null;\s*if \(canvasRef.current && !isCanvasEmpty\(canvasRef.current\)\) \{\s*signatureUrl = canvasRef.current.toDataURL\("image\/png"\);\s*\}\s*const pdf = await generateStructuredPDF\(activeDoc, logoPreviewUrl, signatureUrl, totals\);/;
const replacement = `const signatureUrl = activeDoc.signatureData || null;
      const pdf = await generateStructuredPDF(activeDoc, logoPreviewUrl, signatureUrl, totals);`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched generatePDF");
} else {
  console.log("Could not find line to patch in App.tsx");
}
