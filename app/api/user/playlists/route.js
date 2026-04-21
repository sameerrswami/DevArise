import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    // In App Router Route Handlers, pass the request to getServerSession
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("[API] No session found for playlists request");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Fetch playlists - limit to 10 most recent
    const playlists = await prisma.playlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return new Response(JSON.stringify(playlists), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("Failed to fetch playlists:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch playlists" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
