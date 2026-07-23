const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /if \(userSnap\.exists\(\)\) \{\n\s+setUserProfile\(userSnap\.data\(\) as UserAccount\);\n\s+console\.log\(\n\s+"📡 Restored real Firebase session profile:",\n\s+firebaseUser\.email,\n\s+\);\n\s+\}/;

const replacement = `if (userSnap.exists()) {
                setUserProfile(userSnap.data() as UserAccount);
                console.log(
                  "📡 Restored real Firebase session profile:",
                  firebaseUser.email,
                );
              } else {
                const isSpecial =
                  firebaseUser.email?.toLowerCase().trim() === "info@seolab.co.za" ||
                  firebaseUser.email?.toLowerCase().trim() === "brigittalombard09@gmail.com";
                
                const newProfile: UserAccount = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || "guest@smartinvoice.com",
                  paymentTier: isSpecial ? "enterprise" : "free",
                  invoiceCredits: isSpecial ? 999999 : 3,
                  amountPaid: 0,
                  invoicesCount: 0,
                  createdAt: new Date().toISOString(),
                };
                
                try {
                  await setDoc(userRef, newProfile);
                } catch (e) {
                  console.warn("Could not lazily create missing user profile doc.", e);
                }
                
                setUserProfile(newProfile);
              }`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched onAuthStateChanged missing doc logic");
} else {
  console.log("Regex not found");
}
