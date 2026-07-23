const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const regex = /sessions: \{\n\s+create: async \(params\) => \{\n\s+const invoiceId = params\.success_url \? new URL\(params\.success_url\)\.searchParams\.get\('invoice_id'\) : 'mock';\n\s+return \{ url: `\$\{params\.success_url\?\.split\('\?'\)\[0\]\}\?payment=success&invoice_id=\$\{invoiceId\}` \};\n\s+\}\n\s+\}/;

const replacement = `sessions: {
             create: async (params) => {
               const invoiceId = params.success_url ? new URL(params.success_url).searchParams.get('invoice_id') : 'mock';
               return { url: \\\`\${params.success_url?.split('?')[0]}?payment=success&invoice_id=\${invoiceId}\\\` };
             },
             list: async () => ({ data: [] })
           }`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched getStripe mock");
} else {
  console.log("Could not find regex match");
}
