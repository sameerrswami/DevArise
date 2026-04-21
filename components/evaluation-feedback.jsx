// components/evaluation-feedback.jsx
// Display comprehensive evaluation feedback

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, TrendingUp, Target, BookOpen } from 'lucide-react';

export default function EvaluationFeedback({ evaluationId, onAction }) {
  const [feedback, setFeedback] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const res = await fetch(`/api/evaluation/feedback/${evaluationId}`);
        if (!res.ok) throw new Error('Failed to load feedback');

        const data = await res.json();
        setEvaluation(data.evaluation);
        setFeedback(data.feedback);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [evaluationId]);

  if (loading) return <div className="p-4 text-center">Loading feedback...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!feedback) return <div className="p-4 text-center">No feedback available</div>;

  const getScoreBadgeVariant = (score) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'outline';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl mb-2">
                {evaluation?.type === 'coding' ? '💻 Coding Evaluation' : '🎤 Interview Evaluation'}
              </CardTitle>
              <CardDescription>{feedback.summary}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">{evaluation?.score}%</div>
              <Badge variant={getScoreBadgeVariant(evaluation?.score)}>
                {evaluation?.performanceLevel}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Key Findings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {feedback.keyFindings?.map((finding, idx) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">{finding}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed">
            {feedback.detailedFeedback}
          </div>
        </CardContent>
      </Card>

      {/* Dimensional Analysis (for interviews) */}
      {evaluation?.type === 'interview' && feedback.dimensionalFeedback && (
        <Card>
          <CardHeader>
            <CardTitle>Dimensional Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(feedback.dimensionalScores || {}).map(([dimension, score]) => (
                <div key={dimension}>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold capitalize">{dimension}</span>
                    <span className="text-sm font-bold">{score.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed sections */}
      <Tabs defaultValue="strengths">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="strengths">Strengths</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="ideal">Ideal Answer</TabsTrigger>
        </TabsList>

        {/* Strengths */}
        <TabsContent value="strengths">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {evaluation?.scoreBreakdown?.strengths?.map((strength, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </div>
                )) || feedback?.topImprovementAreas?.slice(0, 3).map((area, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{area}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Improvements */}
        <TabsContent value="improvements">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {feedback?.topImprovementAreas?.map((area, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{area}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {feedback?.specificLessons?.[idx] || 'Focus on improving this area through practice.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Immediate & Long-term Actions */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>10 Your Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Immediate Actions (Today)</h4>
                  <ul className="space-y-2">
                    {feedback?.immediateActions?.map((action, idx) => (
                      <li key={idx} className="flex gap-2 text-sm">
                        <span className="text-blue-600">→</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Long-term Actions (This Week)</h4>
                  <ul className="space-y-2">
                    {feedback?.longTermActions?.map((action, idx) => (
                      <li key={idx} className="flex gap-2 text-sm">
                        <span className="text-purple-600">→</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ideal Answer / Approach */}
        <TabsContent value="ideal">
          {feedback?.idealApproach && (
            <Card>
              <CardHeader>
                <CardTitle>Ideal Approach</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">What the ideal solution looks like:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
                      {feedback.idealApproach}
                    </div>
                  </div>
                  {feedback?.compareToIdeal && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">How your approach compares:</h4>
                      <div className="bg-blue-50 p-4 rounded-lg text-sm border border-blue-200">
                        {feedback.compareToIdeal}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Motivational Insight */}
      {feedback?.motivationalInsight && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-900">
            <span className="font-semibold">💪 {feedback.motivationalInsight}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Performance Comparison */}
      {evaluation?.trend && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Trend</p>
                <p className="text-lg font-semibold">
                  {evaluation.trend === 'improving' && '📈 Improving'}
                  {evaluation.trend === 'stable' && '➡️ Stable'}
                  {evaluation.trend === 'declining' && '📉 Needs Focus'}
                </p>
              </div>
              {evaluation?.comparedToPrevious !== undefined && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Change from Previous</p>
                  <p className={`text-lg font-semibold ${evaluation.comparedToPrevious > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {evaluation.comparedToPrevious > 0 ? '+' : ''}{evaluation.comparedToPrevious}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={() => onAction?.('share')} variant="outline" className="flex-1">
          Share Feedback
        </Button>
        <Button onClick={() => onAction?.('print')} variant="outline" className="flex-1">
          Print Report
        </Button>
        <Button onClick={() => onAction?.('revisit')} className="flex-1">
          Practice More
        </Button>
      </div>
    </div>
  );
}
