const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /const hasPro =\n\s+plan === "professional" \|\|\n\s+plan === "business" \|\|\n\s+plan === "enterprise" \|\|\n\s+userProfile\?\.trialActive;/;

const replacement = `const hasPro =
      ["growth", "pro", "professional", "business", "enterprise", "unlimited", "starter"].includes(plan) ||
      userProfile?.email?.toLowerCase().trim() === "brigittalombard09@gmail.com" ||
      userProfile?.email?.toLowerCase().trim() === "info@seolab.co.za" ||
      userProfile?.trialActive;`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched handleTabChange");
} else {
  console.log("Regex not found");
}
