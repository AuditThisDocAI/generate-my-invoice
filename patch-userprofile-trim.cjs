const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex1 = /const e = rawUserProfile\.email\?\.toLowerCase\(\);/g;
const replacement1 = 'const e = rawUserProfile.email?.toLowerCase().trim();';

code = code.replace(regex1, replacement1);

const regex2 = /userProfile\.email\.toLowerCase\(\) === "brigittalombard09@gmail\.com"/g;
const replacement2 = '(userProfile.email?.toLowerCase().trim() === "brigittalombard09@gmail.com")';

code = code.replace(regex2, replacement2);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched user profile trims");
