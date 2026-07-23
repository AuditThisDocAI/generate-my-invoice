const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(/Audit This Doc AI/g, 'Aria');
fs.writeFileSync('server.ts', content);

console.log("Done");
