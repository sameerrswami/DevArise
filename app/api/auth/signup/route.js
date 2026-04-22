import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password } = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ error: "User already exists" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return new NextResponse(
      JSON.stringify({ message: "User created successfully", user: userWithoutPassword }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid input", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Signup error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
