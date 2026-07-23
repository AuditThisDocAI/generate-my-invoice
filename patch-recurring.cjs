const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /const res = await fetch\("\/api\/recurring"\);\n\s+if \(res\.ok\) {\n\s+const data = await res\.json\(\);/g,
  `const res = await fetch("/api/recurring");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();`
);

code = code.replace(
  /setRecurringSchedules\(data\);\n\s+localStorage\.setItem\("gmi_fallback_recurring", JSON\.stringify\(data\)\);\n\s+}/g,
  `setRecurringSchedules(data);
          localStorage.setItem("gmi_fallback_recurring", JSON.stringify(data));
        }
      }`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched recurring");
