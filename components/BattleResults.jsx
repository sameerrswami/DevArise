'use client';

/**
 * BATTLE RESULTS COMPONENT
 * 
 * Displays comprehensive post-battle analysis:
 * - Final standings and rankings
 * - Rating changes
 * - Performance metrics
 * - Plagiarism detection results
 * - Detailed player comparison
 */

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Trophy, TrendingUp, AlertTriangle } from 'lucide-react';

export default function BattleResults({ battleId }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userResult, setUserResult] = useState(null);

  /**
   * Fetch battle results
   */
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/battles/${battleId}/results`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error);
          return;
        }

        setResults(data.data);

        // Find current user's result
        if (session?.user?.id) {
          const userRes = data.data.results.find(
            (r) => r.userId === session.user.id
          );
          setUserResult(userRes);
        }
      } catch (err) {
        console.error('Fetch results error:', err);
        setError('Failed to load battle results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [battleId, session?.user?.id]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading battle results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </Alert>
        <Button onClick={() => router.push('/battles')}>Back to Battles</Button>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <Alert>No results available</Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Battle Complete! 🎉</h1>
        <p className="text-gray-600">
          {results.problemTitle} • {results.difficulty} • {results.totalParticipants} participants
        </p>
      </div>

      {/* User's Personal Result */}
      {userResult && (
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-4">Your Performance</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Final Rank</p>
                  <p className="text-3xl font-bold text-blue-600">#{userResult.rank}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-3xl font-bold">{userResult.score}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="text-3xl font-bold text-green-600">{userResult.accuracy}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Points Earned</p>
                  <p className="text-3xl font-bold text-purple-600">+{userResult.pointsEarned}</p>
                </div>
              </div>
            </div>
            <Trophy className="w-16 h-16 text-yellow-500 flex-shrink-0" />
          </div>

          {/* Rating Change */}
          {userResult.ratingChange !== undefined && (
            <div className="mt-6 pt-6 border-t border-blue-200">
              <h3 className="font-semibold mb-4">Rating Update</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Before</p>
                  <p className="text-lg font-bold">{userResult.ratingBefore}</p>
                </div>
                <div className="flex items-center justify-center">
                  <TrendingUp
                    className={`w-6 h-6 ${
                      userResult.ratingChange >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">After</p>
                  <p className="text-lg font-bold">{userResult.ratingAfter}</p>
                  <p
                    className={`text-sm font-semibold ${
                      userResult.ratingChange >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {userResult.ratingChange >= 0 ? '+' : ''}
                    {userResult.ratingChange}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Summary */}
          {userResult.performanceSummary && (
            <div className="mt-6 pt-6 border-t border-blue-200">
              <h3 className="font-semibold mb-2">Performance Summary</h3>
              <p className="text-gray-700">{userResult.performanceSummary}</p>

              {userResult.keyStrengths && userResult.keyStrengths.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-green-700 mb-2">✓ Strengths</p>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {userResult.keyStrengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {userResult.areasForImprovement &&
                userResult.areasForImprovement.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold text-orange-700 mb-2">
                      📈 Areas for Improvement
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {userResult.areasForImprovement.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </Card>
      )}

      {/* Final Standings */}
      <Tabs defaultValue="standings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="standings">Final Standings</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          {results.plagiarismReport?.flaggedSubmissions &&
            results.plagiarismReport.flaggedSubmissions.length > 0 && (
              <TabsTrigger value="plagiarism">Plagiarism Report</TabsTrigger>
            )}
        </TabsList>

        {/* Standings Tab */}
        <TabsContent value="standings" className="mt-4">
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Player</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">Score</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">Accuracy</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">
                    Rating Change
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">Time Spent</th>
                </tr>
              </thead>
              <tbody>
                {results.results.map((result, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      result.userId === session?.user?.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center">
                        {result.rank === 1 && <span className="text-2xl">🥇</span>}
                        {result.rank === 2 && <span className="text-2xl">🥈</span>}
                        {result.rank === 3 && <span className="text-2xl">🥉</span>}
                        {result.rank > 3 && (
                          <span className="font-bold">#{result.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold">{result.userName}</td>
                    <td className="py-4 px-6 text-center font-bold text-blue-600">
                      {result.score}
                    </td>
                    <td className="py-4 px-6 text-center">{result.accuracy}%</td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`font-semibold ${
                          result.ratingChange >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {result.ratingChange >= 0 ? '+' : ''}
                        {result.ratingChange}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-gray-600">
                      {Math.round(result.totalTimeSpent / 60)}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Total Participants</p>
              <p className="text-3xl font-bold">{results.totalParticipants}</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Total Submissions</p>
              <p className="text-3xl font-bold">{results.totalSubmissions}</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Average Score</p>
              <p className="text-3xl font-bold">{results.averageScore}</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Duration</p>
              <p className="text-3xl font-bold">
                {Math.round(results.duration / 60)}m
              </p>
            </Card>
          </div>

          {results.isRanked && (
            <Card className="mt-4 p-6 bg-purple-50 border-purple-200">
              <Badge className="mb-2 bg-purple-600">Ranked Battle</Badge>
              <p className="text-gray-700">
                This was a ranked battle. Rating changes have been applied to all participants'
                profiles.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Plagiarism Tab */}
        {results.plagiarismReport?.flaggedSubmissions &&
          results.plagiarismReport.flaggedSubmissions.length > 0 && (
            <TabsContent value="plagiarism" className="mt-4">
              <div className="space-y-4">
                {results.plagiarismReport.flaggedSubmissions.map((report, idx) => (
                  <Alert
                    key={idx}
                    variant={
                      report.severity === 'severe'
                        ? 'destructive'
                        : 'default'
                    }
                    className={
                      report.severity === 'severe'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <div>
                      <p className="font-semibold">
                        {report.severity === 'severe'
                          ? '🚨 Severe Plagiarism Detected'
                          : '⚠️ Plagiarism Flagged'}
                      </p>
                      <p className="text-sm mt-2">
                        {report.user1} vs {report.user2}
                      </p>
                      <p className="text-sm">
                        Similarity Score: <strong>{report.similarityScore}%</strong>
                      </p>
                      {report.actionTaken && (
                        <p className="text-sm mt-2">
                          Action: <strong>{report.actionTaken}</strong>
                        </p>
                      )}
                    </div>
                  </Alert>
                ))}
              </div>
            </TabsContent>
          )}
      </Tabs>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 flex-wrap">
        <Button onClick={() => router.push('/battles')}>Back to All Battles</Button>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          View Dashboard
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(`/user/coding-rating`)}
        >
          View Rating Profile
        </Button>
      </div>
    </div>
  );
}
