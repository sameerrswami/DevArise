/**
 * Seed script to populate the database with sample contest data
 * Run with: node scripts/seed-contests.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting contest system seed...');

  // Create sample problems
  const problems = await Promise.all([
    prisma.problem.upsert({
      where: { slug: 'two-sum' },
      update: {},
      create: {
        slug: 'two-sum',
        title: 'Two Sum',
        description: '<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p><p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>',
        difficulty: 'Easy',
        category: 'Arrays',
        constraints: '<ul><li>2 <= nums.length <= 10^4</li><li>-10^9 <= nums[i] <= 10^9</li><li>-10^9 <= target <= 10^9</li></ul>',
        testCases: [
          { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
          { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
        ]
      }
    }),
    prisma.problem.upsert({
      where: { slug: 'linked-list-cycle' },
      update: {},
      create: {
        slug: 'linked-list-cycle',
        title: 'Linked List Cycle',
        description: '<p>Given <code>head</code>, the head of a linked list, determine if the linked list has a cycle in it.</p><p>Return <code>true</code> if there is a cycle in the linked list. Otherwise, return <code>false</code>.</p>',
        difficulty: 'Medium',
        category: 'Linked List',
        constraints: '<ul><li>The number of nodes in the list is in the range [0, 10^4]</li><li>-10^5 <= Node.val <= 10^5</li></ul>',
        testCases: [
          { input: 'head = [3,2,0,-4], pos = 1', output: 'true' },
          { input: 'head = [1,2], pos = 0', output: 'true' }
        ]
      }
    }),
    prisma.problem.upsert({
      where: { slug: 'merge-k-sorted-lists' },
      update: {},
      create: {
        slug: 'merge-k-sorted-lists',
        title: 'Merge K Sorted Lists',
        description: '<p>You are given an array of <code>k</code> linked lists <code>lists</code>, each linked list is sorted in ascending order.</p><p>Merge all the linked lists into one sorted linked list and return it.</p>',
        difficulty: 'Hard',
        category: 'Linked List',
        constraints: '<ul><li>k == lists.length</li><li>0 <= k <= 10^4</li><li>0 <= lists[i].length <= 500</li></ul>',
        testCases: [
          { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' },
          { input: 'lists = []', output: '[]' }
        ]
      }
    }),
    prisma.problem.upsert({
      where: { slug: 'binary-tree-maximum-path-sum' },
      update: {},
      create: {
        slug: 'binary-tree-maximum-path-sum',
        title: 'Binary Tree Maximum Path Sum',
        description: '<p>A <strong>path</strong> in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence <strong>at most once</strong>.</p><p>The <strong>path sum</strong> of a path is the sum of the node\'s values in the path.</p><p>Given the <code>root</code> of a binary tree, return the maximum <strong>path sum</strong> of any <strong>non-empty</strong> path.</p>',
        difficulty: 'Hard',
        category: 'Trees',
        constraints: '<ul><li>The number of nodes in the tree is in the range [1, 3 * 10^4]</li><li>-1000 <= Node.val <= 1000</li></ul>',
        testCases: [
          { input: 'root = [1,2,3]', output: '6' },
          { input: 'root = [-10,9,20,null,null,15,7]', output: '42' }
        ]
      }
    }),
    prisma.problem.upsert({
      where: { slug: 'valid-parentheses' },
      update: {},
      create: {
        slug: 'valid-parentheses',
        title: 'Valid Parentheses',
        description: '<p>Given a string <code>s</code> containing just the characters <code>(</code>, <code>)</code>, <code>{</code>, <code>}</code>, <code>[</code> and <code>]</code>, determine if the input string is valid.</p><p>An input string is valid if:</p><ol><li>Open brackets must be closed by the same type of brackets.</li><li>Open brackets must be closed in the correct order.</li></ol>',
        difficulty: 'Easy',
        category: 'Stack',
        constraints: '<ul><li>1 <= s.length <= 10^4</li><li>s consists of parentheses only</li></ul>',
        testCases: [
          { input: 's = "()"', output: 'true' },
          { input: 's = "()[]{}"', output: 'true' },
          { input: 's = "(]"', output: 'false' }
        ]
      }
    })
  ]);

  console.log(`✅ Created ${problems.length} problems`);

  // Create sample contests
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const contests = await Promise.all([
    prisma.contest.create({
      data: {
        title: 'Weekly DSA Challenge #1',
        description: 'Test your Data Structures and Algorithms skills with this weekly challenge featuring problems on arrays, linked lists, and trees.',
        startsAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        endsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        duration: 180,
        status: 'active',
        type: 'rated',
        visibility: 'public',
        problems: {
          create: [
            { problemId: problems[0].id, points: 100, order: 0 },
            { problemId: problems[1].id, points: 200, order: 1 },
            { problemId: problems[2].id, points: 300, order: 2 }
          ]
        }
      }
    }),
    prisma.contest.create({
      data: {
        title: 'Bi-Weekly Contest #2',
        description: 'A challenging contest with problems ranging from easy to hard difficulty. Perfect for practicing placement test scenarios.',
        startsAt: tomorrow,
        endsAt: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000),
        duration: 180,
        status: 'upcoming',
        type: 'rated',
        visibility: 'public',
        problems: {
          create: [
            { problemId: problems[0].id, points: 100, order: 0 },
            { problemId: problems[4].id, points: 150, order: 1 },
            { problemId: problems[1].id, points: 250, order: 2 },
            { problemId: problems[3].id, points: 400, order: 3 }
          ]
        }
      }
    }),
    prisma.contest.create({
      data: {
        title: 'Practice Contest - Arrays',
        description: 'Focus on array-based problems to build your fundamentals.',
        startsAt: nextWeek,
        endsAt: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000),
        duration: 120,
        status: 'upcoming',
        type: 'practice',
        visibility: 'public',
        problems: {
          create: [
            { problemId: problems[0].id, points: 100, order: 0 },
            { problemId: problems[4].id, points: 100, order: 1 }
          ]
        }
      }
    })
  ]);

  console.log(`✅ Created ${contests.length} contests`);

  // Create sample achievements
  const achievements = await prisma.achievement.createMany({
    data: [
      { id: 'FIRST_CONTEST', name: 'First Steps', description: 'Participated in your first contest', type: 'contest', category: 'milestone', icon: '🎯', color: '#3B82F6', pointsValue: 50, requirements: { contestsParticipated: 1 } },
      { id: 'CONTEST_VETERAN', name: 'Contest Veteran', description: 'Participated in 10 contests', type: 'contest', category: 'milestone', icon: '🏅', color: '#8B5CF6', pointsValue: 200, requirements: { contestsParticipated: 10 } },
      { id: 'FIRST_WIN', name: 'Champion', description: 'Won your first contest', type: 'contest', category: 'performance', icon: '🏆', color: '#FBBF24', pointsValue: 300, requirements: { contestsWon: 1 } },
      { id: 'SPEED_DEMON', name: 'Speed Demon', description: 'Solved a problem in under 5 minutes', type: 'performance', category: 'speed', icon: '⚡', color: '#EF4444', pointsValue: 100, requirements: { fastestSolveTime: 300000 } },
      { id: 'WEEK_WARRIOR', name: 'Week Warrior', description: 'Maintained a 7-day streak', type: 'streak', category: 'consistency', icon: '🔥', color: '#EF4444', pointsValue: 100, requirements: { streak: 7 } },
      { id: 'RISING_STAR', name: 'Rising Star', description: 'Reached 1400+ rating', type: 'performance', category: 'milestone', icon: '🌟', color: '#3B82F6', pointsValue: 200, requirements: { rating: 1400 } },
      { id: 'PROBLEM_SOLVER_10', name: 'Problem Solver', description: 'Solved 10 problems in contests', type: 'performance', category: 'problemSolving', icon: '🧩', color: '#3B82F6', pointsValue: 100, requirements: { totalProblemsSolved: 10 } }
    ],
    skipDuplicates: true
  });

  console.log(`✅ Created/Updated achievements`);

  console.log('🎉 Contest system seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Problems: ${problems.length}`);
  console.log(`   - Contests: ${contests.length}`);
  console.log(`   - Achievements: 7`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });