/**
 * Community System Seed Script
 * Run this script to initialize community badges and sample data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Community badge definitions
const communityBadges = [
  {
    id: 'FIRST_QUESTION',
    name: 'First Question',
    description: 'Asked your first question',
    icon: '❓',
    color: '#3B82F6',
    pointsRequired: 0,
    category: 'milestone',
    isActive: true
  },
  {
    id: 'FIRST_ANSWER',
    name: 'First Answer',
    description: 'Provided your first answer',
    icon: '✍️',
    color: '#3B82F6',
    pointsRequired: 0,
    category: 'milestone',
    isActive: true
  },
  {
    id: 'FIRST_EXPERIENCE',
    name: 'Experience Sharer',
    description: 'Shared your first interview experience',
    icon: '📝',
    color: '#3B82F6',
    pointsRequired: 0,
    category: 'milestone',
    isActive: true
  },
  {
    id: 'HELPFUL_5',
    name: 'Helpful Hand',
    description: 'Received 5 upvotes on your answers',
    icon: '🤝',
    color: '#10B981',
    pointsRequired: 0,
    category: 'helper',
    isActive: true
  },
  {
    id: 'HELPFUL_25',
    name: 'Community Helper',
    description: 'Received 25 upvotes on your answers',
    icon: '🌟',
    color: '#10B981',
    pointsRequired: 0,
    category: 'helper',
    isActive: true
  },
  {
    id: 'HELPFUL_100',
    name: 'Helpful Hero',
    description: 'Received 100 upvotes on your answers',
    icon: '🦸',
    color: '#10B981',
    pointsRequired: 0,
    category: 'helper',
    isActive: true
  },
  {
    id: 'MENTOR',
    name: 'Community Mentor',
    description: 'Reached Mentor level in the community',
    icon: '🎓',
    color: '#F59E0B',
    pointsRequired: 1500,
    category: 'milestone',
    isActive: true
  },
  {
    id: 'LEGEND',
    name: 'Community Legend',
    description: 'Reached Legend level in the community',
    icon: '👑',
    color: '#FBBF24',
    pointsRequired: 5000,
    category: 'milestone',
    isActive: true
  },
  {
    id: 'MOCK_INTERVIEWER',
    name: 'Mock Mentor',
    description: 'Conducted 5 mock interviews',
    icon: '🎭',
    color: '#EC4899',
    pointsRequired: 0,
    category: 'helper',
    isActive: true
  },
  {
    id: 'EXPERIENCE_VETERAN',
    name: 'Experience Veteran',
    description: 'Shared 5 interview experiences',
    icon: '📚',
    color: '#EC4899',
    pointsRequired: 0,
    category: 'contribution',
    isActive: true
  }
];

// Sample community tags
const communityTags = [
  { name: 'data-structures', description: 'Questions about data structures', color: '#3B82F6' },
  { name: 'algorithms', description: 'Algorithm-related questions', color: '#3B82F6' },
  { name: 'javascript', description: 'JavaScript programming', color: '#F7DF1E' },
  { name: 'react', description: 'React.js framework', color: '#61DAFB' },
  { name: 'nodejs', description: 'Node.js backend', color: '#339933' },
  { name: 'python', description: 'Python programming', color: '#3776AB' },
  { name: 'java', description: 'Java programming', color: '#007396' },
  { name: 'cpp', description: 'C++ programming', color: '#00599C' },
  { name: 'sql', description: 'SQL and databases', color: '#00758F' },
  { name: 'dbms', description: 'Database management systems', color: '#00758F' },
  { name: 'os', description: 'Operating systems', color: '#6B7280' },
  { name: 'dsa', description: 'Data structures and algorithms', color: '#3B82F6' },
  { name: 'system-design', description: 'System design questions', color: '#8B5CF6' },
  { name: 'interview-prep', description: 'Interview preparation', color: '#10B981' },
  { name: 'career-advice', description: 'Career guidance', color: '#F59E0B' }
];

async function seedCommunity() {
  try {
    console.log('🌱 Seeding community system...');

    // Seed community badges
    console.log('📛 Seeding community badges...');
    for (const badge of communityBadges) {
      await prisma.communityBadge.upsert({
        where: { name: badge.name },
        update: badge,
        create: badge
      });
    }
    console.log(`✅ Seeded ${communityBadges.length} community badges`);

    // Seed community tags
    console.log('🏷️  Seeding community tags...');
    for (const tag of communityTags) {
      await prisma.communityTag.upsert({
        where: { name: tag.name },
        update: tag,
        create: tag
      });
    }
    console.log(`✅ Seeded ${communityTags.length} community tags`);

    console.log('🎉 Community system seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding community system:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedCommunity();