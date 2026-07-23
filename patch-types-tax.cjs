const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

const regex = /export interface TaxReturnRecord \{\n  id: string;\n  year: number;\n  dateFiled: string;\n  status: "pending" \| "filed" \| "accepted" \| "rejected";\n  totalIncome: number;\n  totalTax: number;\n  notes: string;\n\}/g;

const replacement = `export interface TaxReturnRecord {
  id: string;
  year: number;
  dateFiled: string;
  status: "pending" | "filed" | "accepted" | "rejected";
  category: "Personal" | "Business" | "Capital Gains" | string;
  totalIncome: number;
  totalTax: number;
  notes: string;
}`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/types.ts', code);
  console.log("Patched types");
} else {
  console.log("Not found in types");
}
