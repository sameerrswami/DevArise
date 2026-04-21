import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
    });

    if (!playlist) {
      return new Response(JSON.stringify({ error: "Playlist not found" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify(playlist), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("Failed to fetch playlist:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch playlist" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
