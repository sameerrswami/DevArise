'use client';

/**
 * BATTLE LEADERBOARD COMPONENT
 * 
 * Real-time competitive rankings during a battle
 * Shows:
 * - Live rank of each participant
 * - Current score
 * - Problems solved
 * - Submission count
 * - AFK status
 */

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function BattleLeaderboard({ leaderboard = [], currentUserId = null }) {
  const [displayLeaderboard, setDisplayLeaderboard] = useState([]);
  const [animatingRanks, setAnimatingRanks] = useState(new Set());

  /**
   * Update leaderboard with animation
   */
  useEffect(() => {
    if (leaderboard.length === 0) return;

    // Track rank changes for animation
    const newAnimatingRanks = new Set();
    leaderboard.forEach((entry) => {
      const oldEntry = displayLeaderboard.find(
        (e) => e.userId === entry.userId
      );
      if (oldEntry && oldEntry.rank !== entry.rank) {
        newAnimatingRanks.add(entry.userId);
      }
    });

    setDisplayLeaderboard(leaderboard);
    setAnimatingRanks(newAnimatingRanks);

    // Remove animation after 500ms
    const timer = setTimeout(() => {
      setAnimatingRanks(new Set());
    }, 500);

    return () => clearTimeout(timer);
  }, [leaderboard, displayLeaderboard]);

  if (!displayLeaderboard || displayLeaderboard.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No participants yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Live Leaderboard</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Player</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Score</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Solved</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Submissions</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayLeaderboard.map((entry, index) => {
              const isCurrentUser = entry.userId === currentUserId;
              const isAnimating = animatingRanks.has(entry.userId);
              const rowClasses = `
                border-b border-gray-100 transition-all duration-300 ${
                  isAnimating ? 'bg-yellow-50 scale-105' : ''
                } ${isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'}
              `;

              return (
                <tr key={entry.userId} className={rowClasses}>
                  {/* Rank */}
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center">
                      {entry.rank === 1 && (
                        <span className="text-2xl">🥇</span>
                      )}
                      {entry.rank === 2 && (
                        <span className="text-2xl">🥈</span>
                      )}
                      {entry.rank === 3 && (
                        <span className="text-2xl">🥉</span>
                      )}
                      {entry.rank > 3 && (
                        <span className="font-bold text-lg text-gray-700">
                          #{entry.rank}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Player Info */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={entry.userImage}
                          alt={entry.userName}
                        />
                        <AvatarFallback>
                          {entry.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{entry.userName}</p>
                        {isCurrentUser && (
                          <Badge variant="outline" className="mt-1">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-lg text-blue-600">
                      {entry.score || 0}
                    </span>
                  </td>

                  {/* Problems Solved */}
                  <td className="py-4 px-4 text-center">
                    <Badge variant="secondary">
                      {entry.problemsSolved || 0} solved
                    </Badge>
                  </td>

                  {/* Submissions */}
                  <td className="py-4 px-4 text-center">
                    <span className="text-gray-600">
                      {entry.submissionCount || 0}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 text-center">
                    {entry.isAFK ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        🔴 AFK
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        🟢 Active
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600 text-sm">Total Participants</p>
          <p className="text-2xl font-bold">{displayLeaderboard.length}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-sm">Leader Score</p>
          <p className="text-2xl font-bold text-blue-600">
            {displayLeaderboard[0]?.score || 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-sm">Average Score</p>
          <p className="text-2xl font-bold">
            {Math.round(
              displayLeaderboard.reduce((sum, e) => sum + (e.score || 0), 0) /
              displayLeaderboard.length
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}
