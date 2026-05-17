import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "[TaxAutopilot] ANTHROPIC_API_KEY is not set. Document extraction will fail. " +
      "Set it in .env.local — see .env.local.example."
  );
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const EXTRACTION_MODEL = "claude-sonnet-4-6";
