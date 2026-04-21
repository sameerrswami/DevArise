import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const problems = [
  {
    title: "Two Sum",
    difficulty: "Easy",
    category: "Arrays",
    slug: "two-sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
    constraints: "- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9\n- -10^9 <= target <= 10^9",
    inputDesc: "An array of integers `nums` and an integer `target`.",
    outputDesc: "Index pair [i, j].",
    testCases: [
      { input: "[2,7,11,15], 9", output: "[0,1]" },
      { input: "[3,2,4], 6", output: "[1,2]" }
    ]
  },
  {
    title: "Reverse Linked List",
    difficulty: "Easy",
    category: "Linked Lists",
    slug: "reverse-linked-list",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    constraints: "The number of nodes in the list is the range [0, 5000].\nNode values are between [-5000, 5000].",
    testCases: [
      { input: "[1,2,3,4,5]", output: "[5,4,3,2,1]" }
    ]
  },
  {
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: "Sliding Window",
    slug: "longest-substring",
    description: "Given a string `s`, find the length of the longest substring without repeating characters.",
    constraints: "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.",
    testCases: [
      { input: "abcabcbb", output: "3" },
      { input: "bbbbb", output: "1" }
    ]
  }
];

async function main() {
  console.log("Seeding problems...");
  for (const p of problems) {
    await prisma.problem.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
