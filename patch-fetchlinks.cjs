const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /const data = await res\.json\(\);\n\s+setRecentPaymentLinks\(data\.links \|\| \[\]\);/g,
  `const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setRecentPaymentLinks(data.links || []);
          }`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched fetchLinks");
