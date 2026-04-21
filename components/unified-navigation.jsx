// components/unified-navigation.jsx
// Seamless navigation between all features with contextual guidance

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useIntegration } from '@/hooks/use-integration';
import {
  BookOpen,
  Code,
  Users,
  FileText,
  Briefcase,
  BarChart3,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function UnifiedNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { journey, metrics } = useIntegration();

  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      description: 'Your journey overview',
    },
    {
      label: 'Learn',
      href: '/learn',
      icon: BookOpen,
      description: 'Master concepts & DSA',
      beta: false,
      recommendation: journey?.currentStage === 'learning',
    },
    {
      label: 'Practice',
      href: '/problems',
      icon: Code,
      description: `${metrics?.totalProblemsSolved || 0} problems solved`,
      recommendation: journey?.currentStage === 'practice',
    },
    {
      label: 'Interviews',
      href: '/interviewer',
      icon: Users,
      description: `${metrics?.interviewsAttempted || 0} interviews completed`,
      recommendation: journey?.currentStage === 'interview_prep',
    },
    {
      label: 'Resume',
      href: '/resume',
      icon: FileText,
      description: 'Optimize your resume',
      recommendation: false,
    },
    {
      label: 'Jobs',
      href: '/jobs',
      icon: Briefcase,
      description: 'Find opportunities',
      recommendation: journey?.currentStage === 'job_search',
    },
  ];

  const isActive = (href) => pathname?.startsWith(href);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block border-b sticky top-0 z-40 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-bold text-lg">
              DevArise
            </Link>

            <div className="flex items-center gap-1">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? 'default' : 'ghost'}
                    size="sm"
                    className="relative"
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {item.recommendation && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Readiness:</span>
                <span className="font-bold">{journey?.placementReadiness || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white z-40">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg w-full ${
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Contextual Sidebar (Desktop) */}
      <ContextualSidebar items={navigationItems} currenPath={pathname} />
    </>
  );
}

function ContextualSidebar({ items, currenPath }) {
  const { journey, workflow } = useIntegration();

  // Determine which feature is most relevant
  const stageToFeatureMap = {
    onboarding: 'learn',
    learning: 'learn',
    practice: 'problems',
    interview_prep: 'interviewer',
    job_search: 'jobs',
  };

  const recommendedFeature = stageToFeatureMap[journey?.currentStage] || 'dashboard';

  return (
    <aside className="hidden lg:block w-64 border-r bg-muted/30 fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Current Stage */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Your Stage</h3>
          <div className="bg-white rounded-lg p-3 border">
            <div className="capitalize font-medium text-sm">
              {journey?.currentStage?.replace(/_/g, ' ')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Progress: {(journey?.stageProgress || 0).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Guided Path */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Guided Path</h3>
          <div className="space-y-2">
            {items
              .filter((item) => item.href !== '/dashboard')
              .map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      item.href === `/` + recommendedFeature
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <item.icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      {item.href === `/` + recommendedFeature && (
                        <Badge variant="default" className="text-xs">
                          Next
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>

        {/* Suggested Action */}
        {workflow?.suggestedNextAction && (
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              💡 Suggested
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-sm font-medium capitalize">
                {workflow.suggestedNextAction.replace(/_/g, ' ')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {workflow.estimatedValue}
              </div>
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div>
          <h3 className="font-semibold text-sm mb-2">💡 Tips</h3>
          <ul className="text-xs space-y-2 text-muted-foreground">
            <li>• Complete current phase before moving to next</li>
            <li>• Maintain daily practice streak</li>
            <li>• Focus on weak areas identified</li>
            <li>• Review past interviews regularly</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}

// Feature Integration Card for each page
export function FeatureIntegrationCard({ feature, nextSteps }) {
  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm">Integrated Experience</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Your progress here automatically updates your dashboard and influences recommendations
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>

      {/* Cross-Feature Impact */}
      {nextSteps && (
        <div className="mt-3 pt-3 border-t border-primary/10">
          <div className="text-xs font-medium mb-2">Next Steps</div>
          <div className="space-y-1">
            {nextSteps.map((step, idx) => (
              <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
