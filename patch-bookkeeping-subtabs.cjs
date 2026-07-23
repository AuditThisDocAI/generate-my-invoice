const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  'const [bookkeepingSubtab, setBookkeepingSubtab] = useState<\n    "dashboard" | "analytics" | "exchange_rates"\n  >("dashboard");',
  'const [bookkeepingSubtab, setBookkeepingSubtab] = useState<\n    "dashboard" | "analytics" | "exchange_rates" | "tax_returns"\n  >("dashboard");'
);

fs.writeFileSync('src/App.tsx', code);
