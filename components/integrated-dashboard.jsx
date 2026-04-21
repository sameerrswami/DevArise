// components/integrated-dashboard.jsx
// Main unified platform experience dashboard

'use client';

import React, { useState, useEffect } from 'react';
import { useIntegration } from '@/hooks/use-integration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Target, Zap, BookOpen, Code, Users } from 'lucide-react';

export function IntegratedDashboard() {
  const {
    journey,
    metrics,
    readiness,
    roadmap,
    workflow,
    loading,
    trackEvent,
    startSession,
  } = useIntegration();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header with Journey Stage */}
      <div className="grid gap-4">
        <div className="col-span-full">
          <h1 className="text-4xl font-bold tracking-tight">Your Placement Journey</h1>
          <p className="text-muted-foreground mt-2">
            Currently in <span className="font-semibold text-foreground capitalize">{journey?.currentStage}</span> stage
          </p>
        </div>

        {/* Stage Timeline */}
        <StageTimeline currentStage={journey?.currentStage} />
      </div>

      {/* Placement Readiness Card */}
      <PlacementReadinessCard readiness={readiness} metrics={metrics} />

      {/* Grid: Metrics, Goals, Roadmap */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Performance Metrics */}
        <PerformanceMetricsCard metrics={metrics} />

        {/* Current Goals */}
        <CurrentGoalsCard journeyMetrics={metrics} />

        {/* Learning Streaks */}
        <LearningStreakCard metrics={metrics} />
      </div>

      {/* Current Roadmap Phase */}
      <RoadmapProgressCard roadmap={roadmap} />

      {/* Next Best Action */}
      {workflow?.suggestedNextAction && (
        <NextBestActionCard
          action={workflow.suggestedNextAction}
          value={workflow.estimatedValue}
          trackEvent={trackEvent}
          startSession={startSession}
        />
      )}

      {/* Feature Shortcuts */}
      <FeatureShortcutsGrid journey={journey} />

      {/* Recent Activity & Insights */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <RecentActivityCard metrics={metrics} />
        <InsightsCard readiness={readiness} />
      </div>

      {/* Weak Areas Focus */}
      {readiness?.weaknesses?.length > 0 && (
        <WeakAreasFocusCard weakAreas={readiness.weaknesses} />
      )}
    </div>
  );
}

function StageTimeline({ currentStage }) {
  const stages = [
    { id: 'onboarding', label: 'Setup', icon: '*' },
    { id: 'learning', label: 'Learn', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: Code },
    { id: 'interview_prep', label: 'Interview', icon: Users },
    { id: 'job_search', label: 'Jobs', icon: Target },
  ];

  const stageIndex = stages.findIndex(s => s.id === currentStage);

  return (
    <div className="flex items-center justify-between gap-2 mt-4">
      {stages.map((stage, idx) => (
        <React.Fragment key={stage.id}>
          <div
            className={`flex flex-col items-center gap-2 ${
              idx <= stageIndex ? 'opacity-100' : 'opacity-50'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                idx === stageIndex
                  ? 'bg-primary text-primary-foreground'
                  : idx < stageIndex
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {idx < stageIndex ? '✓' : idx + 1}
            </div>
            <span className="text-xs font-medium text-center">{stage.label}</span>
          </div>
          {idx < stages.length - 1 && (
            <div
              className={`flex-1 h-1 mx-2 ${
                idx < stageIndex ? 'bg-green-500' : 'bg-muted'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function PlacementReadinessCard({ readiness, metrics }) {
  const readinessLevel = readiness?.overall || 0;
  let levelText = 'Building';
  let levelColor = 'text-yellow-600';

  if (readinessLevel >= 70) {
    levelText = 'Ready for Placements!';
    levelColor = 'text-green-600';
  } else if (readinessLevel >= 50) {
    levelText = 'Nearly Ready';
    levelColor = 'text-blue-600';
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Placement Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold ${levelColor}`}>
              {readinessLevel}%
            </span>
            <span className={`text-sm font-medium ${levelColor}`}>{levelText}</span>
          </div>
          <Progress value={readinessLevel} className="h-3" />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Technical</div>
            <div className="text-lg font-bold">{readiness?.technical || 0}%</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Interview</div>
            <div className="text-lg font-bold">{readiness?.interview || 0}%</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Resume</div>
            <div className="text-lg font-bold">{readiness?.resume || 0}%</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Job Search</div>
            <div className="text-lg font-bold">{readiness?.jobSearch || 0}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceMetricsCard({ metrics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Problems Solved</span>
            <span className="font-semibold">{metrics?.totalProblemsSolved || 0}</span>
          </div>
          <Progress value={Math.min(100, (metrics?.totalProblemsSolved || 0) * 2)} />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Accuracy</span>
            <span className="font-semibold">{(metrics?.problemAccuracy || 0 * 100).toFixed(1)}%</span>
          </div>
          <Progress value={metrics?.problemAccuracy * 100 || 0} />
        </div>
        <div className="pt-2 border-t">
          <div className="text-sm text-muted-foreground">Interviews Attempted</div>
          <div className="text-2xl font-bold">{metrics?.interviewsAttempted || 0}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function CurrentGoalsCard({ journeyMetrics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Active Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-sm">Master DSA</div>
              <div className="text-xs text-muted-foreground">Data Structures & Algorithms</div>
            </div>
            <Badge>In Progress</Badge>
          </div>
          <Progress value={65} />
        </div>
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-sm">System Design</div>
              <div className="text-xs text-muted-foreground">Scalability & Design Patterns</div>
            </div>
            <Badge variant="secondary">Next</Badge>
          </div>
          <Progress value={20} />
        </div>
        <Button variant="outline" className="w-full mt-4" size="sm">
          View All Goals
        </Button>
      </CardContent>
    </Card>
  );
}

function LearningStreakCard({ metrics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Learning Streak</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-5xl font-bold text-primary">
            {metrics?.currentStreak || 0}
          </div>
          <div className="text-sm text-muted-foreground">days in a row</div>
        </div>
        <div className="text-xs space-y-1">
          <div>🔥 Longest: {metrics?.longestStreak || 0} days</div>
          <div>⏱️ Total: {(metrics?.totalHoursSpent || 0).toFixed(1)} hours</div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoadmapProgressCard({ roadmap }) {
  if (!roadmap?.phases?.length) return null;

  const currentPhase = roadmap.phases[0];
  const nextPhase = roadmap.phases[1];
  const completedCount = roadmap.phases.filter(p => p.completedAt).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Personalized Roadmap</CardTitle>
        <CardDescription>
          Phase {roadmap.phases.findIndex(p => p.progress > 0) + 1} of {roadmap.phases.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentPhase && (
          <div>
            <div className="font-semibold mb-2">{currentPhase.title}</div>
            <Progress value={(currentPhase.progress || 0) * 100} className="mb-2" />
            <div className="grid grid-cols-3 text-xs text-muted-foreground">
              <div>📚 {currentPhase.learningModules?.length || 0} modules</div>
              <div>💻 {currentPhase.targetProblems || 0} problems</div>
              <div>🎯 {currentPhase.milestonesCompleted}/{currentPhase.totalMilestones} milestones</div>
            </div>
          </div>
        )}

        {nextPhase && (
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">Up Next</div>
            <div className="text-sm font-medium">{nextPhase.title}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {nextPhase.duration} weeks · {nextPhase.targetProblems} problems
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NextBestActionCard({ action, value, trackEvent, startSession }) {
  const actionMap = {
    'review_topic': { icon: BookOpen, label: 'Review Topic', color: 'bg-blue-500' },
    'next_problem': { icon: Code, label: 'Next Problem', color: 'bg-green-500' },
    'interview_feedback': { icon: Users, label: 'Interview Feedback', color: 'bg-purple-500' },
    'practice_problems': { icon: Code, label: 'Practice Problems', color: 'bg-orange-500' },
    'another_interview': { icon: Users, label: 'Another Interview', color: 'bg-red-500' },
  };

  const currentAction = actionMap[action] || { icon: Zap, label: 'Continue Learning', color: 'bg-primary' };

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Next Best Action
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-muted-foreground mb-2">Recommended</div>
          <div className="text-xl font-bold">{currentAction.label}</div>
          <div className="text-sm text-muted-foreground mt-1">{value}</div>
        </div>
        <Button className="w-full" onClick={startSession}>
          Start Now →
        </Button>
      </CardContent>
    </Card>
  );
}

function FeatureShortcutsGrid({ journey }) {
  const features = [
    {
      title: 'Solve Problems',
      description: 'Practice coding questions',
      icon: Code,
      href: '/problems',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Mock Interviews',
      description: 'Interview preparation',
      icon: Users,
      href: '/interviewer',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Learn Concepts',
      description: 'Master DSA & more',
      icon: BookOpen,
      href: '/learn',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Contests',
      description: 'Compete & practice',
      icon: Target,
      href: '/contests',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {features.map(feature => (
          <a
            key={feature.href}
            href={feature.href}
            className={`bg-gradient-to-br ${feature.color} rounded-lg p-4 text-white hover:shadow-lg transition-shadow`}
          >
            <div className="font-semibold text-sm">{feature.title}</div>
            <div className="text-xs opacity-90">{feature.description}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

function RecentActivityCard({ metrics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Today's session</span>
            <span className="font-semibold">45 min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">This week</span>
            <span className="font-semibold">{metrics?.currentStreak || 0} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total time</span>
            <span className="font-semibold">{(metrics?.totalHoursSpent || 0).toFixed(1)}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightsCard({ readiness }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Key Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium">Focus on weaknesses</div>
            <div className="text-muted-foreground text-xs">Practice in {readiness?.weaknesses?.[0]?.area}</div>
          </div>
        </div>
        {readiness?.recommendations?.[0] && (
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <div className="text-sm font-medium">{readiness.recommendations[0].action}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WeakAreasFocusCard({ weakAreas }) {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          Focus Areas
        </CardTitle>
        <CardDescription>Topics that need more attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {weakAreas.map((area, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <div className="font-medium capitalize">{area.area.replace(/_/g, ' ')}</div>
                <div className="text-sm text-muted-foreground">
                  Current score: {area.score}%
                </div>
              </div>
              <Button variant="outline" size="sm">
                Practice
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
