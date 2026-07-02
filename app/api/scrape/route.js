import { NextResponse } from "next/server";
import { parseToolData } from "@/lib/aiParser";
import { assertPublicHttpUrl } from "@/lib/security.mjs";
import {
  checkRateLimit,
  rateLimitResponse,
} from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request) {
  const rateLimit = checkRateLimit(request, {
    namespace: "scrape-tool",
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  try {
    const { url } = await request.json();
    const publicUrl = await assertPublicHttpUrl(url);
    const parsed = await parseToolData(publicUrl.toString());
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Scrape error:", error);
    const isValidationError =
      error instanceof SyntaxError ||
      /URL|network|hostname|port|HTTP/i.test(error?.message || "");
    return NextResponse.json(
      { error: isValidationError ? "A valid public URL is required" : "Scraping failed" },
      { status: isValidationError ? 400 : 502 }
    );
  }
}
