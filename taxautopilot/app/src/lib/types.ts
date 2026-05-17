export type DocumentType =
  | "W-2"
  | "1099-NEC"
  | "1099-MISC"
  | "1099-INT"
  | "1099-DIV"
  | "1099-R"
  | "1099-G"
  | "1098"
  | "1098-E"
  | "1098-T"
  | "K-1"
  | "SSA-1099"
  | "OTHER";

export type ExtractedBox = {
  label: string;
  value: number | string | null;
};

export type Party = {
  name: string | null;
  ein_or_ssn: string | null;
  address: string | null;
};

export type ExtractedDocument = {
  document_type: DocumentType;
  tax_year: string | null;
  payer: Party;
  recipient: Party;
  boxes: Record<string, ExtractedBox>;
  confidence: "high" | "medium" | "low";
  warnings: string[];
};

export type ExtractionResponse =
  | { ok: true; data: ExtractedDocument; elapsed_ms: number; tokens: { input: number; output: number } }
  | { ok: false; error: string };
