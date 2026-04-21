'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Code2,
  Briefcase,
  Trophy,
  Target,
  Zap,
  Activity,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { AdminStatCard, AdminCard } from './admin-components';

/* ── Mini Bar Chart ── */
function MiniBar({ values = [], color = '#7c3aed' }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.04, duration: 0.4, ease: 'easeOut' }}
          style={{
            height: `${(v / max) * 100}%`,
            backgroundColor: color,
            originY: 1,
            flex: 1,
            borderRadius: '3px 3px 0 0',
            opacity: 0.7 + (i / values.length) * 0.3,
          }}
        />
      ))}
    </div>
  );
}

/* ── Donut Chart ── */
function DonutChart({ segments, size = 100 }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  const r = 36;
  const circ = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rotate-[-90deg]">
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circ;
        const gap  = circ - dash;
        const path = (
          <circle
            key={i}
            cx="50" cy="50" r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ}
            strokeLinecap="butt"
          />
        );
        offset += pct;
        return path;
      })}
    </svg>
  );
}

/* ── Progress Row ── */
function ProgressRow({ label, value, max, color }) {
  const pct = Math.round((value / (max || 1)) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ── Mock analytics data ── */
const generateMockData = () => ({
  kpis: {
    totalUsers: 12847,
    newUsersThisMonth: 1243,
    dailyActiveUsers: 3421,
    weeklyActiveUsers: 7890,
    totalSessions: 48320,
    avgSessionMin: 23,
    placementReadyScore: 76,
    interviewSuccessRate: 68,
  },
  trends: {
    userGrowth: [580, 720, 890, 1040, 980, 1120, 1243],
    sessions: [5200, 6100, 5800, 7200, 8100, 7600, 8900],
    problems: [320, 410, 390, 480, 520, 490, 560],
  },
  featureUsage: [
    { name: 'Coding Practice',   value: 8920, color: '#7c3aed' },
    { name: 'AI Interviewer',    value: 5410, color: '#3b82f6' },
    { name: 'Resume Analyzer',   value: 3870, color: '#06b6d4' },
    { name: 'AI Tutor',          value: 6230, color: '#10b981' },
    { name: 'Job Board',         value: 2190, color: '#f59e0b' },
    { name: 'Roadmap',           value: 4100, color: '#ec4899' },
  ],
  platformHealth: {
    apiUptime: 99.7,
    avgResponseMs: 142,
    errorRate: 0.3,
    totalApiCalls: 289450,
  },
  topProblems: [
    { title: 'Two Sum',                   solves: 4210, difficulty: 'Easy'   },
    { title: 'Longest Substring',          solves: 3180, difficulty: 'Medium' },
    { title: 'Merge Intervals',            solves: 2870, difficulty: 'Medium' },
    { title: 'Binary Tree Level Order',   solves: 2420, difficulty: 'Medium' },
    { title: 'Word Break',                solves: 1930, difficulty: 'Hard'   },
  ],
});

export function AnalyticsDashboard() {
  const [data]    = useState(generateMockData());
  const [period, setPeriod] = useState('7d');

  const { kpis, trends, featureUsage, platformHealth, topProblems } = data;

  const donutSegments = featureUsage.slice(0, 4).map((f) => ({ value: f.value, color: f.color }));
  const featureMax    = Math.max(...featureUsage.map((f) => f.value));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Platform Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time insights into platform performance and user engagement</p>
        </div>
        <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                period === p ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard icon={Users}    label="Total Users"         value={kpis.totalUsers.toLocaleString()}    sub={`+${kpis.newUsersThisMonth} this month`}  color="purple" trend={12} />
        <AdminStatCard icon={Activity} label="Daily Active"        value={kpis.dailyActiveUsers.toLocaleString()} sub="unique users today"                       color="blue"   trend={8}  />
        <AdminStatCard icon={Target}   label="Avg Session"         value={`${kpis.avgSessionMin}m`}             sub="per user"                                color="cyan"   trend={5}  />
        <AdminStatCard icon={Trophy}   label="Interview Success"   value={`${kpis.interviewSuccessRate}%`}     sub="mock interviews passed"                    color="green"  trend={3}  />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* User Growth Chart */}
        <AdminCard title="User Growth" subtitle="New signups per day" className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-3xl font-bold text-white">{kpis.newUsersThisMonth.toLocaleString()}</span>
                <span className="ml-2 text-xs text-emerald-400">↑ 12% vs last period</span>
              </div>
            </div>
            <MiniBar values={trends.userGrowth} color="#7c3aed" />
            <div className="flex justify-between text-[10px] text-slate-600">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-700/40">
            <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Sessions & Problem Solves</p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] text-slate-500 mb-1.5">Daily sessions</p>
                <MiniBar values={trends.sessions} color="#3b82f6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1.5">Problems solved</p>
                <MiniBar values={trends.problems} color="#10b981" />
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Feature Usage Donut */}
        <AdminCard title="Feature Usage" subtitle="Top 4 features">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <DonutChart segments={donutSegments} size={120} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white">{kpis.totalSessions.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500">sessions</span>
              </div>
            </div>
            <div className="w-full space-y-2">
              {featureUsage.slice(0, 4).map((f) => (
                <div key={f.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                    <span className="text-slate-400 truncate max-w-[110px]">{f.name}</span>
                  </div>
                  <span className="text-white font-semibold">{f.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Feature Bars + Health + Top Problems */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* All Feature Usage */}
        <AdminCard title="All Feature Engagement" subtitle="Usage counts across all features">
          <div className="space-y-4 mt-1">
            {featureUsage.map((f) => (
              <ProgressRow key={f.name} label={f.name} value={f.value} max={featureMax} color={f.color} />
            ))}
          </div>
        </AdminCard>

        {/* System Health */}
        <AdminCard title="System Health" subtitle="Live infrastructure metrics">
          <div className="grid grid-cols-2 gap-4 mt-1">
            {[
              { label: 'API Uptime',       value: `${platformHealth.apiUptime}%`,          color: 'text-emerald-400', sub: 'last 30 days' },
              { label: 'Avg Response',     value: `${platformHealth.avgResponseMs}ms`,      color: 'text-blue-400',    sub: 'p50 latency'   },
              { label: 'Error Rate',       value: `${platformHealth.errorRate}%`,            color: 'text-amber-400',   sub: '5xx errors'    },
              { label: 'API Calls',        value: platformHealth.totalApiCalls.toLocaleString(), color: 'text-violet-400', sub: 'this month' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-slate-900/50 border border-slate-700/40 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{m.label}</p>
                <p className={`text-2xl font-bold mt-1 ${m.color}`}>{m.value}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{m.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs text-emerald-400 font-medium">All systems operational</p>
          </div>
        </AdminCard>
      </div>

      {/* Top Problems Table */}
      <AdminCard title="Top Solved Problems" subtitle="Most attempted coding problems this period">
        <div className="overflow-x-auto rounded-xl border border-slate-700/40 mt-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40 bg-slate-900/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Problem</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Difficulty</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Solves</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {topProblems.map((p, i) => (
                <tr key={p.title} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-3 text-slate-200 font-medium">{p.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      p.difficulty === 'Easy'   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      p.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                  'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>{p.difficulty}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-semibold">{p.solves.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

    </motion.div>
  );
}
