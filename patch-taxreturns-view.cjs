const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /<button\s+onClick=\{\(\) => \{\s+const year = prompt\("Enter Tax Year.*?\s+className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors"\s*>\s*\+ Log Return\s*<\/button>/s;

const newButton = `<button
                              onClick={() => setShowTaxReturnForm(true)}
                              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors"
                            >
                              + Log Return
                            </button>`;

if (regex.test(code)) {
  code = code.replace(regex, newButton);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched tax returns button");
} else {
  console.log("Failed to find tax returns button");
}
