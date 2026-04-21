// components/performance-report.jsx
// Display weekly/monthly performance reports

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, Award, Target, Zap, BarChart3, AlertCircle } from 'lucide-react';

export default function PerformanceReport({ reportId, onAction }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const res = await fetch(`/api/evaluation/reports?type=weekly`);
        if (!res.ok) throw new Error('Failed to load report');
        const data = await res.json();
        setReport(data.reports[0]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, []);

  if (loading) return <div className="p-4">Loading report...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!report) return <div className="p-4">No report available</div>;

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <div>
              <CardTitle className="text-3xl mb-2">{report.title}</CardTitle>
              <CardDescription className="text-base">{report.summary}</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {new Date(report.reportPeriodEnd).toLocaleDateString()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Overall Score', value: report.scoringBreakdown?.overall, unit: '%', icon: '📊' },
          { label: 'Problems Solved', value: report.topMetrics?.problemsSolved, unit: '', icon: '💻' },
          { label: 'Interviews', value: report.topMetrics?.interviewsAttempted, unit: '', icon: '🎤' },
          { label: 'Improvement', value: report.topMetrics?.improvement, unit: '%', icon: '📈' },
        ].map((metric, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl mb-1">{metric.icon} {metric.value || 0}{metric.unit}</p>
                <p className="text-xs text-gray-600">{metric.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Report Tabs */}
      <Tabs defaultValue="achievements">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="achievements">
            <Award className="w-4 h-4 mr-1" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="concerns">
            <AlertCircle className="w-4 h-4 mr-1" />
            Concerns
          </TabsTrigger>
          <TabsTrigger value="improvements">
            <TrendingUp className="w-4 h-4 mr-1" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="insights">
            <BarChart3 className="w-4 h-4 mr-1" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="actions">
            <Target className="w-4 h-4 mr-1" />
            Actions
          </TabsTrigger>
        </TabsList>

        {/* Achievements */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Your Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.achievements?.map((achievement, idx) => (
                  <li key={idx} className="flex gap-3 items-start p-3 bg-green-50 rounded-lg">
                    <Badge variant="outline" className="mt-1">✓</Badge>
                    <span className="text-sm">{achievement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Areas of Concern */}
        <TabsContent value="concerns">
          <Card>
            <CardHeader>
              <CardTitle>Areas of Concern</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.areasOfConcern ? (
                  typeof report.areasOfConcern === 'string' ? (
                    <li className="p-4 bg-orange-50 rounded-lg border border-orange-200 text-sm">
                      {report.areasOfConcern}
                    </li>
                  ) : (
                    report.areasOfConcern.map((concern, idx) => (
                      <li key={idx} className="flex gap-3 items-start p-3 bg-orange-50 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                        <span className="text-sm">{concern}</span>
                      </li>
                    ))
                  )
                ) : null}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress */}
        <TabsContent value="improvements">
          <Card>
            <CardHeader>
              <CardTitle>Progress This Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {typeof report.improvements === 'string' 
                      ? report.improvements 
                      : report.improvements?.join(' ')}
                  </p>
                </div>

                {/* Category Scores */}
                <div className="space-y-3 mt-4">
                  {Object.entries(report.scoringBreakdown || {}).map(([category, score]) => (
                    <div key={category}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-semibold capitalize">{category}</span>
                        <span className="text-sm font-bold">{score || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-blue-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${score || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Insights */}
        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.keyInsights?.map((insight, idx) => (
                  <li key={idx} className="flex gap-3 items-start p-3 bg-purple-50 rounded-lg">
                    <Zap className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommended Actions */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-3">Priority Actions</h4>
                <ul className="space-y-2">
                  {report.priorityActions?.map((action, idx) => (
                    <li key={idx} className="flex gap-2 items-start p-2 bg-red-50 rounded border border-red-200">
                      <Badge className="mt-1">P{idx + 1}</Badge>
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold text-sm mb-3">Suggested Content</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {report.suggestedContent?.map((content, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAction?.('view-content', content)}
                      className="text-left p-2 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 text-sm transition"
                    >
                      📚 {content}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Motivational Message */}
      {report.motivationalMessage && (
        <Alert className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <AlertDescription className="text-green-900 font-semibold">
            {report.motivationalMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Next Milestones */}
      {report.nextMilestones?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Your Next Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.nextMilestones.map((milestone, idx) => (
                <li key={idx} className="flex gap-2 items-center p-2 bg-gray-50 rounded">
                  <span className="text-xl">🎯</span>
                  <span className="text-sm">{milestone}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={() => onAction?.('download')} variant="outline" className="flex-1">
          Download PDF
        </Button>
        <Button onClick={() => onAction?.('share')} variant="outline" className="flex-1">
          Share Report
        </Button>
        <Button onClick={() => onAction?.('start-actions')} className="flex-1">
          Start Actions
        </Button>
      </div>
    </div>
  );
}

// ---

// components/benchmark-comparison.jsx
// Display benchmarking and competitive positioning

export function BenchmarkComparison({ userId, onAction }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/evaluation/benchmark');
        if (!res.ok) throw new Error('Failed to load');
        const result = await res.json();
        setData(result.benchmark);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="p-4">Loading benchmarks...</div>;
  if (!data) return <div className="p-4">No benchmark data</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Competitive Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Percentile */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Your Percentile Rank</p>
              <p className="text-5xl font-bold text-blue-600 mb-1">{data.percentileRank?.toFixed(0)}%</p>
              <p className="text-sm font-semibold text-blue-900">{data.percentileLabel}</p>
              <p className="text-xs text-gray-500 mt-2">vs {data.groupSize || '1000'}+ peers</p>
            </div>

            {/* Scores */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">Your Score vs Peer Average</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your Score</span>
                  <span className="font-bold">{data.userScore?.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Group Average</span>
                  <span>{data.groupAvgScore?.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Median Score</span>
                  <span>{data.groupMedianScore?.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Category Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: 'Coding', value: data.codingScoreVsGroup, icon: '💻' },
              { label: 'Interviews', value: data.interviewScoreVsGroup, icon: '🎤' },
            ].map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">{cat.icon} {cat.label}</span>
                  <span className={`text-sm font-bold ${cat.value > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {cat.value > 0 ? '+' : ''}{cat.value?.toFixed(1)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${cat.value > 0 ? 'bg-green-500' : 'bg-orange-500'}`}
                    style={{ width: `${Math.min(Math.abs(cat.value) * 5, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Opportunities */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              ⭐ Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.strengths?.map((s, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span>✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              🎯 Growth Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.opportunities?.map((opp, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span>→</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Improvement Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Improvement Rate vs Peers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600 mb-1">
              {data.improvementRateVsGroup?.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">
              {data.improvementRateVsGroup > 0 ? 'Faster' : 'Slower'} improvement than peer average
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
