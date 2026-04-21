"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Code2,
  Trophy,
  Briefcase,
  ShieldAlert,
  Settings,
  BarChart3,
  Loader2,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  LogOut,
  Shield,
  TrendingUp,
  Zap,
  Activity,
  MessageSquareWarning,
  FileText,
  GitBranch,
} from "lucide-react";

import { UserManagementDashboard }    from "@/components/admin/user-management";
import { ContentManagementDashboard } from "@/components/admin/content-management";
import { ContestManagementDashboard } from "@/components/admin/contest-management";
import { JobManagementDashboard }     from "@/components/admin/job-management";
import { ModerationDashboard }        from "@/components/admin/moderation";
import { AnalyticsDashboard }         from "@/components/admin/analytics-dashboard";
import { SystemSettingsDashboard }    from "@/components/admin/system-settings";

/* ─── Nav config ────────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    group: "Overview",
    items: [
      { id: "overview",  label: "Command Center",  icon: LayoutDashboard, color: "text-violet-400" },
      { id: "analytics", label: "Analytics",       icon: BarChart3,       color: "text-blue-400"   },
    ],
  },
  {
    group: "Management",
    items: [
      { id: "users",    label: "Users",    icon: Users,   color: "text-cyan-400"   },
      { id: "content",  label: "Content",  icon: Code2,   color: "text-emerald-400" },
      { id: "contests", label: "Contests", icon: Trophy,  color: "text-amber-400"  },
      { id: "jobs",     label: "Jobs",     icon: Briefcase, color: "text-pink-400" },
    ],
  },
  {
    group: "Moderation",
    items: [
      { id: "moderation", label: "Reports", icon: MessageSquareWarning, color: "text-red-400" },
    ],
  },
  {
    group: "System",
    items: [
      { id: "settings", label: "Settings", icon: Settings, color: "text-slate-400" },
    ],
  },
];

/* ─── Mock overview stats ────────────────────────────────────── */
const MOCK_STATS = {
  usersCount:     12847,
  jobsCount:      384,
  playlistsCount: 2190,
  activeContests: 3,
  pendingReports: 12,
  uptime:         "99.7%",
};

const MOCK_RECENT_USERS = [
  { id: "1", name: "Arjun Sharma",   email: "arjun@example.com",   role: "user",  points: 2340, createdAt: "2026-04-19", status: "active",   emailVerified: true  },
  { id: "2", name: "Priya Patel",    email: "priya@example.com",   role: "user",  points: 1870, createdAt: "2026-04-18", status: "active",   emailVerified: true  },
  { id: "3", name: "Rohan Mehta",    email: "rohan@example.com",   role: "user",  points: 980,  createdAt: "2026-04-17", status: "suspended",emailVerified: false },
  { id: "4", name: "Sneha Joshi",    email: "sneha@example.com",   role: "admin", points: 5600, createdAt: "2026-04-16", status: "active",   emailVerified: true  },
  { id: "5", name: "Aditya Kumar",   email: "aditya@example.com",  role: "user",  points: 320,  createdAt: "2026-04-15", status: "active",   emailVerified: false },
  { id: "6", name: "Kavya Reddy",    email: "kavya@example.com",   role: "user",  points: 4120, createdAt: "2026-04-14", status: "active",   emailVerified: true  },
];

const MOCK_ACTIVITY = [
  { type: "user",    msg: "New user registered: Arjun Sharma",      time: "2 min ago",  color: "bg-blue-500"    },
  { type: "contest", msg: "Contest 'Spring Sprint' went live",       time: "15 min ago", color: "bg-violet-500"  },
  { type: "report",  msg: "New community report flagged",            time: "32 min ago", color: "bg-red-500"     },
  { type: "system",  msg: "API latency spike — resolved",            time: "1 h ago",    color: "bg-amber-500"   },
  { type: "content", msg: "Problem 'Graph Coloring' approved",       time: "2 h ago",    color: "bg-emerald-500" },
  { type: "job",     msg: "Job listing verified: Google SWE",        time: "3 h ago",    color: "bg-pink-500"    },
];

/* ─── Stat Quick Card ────────────────────────────────────────── */
function QuickStat({ label, value, icon: Icon, color, badge }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 overflow-hidden`}
    >
      <div className="absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(ellipse at top right, ${color}, transparent 70%)` }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: `${color}20` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      {badge && (
        <div className="mt-3 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
          <p className="text-[11px] text-slate-500">{badge}</p>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Overview Panel ─────────────────────────────────────────── */
function OverviewPanel({ stats }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <QuickStat label="Total Users"      value={stats.usersCount.toLocaleString()} icon={Users}    color="#7c3aed" badge="+124 this week" />
        <QuickStat label="Active Jobs"      value={stats.jobsCount}                   icon={Briefcase}color="#ec4899" badge="4 pending review" />
        <QuickStat label="Learning Paths"   value={stats.playlistsCount.toLocaleString()} icon={GitBranch} color="#06b6d4" badge="AI generated" />
        <QuickStat label="Live Contests"    value={stats.activeContests}              icon={Trophy}   color="#f59e0b" badge="in progress" />
        <QuickStat label="Open Reports"     value={stats.pendingReports}              icon={ShieldAlert} color="#ef4444" badge="needs action" />
        <QuickStat label="Uptime"           value={stats.uptime}                      icon={Activity} color="#10b981" badge="last 30 days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-700/50 bg-slate-800/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Signups</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest registered platform users</p>
            </div>
            <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="divide-y divide-slate-700/30">
            {MOCK_RECENT_USERS.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-700/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div
                    className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      background: `hsl(${(user.name.charCodeAt(0) * 17) % 360}, 70%, 45%)`,
                    }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    user.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {user.status}
                  </span>
                  <span className="text-xs font-bold text-amber-400 hidden sm:block">
                    {user.points.toLocaleString()} pts
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/40">
            <h3 className="text-sm font-semibold text-white">Activity Feed</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time platform events</p>
          </div>
          <div className="p-3 space-y-2">
            {MOCK_ACTIVITY.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 p-3 rounded-xl hover:bg-slate-700/20 transition-colors"
              >
                <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${a.color}`} />
                <div className="min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed">{a.msg}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{a.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Contest",     icon: Trophy,   color: "#f59e0b", desc: "Create new event" },
            { label: "Verify User",     icon: Shield,   color: "#7c3aed", desc: "Approve signup"   },
            { label: "Post Job",        icon: Briefcase,color: "#ec4899", desc: "Curate listing"   },
            { label: "Review Report",   icon: ShieldAlert, color: "#ef4444", desc: "Pending: 12"  },
          ].map(({ label, icon: Icon, color, desc }) => (
            <motion.button
              key={label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col gap-2 p-4 rounded-xl border border-slate-700/40 hover:border-slate-600/60 bg-slate-900/30 hover:bg-slate-700/20 transition text-left"
            >
              <div className="p-2 w-fit rounded-lg" style={{ background: `${color}18` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────── */
function Sidebar({ active, setActive, collapsed, setCollapsed, session }) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-slate-700/50 bg-slate-900/70 backdrop-blur overflow-hidden z-30"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700/40 min-h-[64px]">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <p className="text-sm font-bold text-white leading-none">DevArise AI</p>
              <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-widest mt-0.5">Admin</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_ITEMS.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-1.5">
                {group.group}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ id, label, icon: Icon, color }) => {
                const isActive = active === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActive(id)}
                    title={collapsed ? label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-violet-600/20 text-white border border-violet-500/25"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/40"
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-violet-400" : color}`} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive && !collapsed && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Info at bottom */}
      {session?.user && (
        <div className="border-t border-slate-700/40 p-3">
          <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-700/30 transition">
            <div
              className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}
            >
              {session.user.name?.charAt(0) || "A"}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden min-w-0 flex-1"
                >
                  <p className="text-xs font-semibold text-white truncate">{session.user.name || "Admin"}</p>
                  <p className="text-[10px] text-slate-500 truncate">{session.user.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

/* ─── Top Bar ────────────────────────────────────────────────── */
function TopBar({ activeLabel, notifications }) {
  return (
    <header className="h-16 border-b border-slate-700/40 bg-slate-900/50 backdrop-blur flex items-center px-6 gap-4 sticky top-0 z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Admin</span>
        <ChevronRight className="h-3 w-3 text-slate-600" />
        <span className="text-white font-semibold">{activeLabel}</span>
      </div>

      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-sm mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search users, content, contests…"
            className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition">
          <Bell className="h-4 w-4" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

/* ─── Main Admin Panel ───────────────────────────────────────── */
export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab]   = useState("overview");
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Use mock data so the panel is always interactive
  const stats = MOCK_STATS;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-2xl border-2 border-violet-500/30 animate-ping" />
          </div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Authenticating admin access…</p>
        </div>
      </div>
    );
  }

  const activeLabel = NAV_ITEMS.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label || "Overview";

  const panels = {
    overview:   <OverviewPanel stats={stats} />,
    analytics:  <AnalyticsDashboard />,
    users:      <UserManagementDashboard />,
    content:    <ContentManagementDashboard />,
    contests:   <ContestManagementDashboard />,
    jobs:       <JobManagementDashboard />,
    moderation: <ModerationDashboard />,
    settings:   <SystemSettingsDashboard />,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block relative z-30">
        <Sidebar
          active={activeTab}
          setActive={setActiveTab}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          session={session}
        />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-[240px] z-50 lg:hidden"
          >
            <Sidebar
              active={activeTab}
              setActive={(tab) => { setActiveTab(tab); setMobileOpen(false); }}
              collapsed={false}
              setCollapsed={() => {}}
              session={session}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden absolute top-4 left-4 z-10 p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300"
        >
          <Menu className="h-4 w-4" />
        </button>

        <TopBar activeLabel={activeLabel} notifications={MOCK_STATS.pendingReports} />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {panels[activeTab] || <OverviewPanel stats={stats} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
