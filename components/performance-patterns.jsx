// components/performance-patterns.jsx
// Display detected patterns and recommendations

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, TrendingDown, BookOpen, Zap, X } from 'lucide-react';

export function PerformancePatterns() {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unresolved');

  useEffect(() => {
    const loadPatterns = async () => {
      try {
        const res = await fetch(`/api/evaluation/patterns?resolved=${filter === 'resolved'}`);
        if (!res.ok) throw new Error('Failed to load patterns');
        const data = await res.json();
        setPatterns(data.patterns);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadPatterns();
  }, [filter]);

  const handleResolvePattern = async (patternId) => {
    try {
      const res = await fetch('/api/evaluation/patterns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patternId, action: 'resolve' }),
      });

      if (res.ok) {
        setPatterns(patterns.filter(p => p.id !== patternId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getSeverityColor = (severity) => {
    return {
      low: 'bg-yellow-50 border-yellow-200',
      medium: 'bg-orange-50 border-orange-200',
      high: 'bg-red-50 border-red-200',
    }[severity] || 'bg-gray-50 border-gray-200';
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      low: 'outline',
      medium: 'secondary',
      high: 'destructive',
    };
    return variants[severity] || 'outline';
  };

  if (loading) return <div className="p-4">Loading patterns...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Performance Patterns</CardTitle>
          <CardDescription>
            Recurring issues detected in your practice. Address these to improve faster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={filter === 'unresolved' ? 'default' : 'outline'}
              onClick={() => setFilter('unresolved')}
              className="text-sm"
            >
              Unresolved
            </Button>
            <Button
              variant={filter === 'resolved' ? 'default' : 'outline'}
              onClick={() => setFilter('resolved')}
              className="text-sm"
            >
              Resolved
            </Button>
          </div>
        </CardContent>
      </Card>

      {patterns.length === 0 ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            {filter === 'resolved'
              ? 'Great work! You\'ve resolved all detected patterns.'
              : 'No patterns detected. Keep practicing!'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {patterns.map((pattern) => (
            <Card key={pattern.id} className={`border-l-4 border-l-${pattern.severity === 'high' ? 'red' : pattern.severity === 'medium' ? 'orange' : 'yellow'}-500 ${getSeverityColor(pattern.severity)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      <CardTitle className="text-base">{pattern.patternType}</CardTitle>
                      <Badge variant={getSeverityBadge(pattern.severity)} className="ml-auto">
                        {pattern.severity} severity
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{pattern.category}</p>
                  </div>
                  {filter !== 'resolved' && (
                    <Button
                      onClick={() => handleResolvePattern(pattern.id)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Description */}
                <div>
                  <p className="text-sm font-semibold mb-1">What it is</p>
                  <p className="text-sm text-gray-700">{pattern.description}</p>
                </div>

                {/* Impact */}
                <div className="grid md:grid-cols-2 gap-4 p-3 bg-white bg-opacity-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Score Impact</p>
                    <p className="text-lg font-semibold text-red-600">-{Math.round(pattern.averageScoreImpact)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Frequency</p>
                    <p className="text-lg font-semibold text-orange-600">{pattern.frequency} times</p>
                  </div>
                </div>

                {/* Common Mistakes */}
                {pattern.commonMistakes?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Common mistakes you've made</p>
                    <ul className="space-y-1">
                      {pattern.commonMistakes.map((mistake, idx) => (
                        <li key={idx} className="text-sm flex gap-2">
                          <span className="text-red-500">•</span>
                          <span>{mistake}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Fix */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-1">How to Fix</p>
                  <p className="text-sm text-blue-800">{pattern.suggestedFix}</p>
                </div>

                {/* Recommended Problems */}
                {pattern.recommendedProblems?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Practice these problems</p>
                    <div className="flex flex-wrap gap-2">
                      {pattern.recommendedProblems.map((prob, idx) => (
                        <Badge key={idx} variant="outline" className="cursor-pointer hover:bg-gray-100">
                          {prob}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resources */}
                {pattern.resourceLinks?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Learn more</p>
                    <div className="space-y-1">
                      {pattern.resourceLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex gap-1 items-center"
                        >
                          <BookOpen className="w-3 h-3" />
                          Read more
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tracking Info */}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Last occurred: {new Date(pattern.lastOccurredAt).toLocaleDateString()}
                  {pattern.resolvedAt && ` • Resolved: ${new Date(pattern.resolvedAt).toLocaleDateString()}`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---

// components/recommendations.jsx
// Display personalized recommendations

export function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('high');

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const priority = filter === 'high' ? 'high' : 'all';
        const res = await fetch(`/api/evaluation/recommendations?priority=${priority}&limit=10`);
        if (!res.ok) throw new Error('Failed to load recommendations');
        const data = await res.json();
        setRecommendations(data.recommendations);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [filter]);

  const handleAction = async (recId, action) => {
    try {
      const res = await fetch('/api/evaluation/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: recId, action }),
      });

      if (res.ok) {
        setRecommendations(recommendations.filter(r => r.id !== recId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 5) return 'bg-red-50 border-red-200';
    if (priority >= 4) return 'bg-orange-50 border-orange-200';
    return 'bg-blue-50 border-blue-200';
  };

  if (loading) return <div className="p-4">Loading recommendations...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
          <CardDescription>
            Based on your recent performance, here's what we recommend focusing on next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filter === 'high' ? 'default' : 'outline'}
              onClick={() => setFilter('high')}
              className="text-sm"
            >
              High Priority
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="text-sm"
            >
              All
            </Button>
          </div>
        </CardContent>
      </Card>

      {recommendations.length === 0 ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            No recommendations at the moment. Keep up your practice!
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className={`${getPriorityColor(rec.priority)}`}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Priority Badge */}
                  <div className="flex-shrink-0">
                    <Badge className="text-lg font-bold px-3 py-1">
                      P{rec.priority}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-base mb-1">{rec.title}</h3>
                      <p className="text-sm text-gray-700">{rec.description}</p>
                    </div>

                    {/* Details */}
                    <div className="grid md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Category</p>
                        <Badge variant="outline">{rec.category}</Badge>
                      </div>
                      {rec.estimatedTime && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Time</p>
                          <p className="font-semibold">{rec.estimatedTime} min</p>
                        </div>
                      )}
                      {rec.expectedScoreIncrease && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Expected Gain</p>
                          <p className="font-semibold text-green-600">+{rec.expectedScoreIncrease}%</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Difficulty</p>
                        <Badge variant="outline">{rec.contentDifficulty || 'medium'}</Badge>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      <p className="text-xs text-gray-600 mb-1">Why this helps</p>
                      <p className="text-gray-800">{rec.reason}</p>
                    </div>

                    {/* Expected Benefit */}
                    <div className="p-2 bg-green-50 rounded border border-green-200 text-sm">
                      <p className="text-xs text-green-700 font-semibold mb-1">Expected Benefit</p>
                      <p className="text-green-900">{rec.expectedBenefit}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleAction(rec.id, 'acted')}
                        className="text-sm flex-1"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Start Now
                      </Button>
                      <Button
                        onClick={() => handleAction(rec.id, 'dismiss')}
                        variant="outline"
                        className="text-sm"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
