const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /\\\$\{tr\.totalIncome\.toFixed\(2\)\}/g;
code = code.replace(regex, "${tr.totalIncome.toFixed(2)}");

const regex2 = /\\\$\{tr\.totalTax\.toFixed\(2\)\}/g;
code = code.replace(regex2, "${tr.totalTax.toFixed(2)}");

fs.writeFileSync('src/App.tsx', code);
console.log("Patched dollars");
