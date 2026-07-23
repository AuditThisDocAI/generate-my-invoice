const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /const isPremiumTier =[\s\S]*?userProfile\.paymentTier \|\| "",\n\s+\);\n/g;
const replacement = `const isPremiumTier =
                    userProfile &&
                    (["growth", "pro", "business", "unlimited"].includes(
                      userProfile.paymentTier || "",
                    ) || userProfile.email?.toLowerCase() === "brigittalombard09@gmail.com" || userProfile.email?.toLowerCase() === "info@seolab.co.za");\n`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched isPremiumTier");
