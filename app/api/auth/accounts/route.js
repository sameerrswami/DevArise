import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true, id: true }
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { accountId } = await req.json();

    // Prevent unlinking if it's the only way to log in (and no password exists)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: true }
    });

    if (user.accounts.length <= 1 && !user.password) {
      return NextResponse.json({ 
        message: "You cannot unlink your only login method. Please set a password first." 
      }, { status: 400 });
    }

    await prisma.account.delete({
      where: { id: accountId }
    });

    return NextResponse.json({ message: "Account unlinked" });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
