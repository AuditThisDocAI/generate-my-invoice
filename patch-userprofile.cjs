const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /const \[userProfile, setUserProfile\] = useState<UserAccount \| null>\(null\);/;
const replacement = `const [rawUserProfile, setRawUserProfile] = useState<UserAccount | null>(null);
  
  const userProfile = React.useMemo(() => {
    if (!rawUserProfile) return null;
    const e = rawUserProfile.email?.toLowerCase();
    if (e === "brigittalombard09@gmail.com" || e === "info@seolab.co.za") {
      return {
        ...rawUserProfile,
        paymentTier: "unlimited",
        invoiceCredits: 999999,
        aiCreditsRemaining: 999999
      };
    }
    return rawUserProfile;
  }, [rawUserProfile]);

  const setUserProfile = setRawUserProfile;`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched userProfile state");
} else {
  console.log("Regex not found");
}
