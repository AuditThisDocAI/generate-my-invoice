import { GoogleGenAI, Type } from "@google/genai";

export interface ExtractDocumentParams {
  ai: GoogleGenAI | null;
  fileData: string;
  mimeType: string;
  filename: string;
  expectedType?: string;
}

export interface ExtractDocumentResult {
  documentData?: any;
  auditReport?: any;
  fieldConfidences?: any;
  error?: string;
}

export interface GenerateAuditParams {
  ai: GoogleGenAI | null;
  documentData: any;
}

function buildScanPrompt(filename: string) {
  return `You are an expert Forensic Auditor and Document Data Extractor.
The user has uploaded a scanned document or file named "${filename}".
1. Determine the document type automatically (invoice, receipt, bank statement, tax document, payroll report, financial statement, contract, or other).
2. Extract all relevant data: dates, amounts, sender/client details, line items, totals, signatures, and terms.
3. Validate the extracted data. Identify missing fields, duplicate invoices, inconsistent totals, tax discrepancies, unusual transactions, missing signatures, altered values, and compliance risks.
4. Calculate a confidence score for each field (from 0 to 100).
5. Generate a professional audit report with:
- Executive Summary
- Detected Issues
- Risk Level (Low, Medium, High, Critical)
- Compliance Findings
- AI Recommendations
- Suggested Corrections
- Overall Audit Score (0-100)

Return a strictly formatted JSON object matching the requested schema.`;
}

function buildScanResponseSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      documentData: {
        type: Type.OBJECT,
        description: "The extracted document structure, matching standard invoice/receipt fields",
        properties: {
          documentType: { type: Type.STRING },
          documentNumber: { type: Type.STRING },
          issueDate: { type: Type.STRING },
          dueDate: { type: Type.STRING },
          currency: { type: Type.STRING },
          senderName: { type: Type.STRING },
          senderCompany: { type: Type.STRING },
          senderEmail: { type: Type.STRING },
          senderPhone: { type: Type.STRING },
          senderAddress: { type: Type.STRING },
          senderTaxId: { type: Type.STRING },
          clientName: { type: Type.STRING },
          clientCompany: { type: Type.STRING },
          clientAddress: { type: Type.STRING },
          clientEmail: { type: Type.STRING },
          clientTaxId: { type: Type.STRING },
          notes: { type: Type.STRING },
          terms: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                rate: { type: Type.NUMBER },
                taxPercent: { type: Type.NUMBER },
                discountPercent: { type: Type.NUMBER }
              }
            }
          }
        }
      },
      auditReport: {
        type: Type.OBJECT,
        description: "The comprehensive audit findings",
        properties: {
          executiveSummary: { type: Type.STRING },
          riskLevel: { type: Type.STRING },
          overallAuditScore: { type: Type.NUMBER },
          detectedIssues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                field: { type: Type.STRING, description: "The field or area with the issue" },
                description: { type: Type.STRING },
                severity: { type: Type.STRING, description: "Low, Medium, High, Critical" },
                recommendation: { type: Type.STRING }
              }
            }
          },
          complianceFindings: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      },
      fieldConfidences: {
        type: Type.OBJECT,
        description: "Confidence scores (0-100) for extracted fields, keys are field names"
      }
    }
  };
}

function buildAuditPrompt(documentData: any) {
  return `You are an expert Forensic Auditor. Review this financial document data and provide a comprehensive audit report.
Identify missing fields, tax discrepancies, unusual transactions, missing signatures, altered values, and compliance risks.
Calculate an Overall Audit Score (0-100).

Document Data:
${JSON.stringify(documentData, null, 2)}

Return a strictly formatted JSON object matching the requested schema.`;
}

function buildAuditResponseSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      executiveSummary: { type: Type.STRING },
      riskLevel: { type: Type.STRING },
      overallAuditScore: { type: Type.NUMBER },
      detectedIssues: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            field: { type: Type.STRING },
            description: { type: Type.STRING },
            severity: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          }
        }
      },
      complianceFindings: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  };
}

function extractJsonFromText(text: string): string | null {
  const cleaned = text.trim().replace(/```json?|```/g, "");
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return jsonMatch ? jsonMatch[0] : null;
  }
}

function parseJsonText(text: string): any {
  const raw = text.trim();
  let candidate = raw;

  try {
    return JSON.parse(candidate);
  } catch {
    const extracted = extractJsonFromText(candidate);
    if (extracted) {
      try {
        return JSON.parse(extracted);
      } catch {
        return { error: "Failed to parse JSON from AI response." };
      }
    }
    return { error: "Failed to parse JSON from AI response." };
  }
}

export async function extractDocument(params: ExtractDocumentParams): Promise<ExtractDocumentResult> {
  const { ai, fileData, mimeType, filename } = params;
  if (!fileData) {
    return { error: "File data is required." };
  }

  if (!ai) {
    return { error: "AI services are not available. Please configure GEMINI_API_KEY." };
  }

  const prompt = buildScanPrompt(filename);
  const base64Data = fileData.replace(/^data:.*?;base64,/, "");

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType || "application/pdf",
          data: base64Data
        }
      }
    ],
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: buildScanResponseSchema()
    }
  });

  const outputText = response.text || "{}";
  const parsed = parseJsonText(outputText);
  return parsed;
}

export async function generateAudit(params: GenerateAuditParams): Promise<any> {
  const { ai, documentData } = params;
  if (!documentData) {
    throw new Error("Document data is required.");
  }

  if (!ai) {
    throw new Error("AI services are not available.");
  }

  const prompt = buildAuditPrompt(documentData);
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: buildAuditResponseSchema()
    }
  });

  const outputText = response.text || "{}";
  return parseJsonText(outputText);
}
