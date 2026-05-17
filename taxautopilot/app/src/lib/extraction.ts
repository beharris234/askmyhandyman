import { anthropic, EXTRACTION_MODEL } from "./anthropic";
import type { ExtractedDocument } from "./types";

const SYSTEM_PROMPT = `You are TaxAutopilot's document extraction engine. You look at images of US tax documents and return clean, structured JSON.

You handle: W-2, 1099-NEC, 1099-MISC, 1099-INT, 1099-DIV, 1099-R, 1099-G, 1098, 1098-E, 1098-T, K-1, SSA-1099, and other common tax forms.

Return ONLY valid JSON matching this exact shape — no markdown, no commentary, no \`\`\`json fences:

{
  "document_type": "W-2",
  "tax_year": "2024",
  "payer": { "name": "Employer name or null", "ein_or_ssn": "12-3456789 or null", "address": "Street, City, ST ZIP or null" },
  "recipient": { "name": "Employee name or null", "ein_or_ssn": "123-45-6789 or null", "address": "Street, City, ST ZIP or null" },
  "boxes": {
    "1": { "label": "Wages, tips, other compensation", "value": 52341.55 },
    "2": { "label": "Federal income tax withheld", "value": 6280.43 }
  },
  "confidence": "high",
  "warnings": []
}

RULES:
1. Return ONLY the JSON object. No \`\`\`json fences. No prose before or after.
2. Use raw numbers for monetary values (52341.55, not "$52,341.55"). Strip $ signs and commas.
3. Use strings for SSNs/EINs preserving dashes (e.g. "123-45-6789").
4. For "payer": on a W-2 this is the EMPLOYER. On a 1099 this is the PAYER. On 1098 this is the LENDER/SCHOOL.
5. For "recipient": on W-2 this is the EMPLOYEE. On 1099 this is the RECIPIENT. On 1098 this is the BORROWER/STUDENT.
6. Box keys should be the exact box numbers as printed on the form ("1", "2", "12a", "14", etc.) including any letter suffix.
7. If a field is blank on the form, omit that box entirely (don't include null entries).
8. If a field is partially illegible: still return your best read, set "confidence" to "medium" or "low", and add a warning describing exactly which field is unclear.
9. Confidence rubric — high: all key boxes legible. medium: one or two values blurry but readable. low: significant illegibility or unusual form.
10. If the image is NOT a tax document, return { "document_type": "OTHER", "tax_year": null, "payer": {...nulls}, "recipient": {...nulls}, "boxes": {}, "confidence": "low", "warnings": ["Image does not appear to be a US tax document."] }.
11. Tax year is the year FOR which the form was issued (the big year printed at the top), not the year it was generated.`;

export type ExtractionResult = {
  data: ExtractedDocument;
  elapsed_ms: number;
  input_tokens: number;
  output_tokens: number;
};

export async function extractDocument(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<ExtractionResult> {
  const started = Date.now();

  const message = await anthropic.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Extract this tax document. Return only the JSON object.",
          },
        ],
      },
    ],
  });

  const elapsed_ms = Date.now() - started;

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content.");
  }

  const raw = textBlock.text.trim();
  const jsonText = stripCodeFences(raw);

  let parsed: ExtractedDocument;
  try {
    parsed = JSON.parse(jsonText) as ExtractedDocument;
  } catch {
    throw new Error(
      `Claude returned non-JSON output. First 200 chars: ${raw.slice(0, 200)}`
    );
  }

  return {
    data: parsed,
    elapsed_ms,
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
  };
}

function stripCodeFences(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenceMatch ? fenceMatch[1].trim() : text;
}
