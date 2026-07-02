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
    namespace: "tool-notification",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  try {
    const body = await request.json();
    const toolName = boundedString(body.toolName, 120, { required: true });
    const providerName = boundedString(body.providerName, 120);
    const contactEmail = normalizeEmail(body.contactEmail);
    const description = boundedString(body.description, 3000, {
      required: true,
    });

    if (!isValidEmail(contactEmail)) {
      return NextResponse.json(
        { error: "A valid contact email is required" },
        { status: 400 }
      );
    }

    const defaults = getMailDefaults();
    const info = await getMailer().sendMail({
      from: defaults.from,
      to: defaults.notificationTo,
      replyTo: contactEmail,
      subject: `New AI tool submission: ${toolName.replace(/[\r\n]/g, " ")}`,
      html: `
        <main style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
          <h1>New AI tool submission</h1>
          <p><strong>Tool:</strong> ${escapeHtml(toolName)}</p>
          <p><strong>Provider:</strong> ${escapeHtml(providerName || "Not provided")}</p>
          <p><strong>Contact:</strong> ${escapeHtml(contactEmail)}</p>
          <p><strong>Description:</strong></p>
          <p style="white-space: pre-wrap;">${escapeHtml(description)}</p>
        </main>
      `,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to send notification email" },
      { status: 500 }
    );
  }
}
