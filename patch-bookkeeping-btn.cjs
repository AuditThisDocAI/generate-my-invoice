const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /<button\s+onClick=\{\(\) => setBookkeepingSubtab\("exchange_rates"\)\}\s+className=\{`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm \$\{bookkeepingSubtab === "exchange_rates" \? "bg-white text-zinc-900 border border-zinc-200" : "bg-transparent text-zinc-500 hover:text-zinc-800"\}`\}\s+>\s+Exchange Rate Audit\s+<\/button>/;

const replacement = `<button
                          onClick={() => setBookkeepingSubtab("exchange_rates")}
                          className={\`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm \${bookkeepingSubtab === "exchange_rates" ? "bg-white text-zinc-900 border border-zinc-200" : "bg-transparent text-zinc-500 hover:text-zinc-800"}\`}
                        >
                          Exchange Rate Audit
                        </button>
                        <button
                          onClick={() => setBookkeepingSubtab("tax_returns")}
                          className={\`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm \${bookkeepingSubtab === "tax_returns" ? "bg-white text-zinc-900 border border-zinc-200" : "bg-transparent text-zinc-500 hover:text-zinc-800"}\`}
                        >
                          Tax Returns
                        </button>`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched");
} else {
  console.log("Not found");
}
