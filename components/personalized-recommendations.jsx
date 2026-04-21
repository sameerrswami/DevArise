import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePersonalization } from '@/hooks/use-personalization';

export function PersonalizedRecommendations() {
  const { recommendations, actions } = usePersonalization();

  const handleRecommendationAction = async (recommendation, action) => {
    if (action === 'complete') {
      await actions.updateRecommendation(recommendation.id, 'completed');
    } else if (action === 'dismiss') {
      await actions.updateRecommendation(recommendation.id, 'dismissed');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 5: return 'bg-red-500';
      case 4: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'problem': return '🧩';
      case 'interview': return '🎤';
      case 'tutorial': return '📚';
      case 'contest': return '🏆';
      case 'revision': return '🔄';
      default: return '💡';
    }
  };

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No recommendations available. Complete more activities to get personalized suggestions!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💡 Personalized Recommendations
          <Badge variant="secondary">{recommendations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTypeIcon(rec.type)}</span>
                <div>
                  <h4 className="font-semibold">{rec.title}</h4>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
              </div>
              <Badge className={getPriorityColor(rec.priority)}>
                Priority {rec.priority}
              </Badge>
            </div>

            {rec.reason && (
              <p className="text-sm text-gray-500">
                <strong>Why:</strong> {rec.reason}
              </p>
            )}

            {rec.expectedBenefit && (
              <p className="text-sm text-green-600">
                <strong>Benefit:</strong> {rec.expectedBenefit}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleRecommendationAction(rec, 'complete')}
              >
                Mark Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRecommendationAction(rec, 'dismiss')}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ))}

        <Button
          onClick={actions.generateRecommendations}
          className="w-full"
          variant="outline"
        >
          🔄 Generate New Recommendations
        </Button>
      </CardContent>
    </Card>
  );
}

export function NextBestAction() {
  const { nextAction, actions } = usePersonalization();

  if (!nextAction) {
    return null;
  }

  const getActionIcon = (type) => {
    switch (type) {
      case 'recommendation': return '🎯';
      case 'goal_progress': return '🎯';
      case 'general': return '💡';
      default: return '🚀';
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getActionIcon(nextAction.type)} Next Best Action
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold text-lg">{nextAction.action.title}</h3>
        <p className="text-gray-600 mb-4">{nextAction.action.description}</p>
        <Button onClick={() => actions.getNextAction()}>
          Get Another Suggestion
        </Button>
      </CardContent>
    </Card>
  );
}

export function UserInsights() {
  const { insights, actions } = usePersonalization();

  const unreadInsights = insights.filter(i => !i.isRead);

  const handleMarkRead = async (id) => {
    await actions.markInsightRead(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Your Insights
          {unreadInsights.length > 0 && (
            <Badge variant="destructive">{unreadInsights.length} new</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <p className="text-gray-500">No insights available yet. Keep using the platform to generate insights!</p>
        ) : (
          insights.map((insight) => (
            <div key={insight.id} className={`border rounded-lg p-4 ${!insight.isRead ? 'bg-blue-50 border-blue-200' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{insight.title}</h4>
                {!insight.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkRead(insight.id)}
                  >
                    Mark Read
                  </Button>
                )}
              </div>
              <p className="text-gray-700 mb-3">{insight.content}</p>

              {insight.recommendations && insight.recommendations.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm mb-1">Recommendations:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {insight.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span>•</span> {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}

        <Button
          onClick={() => actions.generateInsights('weekly_summary')}
          className="w-full"
          variant="outline"
        >
          📈 Generate Weekly Summary
        </Button>
      </CardContent>
    </Card>
  );
}
