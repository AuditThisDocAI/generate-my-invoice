import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/className="[^"]*bg-(?:indigo|emerald|violet|rose|blue|amber|red|green|purple)-(?:500|600|700)[^"]*"/g, (match) => {
  return match.replace(/text-zinc-900/g, 'text-white');
});
code = code.replace(/className="[^"]*bg-zinc-900[^"]*"/g, (match) => {
  return match.replace(/text-zinc-900/g, 'text-white');
});

// Also, the overall button hover classes might need text-white on hover.

fs.writeFileSync('src/App.tsx', code);
console.log('Reverted text-zinc-900 back to text-white for dark colored buttons.');
