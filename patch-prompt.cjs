const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const regex = /You are an expert financial consultant, professional resume writer, and master document generator\. Your job is to parse a user's natural language request describing an invoice, receipt, purchase order, quote, resume\/CV, or other document, and extract or infer all fields\. You MUST populate as much realistic data as possible\. If the user does not specify some elements, you must infer them intelligently\. Use standard business and professional defaults\./g;
const replacement = "You are an expert financial consultant, professional resume writer, and master document generator. Your job is to parse a user's natural language request describing a document and create EXACTLY what the user asks for. You MUST create the exact document type and fields the user requests. If the user provides a specific list of items, use ONLY those items; do not invent extras. If the user does not specify some elements, you may infer them intelligently using standard defaults, but always prioritize the exact data provided by the user.";

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched prompt");
} else {
  console.log("Not found");
}
