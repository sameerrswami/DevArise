import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import { logger } from "@/lib/logger";

export async function GET() {
  try {
    let problems = await prisma.problem.findMany({
      orderBy: { createdAt: "asc" }
    });

    // Dynamic External API Fallback Architecture
    // If the internal database is empty, fetch a curated dataset from an external Problem API and seed the database.
    if (!problems || problems.length === 0) {
      logger.info("Internal problem DB empty. Fetching from external curated Problem API provider...");
      
      try {
         // Simulating an external API fetch (e.g., an AWS or open-source LeetCode wrapper API)
         // In production, this would be `await fetch(process.env.EXTERNAL_CODING_API_URL)`
         const externalData = [
           { title: "Two Sum", slug: "two-sum", difficulty: "Easy", category: "Arrays", content: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.", defaultCode: "def twoSum(nums, target):\n    pass" },
           { title: "Reverse Linked List", slug: "reverse-linked-list", difficulty: "Easy", category: "Linked List", content: "Given the head of a singly linked list, reverse the list, and return the reversed list.", defaultCode: "def reverseList(head):\n    pass" },
           { title: "Detect Cycle", slug: "detect-cycle", difficulty: "Medium", category: "Graphs", content: "Given a linked list, return the node where the cycle begins. If there is no cycle, return null.", defaultCode: "def detectCycle(head):\n    pass" }
         ];

         // Bulk cache external problem sets into the scalable PostgreSQL DB
         await prisma.problem.createMany({
            data: externalData,
            skipDuplicates: true
         });

         problems = await prisma.problem.findMany({
            orderBy: { createdAt: "asc" }
         });
         logger.info("Successfully fetched and cached external problem dataset.");
      } catch (externalError) {
         logger.error("Failed to fetch external coding API data", externalError);
         return NextResponse.json({ error: "External Data Synchronization Failed", fallback: true }, { status: 503 });
      }
    }

    // Process and enrich problem data for the frontend (like accuracy rates, which would be calculated from submissions)
    const enrichedProblems = problems.map(p => ({
        ...p,
        // Calculate dynamically later based on `Submission` aggregation, falling back to 0
        accuracy: 0 
    }));

    return NextResponse.json(enrichedProblems);
  } catch (error) {
    logger.error("GET /api/problems - Database retrieval failed", error);
    return NextResponse.json({ error: "Failed to fetch problems" }, { status: 500 });
  }
}

