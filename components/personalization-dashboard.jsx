import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { usePersonalization } from '@/hooks/use-personalization';
import { PersonalizedRecommendations, NextBestAction, UserInsights } from '@/components/personalized-recommendations';

export function PersonalizationDashboard() {
  const { profile, loading } = usePersonalization();

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Unable to load personalization data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Your Learning Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-600">Preparation Level</h4>
              <p className="text-lg font-bold">{profile.preparationLevel || 'Beginner'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-600">Learning Style</h4>
              <p className="text-lg">{profile.learningStyle || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-600">Preferred Difficulty</h4>
              <p className="text-lg capitalize">{profile.preferredDifficulty || 'Medium'}</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Engagement Score</span>
                <span>{Math.round((profile.engagementScore || 0) * 100)}%</span>
              </div>
              <Progress value={(profile.engagementScore || 0) * 100} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Consistency Score</span>
                <span>{Math.round((profile.consistencyScore || 0) * 100)}%</span>
              </div>
              <Progress value={(profile.consistencyScore || 0) * 100} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Average Accuracy</span>
                <span>{Math.round(profile.averageAccuracy || 0)}%</span>
              </div>
              <Progress value={profile.averageAccuracy || 0} />
            </div>
          </div>

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Strengths</h4>
              <div className="flex flex-wrap gap-1">
                {profile.strengths && profile.strengths.length > 0 ? (
                  profile.strengths.map((strength, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                      {strength}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No strengths identified yet</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Areas for Improvement</h4>
              <div className="flex flex-wrap gap-1">
                {profile.weaknesses && profile.weaknesses.length > 0 ? (
                  profile.weaknesses.map((weakness, index) => (
                    <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                      {weakness}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No weak areas identified yet</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Best Action */}
      <NextBestAction />

      {/* Recommendations */}
      <PersonalizedRecommendations />

      {/* Insights */}
      <UserInsights />

      {/* Goals Progress */}
      {profile.goals && profile.goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🎯 Your Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.goals.map((goal) => (
                <div key={goal.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{goal.title}</h4>
                    <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>
                      {goal.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{goal.description}</p>

                  {goal.targetDate && (
                    <p className="text-sm text-gray-500 mb-2">
                      Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex justify-between text-sm">
                    <span>Priority: {goal.priority}/5</span>
                    <span>Type: {goal.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Component for integrating personalization into existing pages
export function PersonalizationWidget({ type = 'compact' }) {
  const { nextAction, recommendations } = usePersonalization();

  if (type === 'compact') {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          {nextAction ? (
            <div>
              <h4 className="font-semibold text-sm mb-1">Next Best Action</h4>
              <p className="text-sm text-gray-600">{nextAction.action.title}</p>
            </div>
          ) : recommendations.length > 0 ? (
            <div>
              <h4 className="font-semibold text-sm mb-1">Top Recommendation</h4>
              <p className="text-sm text-gray-600">{recommendations[0].title}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Keep learning to get personalized suggestions!</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return <PersonalizationDashboard />;
}
