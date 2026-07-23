import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/bg-zinc-950/g, 'bg-white');
code = code.replace(/bg-zinc-900/g, 'bg-zinc-50');
code = code.replace(/text-white/g, 'text-zinc-900');
code = code.replace(/text-zinc-300/g, 'text-zinc-700'); 
code = code.replace(/text-zinc-400/g, 'text-zinc-600');
code = code.replace(/border-zinc-800/g, 'border-zinc-200');
code = code.replace(/border-zinc-850/g, 'border-zinc-200');

fs.writeFileSync('src/App.tsx', code);
console.log('Replaced successfully');
