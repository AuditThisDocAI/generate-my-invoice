const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /\/\/ html2canvas is already imported at the top[\s\S]*?const base64Image =[\s\S]*?canvas\.toDataURL\("image\/png"\);/m;

const newCode = `// Export chart
                                          const base64Image = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 });`;

if (code.match(regex)) {
  code = code.replace(regex, newCode);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Replaced");
} else {
  console.log("Not found");
}
