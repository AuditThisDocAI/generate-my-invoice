const fs = require('fs');
let code = fs.readFileSync('src/components/ReminderAssistant.tsx', 'utf-8');

code = code.replace(
  /const resp = await fetch\("\/api\/reminders"\);\n\s+if \(resp\.ok\) {\n\s+const data = await resp\.json\(\);/g,
  `const resp = await fetch("/api/reminders");
      if (resp.ok) {
        const contentType = resp.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await resp.json();`
);

code = code.replace(
  /setReminders\(data\);\n\s+localStorage\.setItem\("gmi_fallback_reminders", JSON\.stringify\(data\)\);\n\s+}/g,
  `setReminders(data);
          localStorage.setItem("gmi_fallback_reminders", JSON.stringify(data));
        }
      }`
);

fs.writeFileSync('src/components/ReminderAssistant.tsx', code);
console.log("Patched ReminderAssistant");
