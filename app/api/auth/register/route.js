import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, academicStatus, targetRole, skillLevel } = body;

    // 1. Basic Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create User
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        academicStatus,
        targetRole,
        preparationLevel: skillLevel || "Beginner",
      },
    });

    // 5. Trigger Initial Roadmap Generation (Async)
    // We don't want to block registration, but we want it to start.
    // In a real app, this could be a background job.
    try {
      // Logic to trigger roadmap generation can be added here
      // For now, we'll just log it
      console.log(`[Registration] Triggering roadmap for ${user.email}`);
    } catch (roadmapError) {
      console.error("[Registration] Roadmap trigger failed:", roadmapError);
    }

    return NextResponse.json(
      { message: "User registered successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Registration API Error]:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
