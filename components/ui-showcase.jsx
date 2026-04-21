'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code,
  MessageSquare,
  BookOpen,
  FileText,
  Briefcase,
  Users,
  Zap,
  TrendingUp,
  Award,
  Home,
} from 'lucide-react';

// Premium UI Components
import {
  PremiumCard,
  GlassCard,
  GradientCard,
  NeumorphicCard,
  CardGrid,
} from '@/components/ui/premium-card';
import {
  ModernButton,
  ModernInput,
  Badge,
  StatCard,
  SkeletonLoader,
  LoadingSpinner,
  Tooltip,
  Divider,
} from '@/components/ui/modern-elements';
import { AITutorChat, AIBuddyChat } from '@/components/ui/chat-interfaces';
import {
  ModernLeaderboard,
  ProgressRing,
  RankBadge,
} from '@/components/ui/leaderboard';
import {
  ModernDashboard,
  DashboardGrid,
  DashboardSection,
  QuickActionsGrid,
  MetricsSummary,
  EmptyState,
} from '@/components/ui/dashboard-components';
import {
  ModernCodeEditor,
  CodeComparisonView,
  ProblemEditorLayout,
  ExecuteButton,
} from '@/components/ui/code-editor';
import {
  AnalyticsCard,
  LineChartComponent,
  BarChartComponent,
  AreaChartComponent,
  PieChartComponent,
  PerformanceMetrics,
  ProgressTimeline,
} from '@/components/ui/analytics';
import {
  MainLayout,
  TabNavigation,
} from '@/components/ui/layout';

/**
 * UIShowcase - Comprehensive showcase of all DevArise AI premium UI components
 */
export function UIShowcase() {
  const [activeTab, setActiveTab] = useState('cards');
  const [tutorMessages, setTutorMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi! I can help you master coding concepts. What would you like to learn today?',
      timestamp: '10:30 AM',
    },
  ]);
  const [buddyMessages, setBuddyMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hey! Ready to crush some goals? Let's celebrate your wins! 🎉",
      timestamp: '10:30 AM',
    },
  ]);

  const sidebarItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'practice', label: 'Coding Practice', icon: Code, badge: '12' },
    { id: 'interview', label: 'AI Interview', icon: MessageSquare },
    { id: 'learn', label: 'Learning Tracks', icon: BookOpen },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText },
    { id: 'jobs', label: 'Job Curation', icon: Briefcase },
    { id: 'community', label: 'Community', icon: Users },
  ];

  const user = {
    name: 'Alex Developer',
    email: 'alex@devarise.ai',
    avatar:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  };

  const leaderboardData = [
    {
      rank: 1,
      username: 'ProCoder',
      title: 'Master Level',
      score: 4850,
      streak: 42,
      change: 5,
      avatar:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=ProCoder',
      stats: [
        { label: 'Problems Solved', value: '156' },
        { label: 'Accuracy', value: '94%' },
      ],
    },
    {
      rank: 2,
      username: 'DataNinja',
      title: 'Expert Level',
      score: 4620,
      streak: 28,
      change: -2,
      avatar:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=DataNinja',
      stats: [
        { label: 'Problems Solved', value: '142' },
        { label: 'Accuracy', value: '91%' },
      ],
    },
    {
      rank: 3,
      username: 'CodeWizard',
      title: 'Advanced Level',
      score: 4390,
      streak: 35,
      change: 8,
      avatar:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeWizard',
      stats: [
        { label: 'Problems Solved', value: '138' },
        { label: 'Accuracy', value: '89%' },
      ],
    },
    {
      rank: 4,
      username: 'AlgoMaster',
      title: 'Intermediate Level',
      score: 3920,
      streak: 21,
      change: 3,
      avatar:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=AlgoMaster',
      stats: [
        { label: 'Problems Solved', value: '98' },
        { label: 'Accuracy', value: '87%' },
      ],
    },
  ];

  const chartData = [
    { name: 'Mon', value: 65, problems: 45 },
    { name: 'Tue', value: 78, problems: 52 },
    { name: 'Wed', value: 92, problems: 68 },
    { name: 'Thu', value: 85, problems: 61 },
    { name: 'Fri', value: 95, problems: 72 },
    { name: 'Sat', value: 88, problems: 65 },
    { name: 'Sun', value: 71, problems: 48 },
  ];

  const pieData = [
    { name: 'Easy', value: 25 },
    { name: 'Medium', value: 55 },
    { name: 'Hard', value: 20 },
  ];

  return (
    <MainLayout
      sidebarItems={sidebarItems}
      user={user}
      title="UI Showcase"
      activeSidebarItem="home"
    >
      <div className="space-y-12 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold gradient-text mb-2">
            DevArise AI - Premium UI System
          </h1>
          <p className="text-lg text-foreground/60">
            Modern, responsive, and visually stunning components for
            the next-generation coding platform
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <TabNavigation
          tabs={[
            { id: 'cards', label: 'Premium Cards', icon: Code },
            { id: 'buttons', label: 'Interactive Elements' },
            { id: 'chat', label: 'Chat Interfaces' },
            { id: 'leaderboard', label: 'Leaderboard' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'code', label: 'Code Editor' },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Cards Section */}
        {activeTab === 'cards' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <DashboardSection title="Premium Card Variants">
              <CardGrid columns={2}>
                <PremiumCard variant="glass">
                  <div className="space-y-2">
                    <Badge variant="default">Glassmorphism</Badge>
                    <p className="text-sm text-foreground/70">
                      Modern glass effect with backdrop blur
                    </p>
                  </div>
                </PremiumCard>

                <PremiumCard variant="gradient" glow>
                  <div className="space-y-2">
                    <Badge variant="success">
                      Gradient
                    </Badge>
                    <p className="text-sm text-foreground/70">
                      Animated gradient background
                    </p>
                  </div>
                </PremiumCard>

                <PremiumCard variant="neumorphic">
                  <div className="space-y-2">
                    <Badge variant="warning">
                      Neumorphism
                    </Badge>
                    <p className="text-sm text-foreground/70">
                      Soft UI design pattern
                    </p>
                  </div>
                </PremiumCard>

                <PremiumCard variant="elevated">
                  <div className="space-y-2">
                    <Badge variant="info">Elevated</Badge>
                    <p className="text-sm text-foreground/70">
                      Premium shadow effects
                    </p>
                  </div>
                </PremiumCard>
              </CardGrid>
            </DashboardSection>

            <DashboardSection title="Stat Cards">
              <CardGrid columns={4}>
                <StatCard
                  label="Problems Solved"
                  value="156"
                  icon={Code}
                  change="12"
                  positive={true}
                />
                <StatCard
                  label="Accuracy Rate"
                  value="94%"
                  icon={TrendingUp}
                  change="5"
                  positive={true}
                />
                <StatCard
                  label="Current Streak"
                  value="42"
                  icon={Zap}
                  change="3"
                  positive={true}
                />
                <StatCard
                  label="Ranking"
                  value="Top 5%"
                  icon={Award}
                  change="2"
                  positive={true}
                />
              </CardGrid>
            </DashboardSection>
          </motion.div>
        )}

        {/* Buttons Section */}
        {activeTab === 'buttons' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <DashboardSection title="Button Variants">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <ModernButton variant="primary">
                    Primary Button
                  </ModernButton>
                  <ModernButton variant="secondary">
                    Secondary Button
                  </ModernButton>
                  <ModernButton variant="outline">
                    Outline Button
                  </ModernButton>
                  <ModernButton variant="ghost">
                    Ghost Button
                  </ModernButton>
                  <ModernButton variant="danger">
                    Danger Button
                  </ModernButton>
                </div>

                <div className="flex flex-wrap gap-3">
                  <ModernButton variant="primary" size="sm">
                    Small
                  </ModernButton>
                  <ModernButton variant="primary" size="md">
                    Medium
                  </ModernButton>
                  <ModernButton variant="primary" size="lg">
                    Large
                  </ModernButton>
                </div>

                <div className="flex flex-wrap gap-3">
                  <ModernButton variant="primary" icon={Code}>
                    With Icon
                  </ModernButton>
                  <ModernButton variant="primary" loading>
                    Loading
                  </ModernButton>
                  <ModernButton variant="primary" fullWidth>
                    Full Width
                  </ModernButton>
                </div>
              </div>
            </DashboardSection>

            <DashboardSection title="Badges">
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="rank" glow>
                  Rank Badge
                </Badge>
              </div>
            </DashboardSection>

            <DashboardSection title="Input Fields">
              <CardGrid columns={2}>
                <ModernInput
                  label="Email Address"
                  placeholder="Enter email"
                  icon={Code}
                />
                <ModernInput
                  label="Error State"
                  placeholder="This has an error"
                  error="Invalid email format"
                  icon={Code}
                />
              </CardGrid>
            </DashboardSection>

            <DashboardSection title="Loading States">
              <CardGrid columns={3}>
                <div className="flex justify-center items-center">
                  <LoadingSpinner size="md" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60 mb-3">
                    Skeleton Loader:
                  </p>
                  <SkeletonLoader count={2} />
                </div>
              </CardGrid>
            </DashboardSection>
          </motion.div>
        )}

        {/* Chat Section */}
        {activeTab === 'chat' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <DashboardSection
              title="AI Chat Interfaces"
              description="Professional Tutor and Casual Buddy chat modes"
            >
              <CardGrid columns={2}>
                <div className="h-96">
                  <AITutorChat
                    messages={tutorMessages}
                    onSendMessage={(msg) => {
                      setTutorMessages([
                        ...tutorMessages,
                        {
                          role: 'user',
                          content: msg,
                          timestamp: new Date().toLocaleTimeString(),
                        },
                      ]);
                    }}
                  />
                </div>

                <div className="h-96">
                  <AIBuddyChat
                    messages={buddyMessages}
                    onSendMessage={(msg) => {
                      setBuddyMessages([
                        ...buddyMessages,
                        {
                          role: 'user',
                          content: msg,
                          timestamp: new Date().toLocaleTimeString(),
                        },
                      ]);
                    }}
                  />
                </div>
              </CardGrid>
            </DashboardSection>
          </motion.div>
        )}

        {/* Leaderboard Section */}
        {activeTab === 'leaderboard' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <DashboardSection
              title="Leaderboard & Rankings"
              description="Competitive rankings with animated progress"
            >
              <ModernLeaderboard
                entries={leaderboardData}
                userRank={{
                  rank: 28,
                  username: 'You',
                  score: 2450,
                  avatar:
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
                }}
              />
            </DashboardSection>

            <DashboardSection title="Progress Indicators">
              <CardGrid columns={4}>
                <div className="flex justify-center">
                  <ProgressRing
                    percentage={92}
                    label="Accuracy"
                    size="md"
                    color="purple"
                  />
                </div>
                <div className="flex justify-center">
                  <ProgressRing
                    percentage={78}
                    label="Speed"
                    size="md"
                    color="blue"
                  />
                </div>
                <div className="flex justify-center">
                  <ProgressRing
                    percentage={85}
                    label="Consistency"
                    size="md"
                    color="cyan"
                  />
                </div>
                <div className="flex justify-center">
                  <ProgressRing
                    percentage={65}
                    label="Practice"
                    size="md"
                    color="green"
                  />
                </div>
              </CardGrid>
            </DashboardSection>

            <DashboardSection title="Rank Badges">
              <div className="flex flex-wrap gap-4">
                <RankBadge rank={1} />
                <RankBadge rank={2} />
                <RankBadge rank={3} />
                <RankBadge rank={15} />
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {/* Analytics Section */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <DashboardSection title="Performance Metrics">
              <PerformanceMetrics
                metrics={[
                  {
                    label: 'Code Quality',
                    value: 92,
                    color: '#10b981',
                  },
                  {
                    label: 'Execution Speed',
                    value: 78,
                    color: '#3b82f6',
                  },
                  {
                    label: 'Memory Usage',
                    value: 85,
                    color: '#a855f7',
                  },
                ]}
              />
            </DashboardSection>

            <DashboardSection title="Analytics Charts">
              <CardGrid columns={2}>
                <AnalyticsCard
                  title="Daily Activity"
                  description="Problems solved per day"
                >
                  <LineChartComponent
                    data={chartData}
                    lines={['value', 'problems']}
                    colors={['#a855f7', '#3b82f6']}
                  />
                </AnalyticsCard>

                <AnalyticsCard
                  title="Performance Overview"
                  description="Weekly breakdown"
                >
                  <BarChartComponent
                    data={chartData}
                    bars={['value', 'problems']}
                  />
                </AnalyticsCard>

                <AnalyticsCard
                  title="Problem Distribution"
                  description="By difficulty level"
                >
                  <PieChartComponent
                    data={pieData}
                    height={300}
                  />
                </AnalyticsCard>

                <AnalyticsCard
                  title="Progress Trend"
                  description="Over the past week"
                >
                  <AreaChartComponent
                    data={chartData}
                    areas={['value', 'problems']}
                  />
                </AnalyticsCard>
              </CardGrid>
            </DashboardSection>

            <DashboardSection title="Progress Timeline">
              <ProgressTimeline
                milestones={[
                  {
                    title: 'Started DevArise',
                    description:
                      'Began your coding journey',
                    date: 'Jan 15, 2024',
                  },
                  {
                    title: 'Solved 50 Problems',
                    description:
                      'Reached a new milestone',
                    date: 'Feb 10, 2024',
                  },
                  {
                    title: 'Completed First Track',
                    description:
                      'Finished the Python Basics track',
                    date: 'Mar 5, 2024',
                  },
                  {
                    title: 'Top 10% Ranking',
                    description:
                      'Achieved top performer status',
                    date: 'Apr 1, 2024',
                  },
                ]}
              />
            </DashboardSection>
          </motion.div>
        )}

        {/* Code Editor Section */}
        {activeTab === 'code' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <DashboardSection
              title="Code Editor Interface"
              description="Professional code editing experience"
            >
              <ModernCodeEditor
                code={`function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Optimized version
function fibonacciOptimized(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  
  memo[n] = fibonacciOptimized(n - 1, memo) + 
            fibonacciOptimized(n - 2, memo);
  return memo[n];
}`}
                language="javascript"
                fileName="fibonacci.js"
              />
            </DashboardSection>

            <DashboardSection title="Code Comparison">
              <CodeComparisonView
                leftCode={`function sumArray(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}`}
                rightCode={`function sumArray(arr) {
  return arr.reduce((a, b) => a + b, 0);
}`}
                leftLabel="Before"
                rightLabel="After"
              />
            </DashboardSection>
          </motion.div>
        )}

        {/* Dashboard Sections */}
        <DashboardSection title="Quick Actions">
          <QuickActionsGrid
            actions={[
              {
                icon: '🎯',
                label: 'Practice',
                onClick: () => {},
              },
              {
                icon: '🤖',
                label: 'AI Interview',
                onClick: () => {},
              },
              {
                icon: '📚',
                label: 'Learn',
                onClick: () => {},
              },
              {
                icon: '🚀',
                label: 'Projects',
                onClick: () => {},
              },
              {
                icon: '💼',
                label: 'Jobs',
                onClick: () => {},
              },
              {
                icon: '👥',
                label: 'Community',
                onClick: () => {},
              },
            ]}
          />
        </DashboardSection>

        <DashboardSection title="Summary Metrics">
          <MetricsSummary
            metrics={[
              {
                label: 'Total Solved',
                value: '156',
                change: '12',
                positive: true,
              },
              {
                label: 'Streak Days',
                value: '42',
                change: '3',
                positive: true,
              },
              {
                label: 'Ranking',
                value: 'Top 5%',
                change: '2',
                positive: true,
              },
              {
                label: 'Total XP',
                value: '4,850',
                change: '15',
                positive: true,
              },
            ]}
          />
        </DashboardSection>

        {/* Empty State */}
        <DashboardSection title="Empty State Example">
          <EmptyState
            icon="📭"
            title="No Contests Yet"
            description="Participate in coding contests to earn badges and climb the leaderboard"
            action={
              <ModernButton variant="primary">
                Explore Contests
              </ModernButton>
            }
          />
        </DashboardSection>
      </div>
    </MainLayout>
  );
}

export default UIShowcase;
