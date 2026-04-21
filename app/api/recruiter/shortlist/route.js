import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["RECRUITER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { candidateId, status, notes } = await req.json();

    const result = await prisma.shortlist.upsert({
      where: {
        recruiterId_candidateId: {
          recruiterId: session.user.id,
          candidateId: candidateId
        }
      },
      update: {
        status: status || "saved",
        notes: notes
      },
      create: {
        recruiterId: session.user.id,
        candidateId: candidateId,
        status: status || "saved",
        notes: notes
      }
    });

    return NextResponse.json({ success: true, shortlist: result });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["RECRUITER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { shortlistId } = await req.json();

    await prisma.shortlist.delete({
      where: { id: shortlistId, recruiterId: session.user.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
