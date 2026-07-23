const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace imports
code = code.replace(/import html2canvas from "html2canvas";/g, 'import { toPng } from "html-to-image";\nimport { generateStructuredPDF } from "./utils/pdfGenerator";');

fs.writeFileSync('src/App.tsx', code);
