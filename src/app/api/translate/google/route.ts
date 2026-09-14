import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface GoogleBody {
  text?: string;
  targetLanguage?: string;
  sourceLanguage?: string;
}

/**
 * Google Cloud Translation v2 (API key) proxy.
 * Credentials stay server-side. Phase 1: basic validation; add IP/day limits next.
 */
export async function POST(request: Request) {
  let body: GoogleBody;
  try {
    body = (await request.json()) as GoogleBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.text?.trim() ?? "";
  const target = body.targetLanguage?.trim();
  if (!text || !target) {
    return NextResponse.json(
      { error: "text and targetLanguage are required" },
      { status: 400 },
    );
  }

  if (text.length > 2000) {
    return NextResponse.json({ error: "Text exceeds 2000 characters" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Google Translate is not configured on the server (missing GOOGLE_TRANSLATE_API_KEY)",
      },
      { status: 503 },
    );
  }

  const params = new URLSearchParams({
    q: text,
    target,
    key: apiKey,
    format: "text",
  });
  if (body.sourceLanguage && body.sourceLanguage !== "auto") {
    params.set("source", body.sourceLanguage);
  }

  const googleRes = await fetch(
    `https://translation.googleapis.com/language/translate/v2?${params.toString()}`,
    { method: "POST" },
  );

  const payload = (await googleRes.json()) as {
    data?: {
      translations?: {
        translatedText?: string;
        detectedSourceLanguage?: string;
      }[];
    };
    error?: { message?: string };
  };

  if (!googleRes.ok) {
    return NextResponse.json(
      {
        error: payload.error?.message || "Google Translate request failed",
      },
      { status: googleRes.status === 429 ? 429 : 502 },
    );
  }

  const translation = payload.data?.translations?.[0];
  return NextResponse.json({
    text: translation?.translatedText ?? "",
    detectedSourceLanguage: translation?.detectedSourceLanguage,
  });
}
