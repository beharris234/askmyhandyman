import { NextRequest } from "next/server";
import { extractDocument } from "@/lib/extraction";
import type { ExtractionResponse } from "@/lib/types";

const MAX_BYTES = 10 * 1024 * 1024;

const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return json({ ok: false, error: "No file uploaded. Use field name 'file'." }, 400);
    }

    if (file.size > MAX_BYTES) {
      return json({ ok: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 10 MB.` }, 413);
    }

    if (!SUPPORTED_TYPES.has(file.type)) {
      return json(
        { ok: false, error: `Unsupported file type: ${file.type}. Use JPEG, PNG, WebP, or GIF.` },
        415
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const result = await extractDocument(
      base64,
      file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif"
    );

    const response: ExtractionResponse = {
      ok: true,
      data: result.data,
      elapsed_ms: result.elapsed_ms,
      tokens: { input: result.input_tokens, output: result.output_tokens },
    };

    return json(response, 200);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown extraction error";
    console.error("[extract] failed:", error);
    return json({ ok: false, error }, 500);
  }
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
