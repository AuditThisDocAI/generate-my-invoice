import fs from 'fs';

function processFile(path) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/bg-zinc-950/g, 'bg-white');
  code = code.replace(/bg-zinc-900/g, 'bg-zinc-50');
  code = code.replace(/text-white/g, 'text-zinc-900');
  code = code.replace(/text-zinc-300/g, 'text-zinc-700'); 
  code = code.replace(/text-zinc-400/g, 'text-zinc-600');
  code = code.replace(/border-zinc-800/g, 'border-zinc-200');
  code = code.replace(/border-zinc-850/g, 'border-zinc-200');
  code = code.replace(/className="[^"]*bg-(?:indigo|emerald|violet|rose|blue|amber|red|green|purple)-(?:500|600|700)[^"]*"/g, (match) => {
    return match.replace(/text-zinc-900/g, 'text-white');
  });
  code = code.replace(/className="[^"]*bg-zinc-900[^"]*"/g, (match) => {
    return match.replace(/text-zinc-900/g, 'text-white');
  });
  fs.writeFileSync(path, code);
  console.log('Processed', path);
}

const dir = fs.readdirSync('src/components');
for (const file of dir) {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    processFile('src/components/' + file);
  }
}
