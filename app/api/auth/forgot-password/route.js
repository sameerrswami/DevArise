import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if user exists or not
      return NextResponse.json({ message: "Reset link sent if account exists" });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store token hash in DB (never store plain token)
    await prisma.passwordReset.deleteMany({
      where: {
        email,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    await prisma.passwordReset.create({
      data: {
        email,
        tokenHash,
        expiresAt,
        userId: user.id
      }
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(email, token);
    } catch (emailError) {
      if (process.env.NODE_ENV === 'development') {
        console.error("[ForgotPassword] Email sending failed:", emailError);
      }
      // Don't expose email service errors to client for security
    }

    return NextResponse.json({ message: "Reset link sent if account exists" });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("[ForgotPassword] Error:", error);
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
