import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 12;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

// Generate a secure random token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Create service client inline to avoid import issues
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Environment variables check:", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
    });
    throw new Error("Missing Supabase environment variables");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    console.log("Starting admin registration...");

    const supabase = getSupabaseClient();
    const { name, email, password } = await request.json();

    console.log("Registering admin with email:", email);

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: "Email and password are required",
        status: 400,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: "Invalid email format",
        status: 400,
      });
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        error: "Password must be at least 8 characters long",
        status: 400,
      });
    }

    // Check if admin with the same email already exists
    const { data: existingAdmin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        error: "An account with this email already exists",
        status: 400,
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate email verification token
    const emailVerificationToken = generateVerificationToken();
    const emailVerificationExpires = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    // Create new admin
    const { data: newAdmin, error: insertError } = await supabase
      .from("admins")
      .insert([
        {
          email: email.toLowerCase(),
          password_hash: passwordHash,
          name: name?.trim() || null,
          is_verified: false,
          email_verification_token: emailVerificationToken,
          email_verification_expires: emailVerificationExpires.toISOString(),
          failed_login_attempts: 0,
          is_locked: false,
        },
      ])
      .select("id, email, name, is_verified, created_at");

    if (insertError) {
      console.error("Error creating admin:", insertError);
      return NextResponse.json({
        success: false,
        error: `Failed to create admin account: ${insertError.message}`,
        details: insertError,
        status: 500,
      });
    }

    // TODO: Send verification email with token
    // await sendVerificationEmail(email, emailVerificationToken);

    return NextResponse.json({
      success: true,
      data: newAdmin,
      message:
        "Account created successfully. Please wait for admin verification.",
      status: 201,
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Registration error: ${errorMessage}`,
        status: 500,
      },
      { status: 500 },
    );
  }
}
