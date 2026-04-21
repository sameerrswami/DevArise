/**
 * Seed script for testing the Smart Revision & Productivity System
 * Run with: node scripts/seed-revision.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sample data for testing
const sampleTopics = [
  'Arrays',
  'Strings',
  'Linked Lists',
  'Trees',
  'Graphs',
  'Dynamic Programming',
  'Sorting',
  'Searching',
  'Hash Tables',
  'Recursion'
];

const sampleProblems = [
  { title: 'Two Sum', topic: 'Arrays', difficulty: 'easy' },
  { title: 'Reverse Linked List', topic: 'Linked Lists', difficulty: 'easy' },
  { title: 'Binary Search', topic: 'Searching', difficulty: 'easy' },
  { title: 'Valid Parentheses', topic: 'Stacks', difficulty: 'easy' },
  { title: 'Merge Intervals', topic: 'Arrays', difficulty: 'medium' },
  { title: 'Binary Tree Level Order Traversal', topic: 'Trees', difficulty: 'medium' },
  { title: 'Course Schedule', topic: 'Graphs', difficulty: 'medium' },
  { title: 'Longest Substring Without Repeating Characters', topic: 'Strings', difficulty: 'medium' },
  { title: 'Container With Most Water', topic: 'Arrays', difficulty: 'medium' },
  { title: 'Climbing Stairs', topic: 'Dynamic Programming', difficulty: 'easy' },
  { title: 'Coin Change', topic: 'Dynamic Programming', difficulty: 'medium' },
  { title: 'Product of Array Except Self', topic: 'Arrays', difficulty: 'medium' },
  { title: 'Maximum Subarray', topic: 'Arrays', difficulty: 'medium' },
  { title: 'Merge K Sorted Lists', topic: 'Linked Lists', difficulty: 'hard' },
  { title: 'Trapping Rain Water', topic: 'Arrays', difficulty: 'hard' },
  { title: 'Regular Expression Matching', topic: 'Dynamic Programming', difficulty: 'hard' },
  { title: 'Median of Two Sorted Arrays', topic: 'Arrays', difficulty: 'hard' },
  { title: 'LRU Cache', topic: 'Hash Tables', difficulty: 'hard' }
];

const sampleMCQs = [
  { title: 'What is the time complexity of binary search?', topic: 'Searching', difficulty: 'easy' },
  { title: 'Which data structure uses LIFO?', topic: 'Stacks', difficulty: 'easy' },
  { title: 'What is the space complexity of merge sort?', topic: 'Sorting', difficulty: 'medium' },
  { title: 'Which algorithm is used for shortest path?', topic: 'Graphs', difficulty: 'medium' },
  { title: 'What is the worst case of quicksort?', topic: 'Sorting', difficulty: 'medium' }
];

const sampleInterviewQuestions = [
  { title: 'Tell me about a challenging project', topic: 'Behavioral', difficulty: 'medium' },
  { title: 'Explain polymorphism', topic: 'OOP', difficulty: 'medium' },
  { title: 'What is the difference between process and thread?', topic: 'OS', difficulty: 'medium' },
  { title: 'How does garbage collection work?', topic: 'Memory Management', difficulty: 'hard' },
  { title: 'Describe your approach to debugging', topic: 'Problem Solving', difficulty: 'easy' }
];

async function seedRevisionSystem() {
  try {
    console.log('🌱 Starting revision system seed...');

    // Find or create a test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashedpassword123'
        }
      });
      console.log('✅ Created test user:', testUser.id);
    } else {
      console.log('✅ Using existing test user:', testUser.id);
    }

    const userId = testUser.id;

    // Create or update user preferences
    await prisma.userPreference.upsert({
      where: { userId },
      update: {
        dailyCodingProblems: 1,
        dailyMCQs: 5,
        dailyInterviewQuestions: 1,
        pomodoroDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        dailyReminder: true,
        revisionReminder: true,
        streakReminder: true
      },
      create: {
        userId,
        dailyCodingProblems: 1,
        dailyMCQs: 5,
        dailyInterviewQuestions: 1,
        pomodoroDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        dailyReminder: true,
        revisionReminder: true,
        streakReminder: true
      }
    });
    console.log('✅ Created user preferences');

    // Create revision items from sample problems
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const problem of sampleProblems) {
      const nextReviewDate = new Date(today);
      // Randomize next review dates - some overdue, some due today, some in future
      const randomDays = Math.floor(Math.random() * 10) - 3; // -3 to +6 days
      nextReviewDate.setDate(nextReviewDate.getDate() + randomDays);

      await prisma.revisionItem.upsert({
        where: {
          userId_contentType_contentId: {
            userId,
            contentType: 'problem',
            contentId: `problem_${problem.title.replace(/\s+/g, '_').toLowerCase()}`
          }
        },
        update: {
          contentTitle: problem.title,
          topic: problem.topic,
          tags: [problem.difficulty, problem.topic.toLowerCase()]
        },
        create: {
          userId,
          contentType: 'problem',
          contentId: `problem_${problem.title.replace(/\s+/g, '_').toLowerCase()}`,
          contentTitle: problem.title,
          topic: problem.topic,
          subtopic: null,
          tags: [problem.difficulty, problem.topic.toLowerCase()],
          nextReviewDate,
          firstLearnedDate: today,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          difficultyLevel: problem.difficulty === 'easy' ? 0.3 : problem.difficulty === 'hard' ? 0.8 : 0.5,
          status: 'new'
        }
      });
    }
    console.log(`✅ Created ${sampleProblems.length} problem revision items`);

    // Create revision items from sample MCQs
    for (const mcq of sampleMCQs) {
      await prisma.revisionItem.upsert({
        where: {
          userId_contentType_contentId: {
            userId,
            contentType: 'quiz',
            contentId: `mcq_${mcq.title.replace(/\s+/g, '_').toLowerCase()}`
          }
        },
        update: {
          contentTitle: mcq.title,
          topic: mcq.topic
        },
        create: {
          userId,
          contentType: 'quiz',
          contentId: `mcq_${mcq.title.replace(/\s+/g, '_').toLowerCase()}`,
          contentTitle: mcq.title,
          topic: mcq.topic,
          tags: [mcq.difficulty],
          nextReviewDate: today,
          firstLearnedDate: today,
          status: 'new'
        }
      });
    }
    console.log(`✅ Created ${sampleMCQs.length} MCQ revision items`);

    // Create revision items from sample interview questions
    for (const question of sampleInterviewQuestions) {
      await prisma.revisionItem.upsert({
        where: {
          userId_contentType_contentId: {
            userId,
            contentType: 'interview_question',
            contentId: `interview_${question.title.replace(/\s+/g, '_').toLowerCase()}`
          }
        },
        update: {
          contentTitle: question.title,
          topic: question.topic
        },
        create: {
          userId,
          contentType: 'interview_question',
          contentId: `interview_${question.title.replace(/\s+/g, '_').toLowerCase()}`,
          contentTitle: question.title,
          topic: question.topic,
          tags: [question.difficulty],
          nextReviewDate: today,
          firstLearnedDate: today,
          status: 'new'
        }
      });
    }
    console.log(`✅ Created ${sampleInterviewQuestions.length} interview question revision items`);

    // Create some review logs for testing
    const existingItems = await prisma.revisionItem.findMany({
      where: { userId },
      take: 5
    });

    for (const item of existingItems) {
      const reviewDate = new Date(today);
      reviewDate.setDate(reviewDate.getDate() - 1);

      await prisma.reviewLog.create({
        data: {
          revisionItemId: item.id,
          rating: Math.floor(Math.random() * 3) + 3, // 3-5 rating
          timeTaken: Math.floor(Math.random() * 60000) + 30000, // 30-90 seconds
          wasCorrect: true,
          confidenceLevel: Math.floor(Math.random() * 3) + 3,
          easeFactorBefore: 2.5,
          easeFactorAfter: 2.6,
          intervalBefore: 0,
          intervalAfter: 1
        }
      });
    }
    console.log('✅ Created sample review logs');

    // Create a bookmark collection
    const interviewPrepCollection = await prisma.bookmarkCollection.upsert({
      where: {
        userId_name: {
          userId,
          name: 'Interview Prep'
        }
      },
      update: {
        description: 'Important questions for upcoming interviews',
        color: '#EF4444',
        icon: '🎯'
      },
      create: {
        userId,
        name: 'Interview Prep',
        description: 'Important questions for upcoming interviews',
        color: '#EF4444',
        icon: '🎯'
      }
    });
    console.log('✅ Created bookmark collection: Interview Prep');

    // Add some bookmarks
    const hardProblems = sampleProblems.filter(p => p.difficulty === 'hard');
    for (const problem of hardProblems.slice(0, 3)) {
      await prisma.bookmark.upsert({
        where: {
          userId_contentType_contentId: {
            userId,
            contentType: 'problem',
            contentId: `problem_${problem.title.replace(/\s+/g, '_').toLowerCase()}`
          }
        },
        update: {
          priority: 'high',
          collectionId: interviewPrepCollection.id
        },
        create: {
          userId,
          contentType: 'problem',
          contentId: `problem_${problem.title.replace(/\s+/g, '_').toLowerCase()}`,
          contentTitle: problem.title,
          tags: ['hard', 'interview-prep'],
          priority: 'high',
          collectionId: interviewPrepCollection.id,
          notes: 'Important for FAANG interviews'
        }
      });
    }
    console.log('✅ Created bookmarks for hard problems');

    // Create some quick revision notes
    const notes = [
      {
        title: 'Binary Search Template',
        content: `// Standard binary search template
int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
        noteType: 'code_snippet',
        isQuickRevision: true
      },
      {
        title: 'Common DP Patterns',
        content: `- 0/1 Knapsack: Use 2D DP or 1D DP with reverse iteration
- Unbounded Knapsack: Use 1D DP with forward iteration
- Longest Common Subsequence: 2D DP comparing two strings
- Edit Distance: 2D DP with insert, delete, replace operations
- Coin Change: 1D DP iterating through amounts`,
        noteType: 'concept',
        isQuickRevision: true
      },
      {
        title: 'Graph Traversal Cheat Sheet',
        content: `BFS: Use queue, good for shortest path in unweighted graphs
DFS: Use stack/recursion, good for path finding, cycle detection

BFS Template:
queue.push(start); visited.add(start);
while (!queue.empty()) {
    node = queue.pop();
    for (neighbor in node.neighbors) {
        if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
        }
    }
}`,
        noteType: 'code_snippet',
        isQuickRevision: true
      },
      {
        title: 'Behavioral Interview Tips',
        content: `- Use STAR method: Situation, Task, Action, Result
- Prepare 5-7 stories that demonstrate different skills
- Quantify results whenever possible
- Practice speaking clearly and confidently
- Research the company culture beforehand`,
        noteType: 'interview_tip',
        isQuickRevision: true
      }
    ];

    for (const note of notes) {
      await prisma.userNote.create({
        data: {
          userId,
          ...note
        }
      });
    }
    console.log(`✅ Created ${notes.length} quick revision notes`);

    // Create some activity logs
    const activities = [
      { activityType: 'login', category: 'general' },
      { activityType: 'study', category: 'coding' },
      { activityType: 'complete_task', category: 'daily' },
      { activityType: 'start_session', category: 'focus' },
      { activityType: 'complete_revision', category: 'revision' }
    ];

    for (const activity of activities) {
      const activityDate = new Date(today);
      activityDate.setDate(activityDate.getDate() - Math.floor(Math.random() * 7));

      await prisma.activityLog.create({
        data: {
          userId,
          ...activity,
          description: `Sample ${activity.activityType} activity`,
          createdAt: activityDate
        }
      });
    }
    console.log(`✅ Created ${activities.length} sample activity logs`);

    // Create a sample focus session
    await prisma.focusSession.create({
      data: {
        userId,
        sessionType: 'pomodoro',
        plannedDuration: 25,
        actualDuration: 25,
        status: 'completed',
        taskDescription: 'Practice dynamic programming problems',
        relatedTopic: 'DP',
        focusLevel: 4,
        interruptions: 1,
        startedAt: new Date(today.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        completedAt: new Date(today.getTime() - 60 * 60 * 1000) // 1 hour ago
      }
    });
    console.log('✅ Created sample focus session');

    console.log('\n🎉 Revision system seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Revision Items: ${sampleProblems.length + sampleMCQs.length + sampleInterviewQuestions.length}`);
    console.log(`   - Bookmark Collections: 1`);
    console.log(`   - Bookmarks: ${hardProblems.slice(0, 3).length}`);
    console.log(`   - Notes: ${notes.length}`);
    console.log(`   - Activity Logs: ${activities.length}`);
    console.log(`   - Focus Sessions: 1`);
    console.log('\n🧪 Test with:');
    console.log('   GET /api/revision?action=due-items');
    console.log('   GET /api/revision?action=stats');
    console.log('   GET /api/daily-tasks?action=today');
    console.log('   GET /api/bookmarks?action=quick-revision');

  } catch (error) {
    console.error('❌ Error seeding revision system:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedRevisionSystem()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });