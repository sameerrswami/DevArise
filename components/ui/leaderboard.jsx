'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Medal,
  Zap,
  TrendingUp,
  Award,
} from 'lucide-react';
import React from 'react';
import { Badge } from './modern-elements';

/**
 * ModernLeaderboard - Premium leaderboard component with animations
 */
export function ModernLeaderboard({
  entries = [],
  userRank = null,
  onEntryClick = () => {},
  variant = 'default',
  className = '',
}) {
  const getMedalColor = (rank) => {
    if (rank === 1)
      return 'text-yellow-400';
    if (rank === 2)
      return 'text-gray-400';
    if (rank === 3)
      return 'text-orange-400';
    return 'text-foreground/40';
  };

  const getRankBadgeVariant = (rank) => {
    if (rank === 1) return 'rank';
    if (rank <= 3) return 'warning';
    if (rank <= 10) return 'info';
    return 'default';
  };

  return (
    <div
      className={cn(
        'rounded-2xl glass glass-card overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-foreground">
            Leaderboard
          </h3>
        </div>
        <p className="text-xs text-foreground/60">
          Top performers this month
        </p>
      </div>

      {/* Entries */}
      <div className="divide-y divide-white/5">
        {entries.map((entry, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            viewport={{ once: true }}
            whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            onClick={() => onEntryClick(entry)}
            className="px-6 py-4 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Rank */}
              <div className="flex items-center gap-3 min-w-fit">
                <motion.div
                  className={cn(
                    'text-xl font-bold w-8 h-8 flex items-center justify-center',
                    getMedalColor(entry.rank)
                  )}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: idx * 0.05,
                  }}
                >
                  {entry.rank <= 3 ? (
                    <Medal className="w-6 h-6" />
                  ) : (
                    `#${entry.rank}`
                  )}
                </motion.div>

                {/* User Info */}
                <div className="flex items-center gap-3">
                  {entry.avatar && (
                    <motion.img
                      src={entry.avatar}
                      alt={entry.username}
                      className="w-10 h-10 rounded-full border border-white/10"
                      whileHover={{ scale: 1.1 }}
                    />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">
                      {entry.username}
                    </p>
                    <p className="text-xs text-foreground/50">
                      {entry.title}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 ml-auto">
                {entry.score && (
                  <div className="text-right">
                    <p className="text-xs text-foreground/60 mb-1">
                      Score
                    </p>
                    <p className="text-lg font-bold gradient-text">
                      {entry.score.toLocaleString()}
                    </p>
                  </div>
                )}

                {entry.streak && (
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <p className="text-xs text-foreground/60">
                        Streak
                      </p>
                    </div>
                    <p className="text-lg font-bold text-amber-400">
                      {entry.streak}
                    </p>
                  </div>
                )}

                {entry.change && (
                  <Badge
                    variant={
                      entry.change > 0
                        ? 'success'
                        : entry.change < 0
                          ? 'danger'
                          : 'default'
                    }
                    size="sm"
                    className="hidden sm:flex"
                  >
                    {entry.change > 0 ? '↑' : entry.change < 0 ? '↓' : '→'}{' '}
                    {Math.abs(entry.change)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Additional Info */}
            {entry.stats && (
              <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-3">
                {entry.stats.map((stat, statIdx) => (
                  <div
                    key={statIdx}
                    className="text-xs text-foreground/60"
                  >
                    <span className="font-medium text-foreground">
                      {stat.value}
                    </span>{' '}
                    {stat.label}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* User's Rank (if not in top) */}
      {userRank && !entries.find((e) => e.rank === userRank.rank) && (
        <>
          <div className="px-6 py-2 bg-white/5 text-center text-xs text-foreground/50">
            ...
          </div>
          <motion.div
            className="px-6 py-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="text-lg font-bold text-purple-400">
                  #{userRank.rank}
                </div>
                <div className="flex items-center gap-2">
                  {userRank.avatar && (
                    <img
                      src={userRank.avatar}
                      alt={userRank.username}
                      className="w-10 h-10 rounded-full border border-purple-500/50"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">
                      {userRank.username} (You)
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-foreground/60 mb-1">
                  Your Score
                </p>
                <p className="text-lg font-bold gradient-text">
                  {userRank.score.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

/**
 * ProgressRing - Circular progress indicator with animation
 */
export function ProgressRing({
  percentage = 65,
  label = 'Progress',
  icon: Icon,
  size = 'lg',
  color = 'purple',
}) {
  const sizes = {
    sm: { radius: 40, width: 100, height: 100 },
    md: { radius: 50, width: 140, height: 140 },
    lg: { radius: 60, width: 180, height: 180 },
  };

  const colors = {
    purple: 'url(#gradient-purple)',
    blue: 'url(#gradient-blue)',
    cyan: 'url(#gradient-cyan)',
    green: 'url(#gradient-green)',
  };

  const { radius, width, height } = sizes[size];
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <svg
        width={width}
        height={height}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient
            id="gradient-purple"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient
            id="gradient-blue"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient
            id="gradient-cyan"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient
            id="gradient-green"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
        />

        {/* Progress circle */}
        <motion.circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke={colors[color]}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute flex flex-col items-center justify-center">
        {Icon && (
          <Icon className="w-8 h-8 text-purple-400 mb-2" />
        )}
        <p className="text-3xl font-bold text-foreground">
          {Math.round(percentage)}%
        </p>
        <p className="text-xs text-foreground/60">{label}</p>
      </div>
    </motion.div>
  );
}

/**
 * RankBadge - Decorative rank badge
 */
export function RankBadge({ rank, animated = true }) {
  const getRankInfo = (rank) => {
    if (rank === 1)
      return {
        label: '1st',
        icon: '🥇',
        color: 'from-yellow-600 to-yellow-500',
      };
    if (rank === 2)
      return {
        label: '2nd',
        icon: '🥈',
        color: 'from-gray-600 to-gray-400',
      };
    if (rank === 3)
      return {
        label: '3rd',
        icon: '🥉',
        color: 'from-orange-600 to-orange-400',
      };
    return {
      label: `#${rank}`,
      icon: '⭐',
      color: 'from-purple-600 to-blue-500',
    };
  };

  const info = getRankInfo(rank);

  if (animated) {
    return (
      <motion.div
        className={cn(
          'px-3 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r',
          info.color
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        {info.icon} {info.label}
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        'px-3 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r',
        info.color
      )}
    >
      {info.icon} {info.label}
    </div>
  );
}
