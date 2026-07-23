const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf-8');

const regex = /&& data\.paymentTier in \[\'free\', \'unlimited\', \'bundle\', \'payg\'\];/g;
const replacement = "&& data.paymentTier in ['free', 'starter', 'professional', 'business', 'enterprise', 'growth', 'pro', 'unlimited', 'bundle', 'payg'];";

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('firestore.rules', code);
  console.log("Patched firestore rules");
} else {
  console.log("Regex not found");
}
