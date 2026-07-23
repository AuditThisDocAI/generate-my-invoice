const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /const \[taxReturns, setTaxReturns\] = useState<TaxReturnRecord\[\]>\(\(\) => \{/,
  `const [showTaxReturnForm, setShowTaxReturnForm] = useState(false);
  const [taxReturns, setTaxReturns] = useState<TaxReturnRecord[]>(() => {`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched taxReturns state");
