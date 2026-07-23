const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /userProfile\.email\.toLowerCase\(\) ===/g;
const replacement = 'userProfile.email?.toLowerCase().trim() ===';

code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched admin trim");
