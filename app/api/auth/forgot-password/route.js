import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if user exists or not
      return NextResponse.json({ message: "Reset link sent if account exists" });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Store token in DB (you would need a PasswordReset model in your schema)
    // For now, we'll log it and return success
    console.log(`[ForgotPassword] Token generated for ${email}: ${token}`);
    
    // TODO: Send email using nodemailer or similar service
    // Example: sendResetEmail(email, token);

    return NextResponse.json({ message: "Reset link sent if account exists" });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
