const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const regex = /return \{ url: \\`\$\{params\.success_url\?\.split\('\?'\)\[0\]\}\?payment=success&invoice_id=\$\{invoiceId\}\\` \};/;
const replacement = "return { url: `${params.success_url?.split('?')[0]}?payment=success&invoice_id=${invoiceId}` };";

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched backticks");
} else {
  console.log("Could not find regex match");
}
