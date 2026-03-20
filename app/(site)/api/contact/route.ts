import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const body = await request.json();

    const { firstName, lastName, email, phone, message } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    // Insert contact message into database
    const { data, error } = await supabase
      .from("contact_messages")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phone || null,
        message: message,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("[Contact API] Error inserting message:", error);
      return NextResponse.json(
        { error: "Failed to submit your message. Please try again later." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been sent successfully!",
        data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Contact API] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}
