const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/const canvas = await html2canvas\(\s*element,\s*\{\s*backgroundColor: "#ffffff",\s*scale: 2,\s*\}\s*\);\s*const base64Image =\s*canvas\.toDataURL\("image\/png"\);/m, 
  "const base64Image = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 });");

fs.writeFileSync('src/App.tsx', code);
