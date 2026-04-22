import { NextResponse } from "next/server";
import { GeminiService } from "@/lib/services/gemini";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Fetch user profile and repos
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`)
    ]);

    if (!userRes.ok) {
      return NextResponse.json({ error: "GitHub user not found" }, { status: 404 });
    }

    const userData = await userRes.json();
    const reposData = await reposRes.json();

    const githubSummary = {
      bio: userData.bio,
      publicRepos: userData.public_repos,
      followers: userData.followers,
      topRepos: reposData.map(r => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        updatedAt: r.updated_at
      }))
    };

    const gemini = new GeminiService();
    const analysis = await gemini.analyzeGitHub(githubSummary);

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("GitHub Analysis API Error:", error);
    return NextResponse.json({ error: "Failed to analyze GitHub profile" }, { status: 500 });
  }
}
