const fs = require('fs');
let code = fs.readFileSync('src/utils/pdfGenerator.ts', 'utf-8');

code = code.replace(/docData\.themeLayout === 'modern_wave' \|\| docData\.themeLayout === 'impact_solid'/g, 
  '(docData.themeLayout as any) === "modern_wave" || (docData.themeLayout as any) === "impact_solid"');

code = code.replace(/\(doc as any\)\.internal\.getNumberOfPages\(\)/g, '(doc as any).internal.getNumberOfPages()');

fs.writeFileSync('src/utils/pdfGenerator.ts', code);
