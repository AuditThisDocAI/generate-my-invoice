import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = code.split('\n');
// lines are 0-indexed.
// 11510 in 1-index is lines[11509]
// 12630 in 1-index is lines[12629]
// To remove 11509 to 12629 inclusive:
lines.splice(11509, 12629 - 11509 + 1);
fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Done!');
