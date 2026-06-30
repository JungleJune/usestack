import { NextResponse } from "next/server";
import {
  boundedString,
  escapeHtml,
  isValidEmail,
  normalizeEmail,
} from "@/lib/security.mjs";
import { getMailer, getMailDefaults } from "@/lib/server/mailer";
import {
  checkRateLimit,
  rateLimitResponse,
} from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request) {
  const rateLimit = checkRateLimit(request, {
    namespace: "tool-report",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  try {
    const body = await request.json();
    const name = boundedString(body.name, 100, { required: true });
    const email = normalizeEmail(body.email);
    const message = boundedString(body.message, 3000, { required: true });
    const toolName = boundedString(body.toolName, 120) || "Unknown tool";

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    const defaults = getMailDefaults();
    const info = await getMailer().sendMail({
      from: defaults.from,
      to: defaults.reportTo,
      replyTo: email,
      subject: `Tool report: ${toolName.replace(/[\r\n]/g, " ")}`,
      html: `
        <main style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
          <h1>Tool report</h1>
          <p><strong>Reporter:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Tool:</strong> ${escapeHtml(toolName)}</p>
          <p><strong>Report:</strong></p>
          <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
        </main>
      `,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to send report email" },
      { status: 500 }
    );
  }
}
