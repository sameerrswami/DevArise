'use client';

/**
 * RATING PROFILE COMPONENT
 * 
 * Displays user's comprehensive coding rating profile
 * Shows:
 * - Current rating and tier
 * - Battle statistics
 * - Skill levels by difficulty
 * - Leaderboard rank
 * - Recent battles
 * - Win streak information
 */

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, Trophy, Zap, Target } from 'lucide-react';

const TIER_COLORS = {
  bronze: 'text-amber-700 bg-amber-50',
  silver: 'text-slate-700 bg-slate-50',
  gold: 'text-yellow-700 bg-yellow-50',
  platinum: 'text-blue-700 bg-blue-50',
  diamond: 'text-purple-700 bg-purple-50',
};

const TIER_ICONS = {
  bronze: '🥉',
  silver: '⚪',
  gold: '🟡',
  platinum: '💎',
  diamond: '💜',
};

export default function RatingProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch user rating profile
   */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/coding-rating');
        const data = await response.json();

        if (!data.success) {
          setError(data.error);
          return;
        }

        setProfile(data.data);
      } catch (err) {
        console.error('Fetch profile error:', err);
        setError('Failed to load rating profile');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session?.user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading rating profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Alert variant="destructive">{error}</Alert>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Alert>No profile data available</Alert>
      </div>
    );
  }

  const tierColor = TIER_COLORS[profile.rating.tier];
  const tierIcon = TIER_ICONS[profile.rating.tier];

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-6 mb-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profile.userImage} alt={profile.userName} />
            <AvatarFallback className="text-2xl">
              {profile.userName?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-3xl font-bold mb-2">{profile.userName}</h1>
            <p className="text-gray-600 mb-4">{profile.userId}</p>

            {/* Tier Badge */}
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-lg ${tierColor}`}>
                <p className="text-sm font-semibold capitalize">
                  {tierIcon} {profile.rating.tier} • Level {profile.rating.level}
                </p>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {profile.rating.current} rating
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
          <p className="text-sm text-gray-600">Global Rank</p>
          <p className="text-3xl font-bold">#{profile.leaderboardRank?.global}</p>
          <p className="text-xs text-gray-500 mt-2">
            of {profile.leaderboardRank?.totalPlayers} players
          </p>
        </Card>

        <Card className="p-6 text-center">
          <Zap className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <p className="text-sm text-gray-600">Current Streak</p>
          <p className="text-3xl font-bold">{profile.statistics?.currentWinStreak}</p>
          <p className="text-xs text-gray-500 mt-2">
            Best: {profile.statistics?.longestWinStreak}
          </p>
        </Card>

        <Card className="p-6 text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="text-sm text-gray-600">Win Rate</p>
          <p className="text-3xl font-bold">{profile.statistics?.winRate}%</p>
          <p className="text-xs text-gray-500 mt-2">
            {profile.statistics?.battlesWon}W-{profile.statistics?.battlesLost}
            L
          </p>
        </Card>

        <Card className="p-6 text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Rating Change</p>
          <p
            className={`text-3xl font-bold ${
              profile.rating.change >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {profile.rating.change >= 0 ? '+' : ''}{profile.rating.change}
          </p>
          <p className="text-xs text-gray-500 mt-2">Best: {profile.rating.best}</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="statistics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="skills">Skill Levels</TabsTrigger>
          <TabsTrigger value="recent">Recent Battles</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="mt-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Battle Statistics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Battles</p>
                <p className="text-3xl font-bold">
                  {profile.statistics?.battlesParticipated}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Wins</p>
                <p className="text-3xl font-bold text-green-600">
                  {profile.statistics?.battlesWon}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Losses</p>
                <p className="text-3xl font-bold text-red-600">
                  {profile.statistics?.battlesLost}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Draws</p>
                <p className="text-3xl font-bold">
                  {profile.statistics?.battlesDraw || 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Performance Overview</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm text-gray-600">Win Rate</p>
                      <p className="font-semibold">{profile.statistics?.winRate}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${profile.statistics?.winRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Achievements</h3>
                <ul className="space-y-2">
                  {profile.statistics?.longestWinStreak >= 5 && (
                    <li className="text-sm">
                      🔥 {profile.statistics.longestWinStreak}-game win streak
                    </li>
                  )}
                  {profile.statistics?.battlesParticipated >= 10 && (
                    <li className="text-sm">⭐ 10+ battles completed</li>
                  )}
                  {profile.statistics?.battlesWon >= profile.statistics?.battlesLost && (
                    <li className="text-sm">📈 Positive win-loss record</li>
                  )}
                  {profile.leaderboardRank?.global <= 100 && (
                    <li className="text-sm">🏆 Top 100 player</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-2">Points Earned</p>
              <p className="text-4xl font-bold text-purple-600">
                {profile.statistics?.totalPointsEarned || 0}
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="mt-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Skill Levels by Difficulty</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['easy', 'medium', 'hard'].map((difficulty) => {
                const rating = profile.skillLevels?.[difficulty] || 1200;
                const tier = getTierFromRating(rating);

                return (
                  <Card key={difficulty} className="p-6 bg-gray-50">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2 capitalize">
                        {difficulty} Problems
                      </p>
                      <p className="text-4xl font-bold mb-2">{rating}</p>
                      <Badge className={`${tierColor} border-0`}>
                        {tier}
                      </Badge>

                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-gray-500">
                          {difficulty === 'easy'
                            ? 'Foundation Skills'
                            : difficulty === 'medium'
                            ? 'Intermediate Techniques'
                            : 'Advanced Algorithms'}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Recent Battles Tab */}
        <TabsContent value="recent" className="mt-4">
          <Card className="overflow-hidden">
            {profile.recentBattles && profile.recentBattles.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-4 px-6 font-semibold">Problem</th>
                    <th className="text-center py-4 px-6 font-semibold">Rank</th>
                    <th className="text-center py-4 px-6 font-semibold">Score</th>
                    <th className="text-center py-4 px-6 font-semibold">
                      Rating Change
                    </th>
                    <th className="text-center py-4 px-6 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.recentBattles.map((battle, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-6 font-semibold">
                        {battle.problemTitle}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge variant="outline">#{battle.rank}</Badge>
                      </td>
                      <td className="py-4 px-6 text-center font-bold">
                        {battle.score}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`font-semibold ${
                            battle.ratingChange >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {battle.ratingChange >= 0 ? '+' : ''}
                          {battle.ratingChange}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-600">
                        {new Date(battle.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No recent battles found
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Activity Timeline</h2>

            <div className="space-y-4">
              {profile.activity?.firstBattleAt && (
                <div className="flex gap-4">
                  <div className="w-32 text-sm text-gray-600">First Battle</div>
                  <div className="font-semibold">
                    {new Date(profile.activity.firstBattleAt).toLocaleDateString()}
                  </div>
                </div>
              )}

              {profile.activity?.lastBattleAt && (
                <div className="flex gap-4">
                  <div className="w-32 text-sm text-gray-600">Last Battle</div>
                  <div className="font-semibold">
                    {new Date(profile.activity.lastBattleAt).toLocaleDateString()}
                  </div>
                </div>
              )}

              {profile.activity?.lastBattleAt && (
                <div className="flex gap-4">
                  <div className="w-32 text-sm text-gray-600">Days Active</div>
                  <div className="font-semibold">
                    {Math.floor(
                      (new Date() - new Date(profile.activity.firstBattleAt)) /
                      (1000 * 60 * 60 * 24)
                    )}{' '}
                    days
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Helper function to get tier from rating
 */
function getTierFromRating(rating) {
  if (rating < 1400) return 'bronze';
  if (rating < 1700) return 'silver';
  if (rating < 2000) return 'gold';
  if (rating < 2400) return 'platinum';
  return 'diamond';
}
