import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import {
  boundedString,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
} from "@/lib/security.mjs";
import {
  checkRateLimit,
  rateLimitResponse,
} from "@/lib/server/rate-limit";

export async function POST(request) {
  const rateLimit = checkRateLimit(request, {
    namespace: "register",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  try {
    const body = await request.json();
    const name = boundedString(body.name, 100, { required: true });
    const email = normalizeEmail(body.email);
    const password = body.password;

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "Password must be between 10 and 128 characters" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in the database
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role: "user",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to create account" },
      { status: 500 }
    );
  }
}
