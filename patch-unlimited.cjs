const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /const isUnlimitedPlan = \[\s*"unlimited",\s*"growth",\s*"pro",\s*"professional",\s*"business",\s*"enterprise",\s*\]\.includes\(userProfile\.paymentTier \|\| ""\);/g;
const replacement = `const isUnlimitedPlan = [
        "unlimited",
        "growth",
        "pro",
        "professional",
        "business",
        "enterprise",
      ].includes(userProfile.paymentTier || "") || userProfile.email?.toLowerCase() === "brigittalombard09@gmail.com" || userProfile.email?.toLowerCase() === "info@seolab.co.za";`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched isUnlimitedPlan");
