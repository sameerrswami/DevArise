"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Brain,
  Code2,
  Map,
  Rocket,
  Users,
  Briefcase,
  Target,
  BookOpen,
  MessageSquare,
  LayoutDashboard,
  Trophy,
  ChevronDown,
  Zap,
  ShieldAlert,
  LogOut,
  User,
  Flame,
  Search,
  Menu,
  X,
  Star,
  Layers,
  FileText,
  Cpu,
  GraduationCap
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const NAV_GROUPS = [
  {
    label: "Practice",
    icon: <Code2 className="h-4 w-4" />,
    items: [
      { label: "Coding Problems", href: "/problems", icon: <Code2 className="h-4 w-4" />, desc: "DSA & problem solving" },
      { label: "Code Mentor (AI)", href: "/code-mentor", icon: <Brain className="h-4 w-4" />, desc: "Line-by-line code analysis", badge: "AI" },
      { label: "Contests", href: "/contests", icon: <Trophy className="h-4 w-4" />, desc: "Compete & rank up" },
      { label: "Skill Assessment", href: "/assessment", icon: <Target className="h-4 w-4" />, desc: "Test your knowledge" },
    ]
  },
  {
    label: "AI Career",
    icon: <Rocket className="h-4 w-4" />,
    items: [
      { label: "AI Interviewer", href: "/interviewer", icon: <Users className="h-4 w-4" />, desc: "Mock tech interviews", badge: "AI" },
      { label: "Placement Roadmap", href: "/roadmap", icon: <Map className="h-4 w-4" />, desc: "Week-by-week career plan", badge: "AI" },
      { label: "Project Architect", href: "/projects", icon: <Rocket className="h-4 w-4" />, desc: "Portfolio-building projects", badge: "AI" },
      { label: "Resume Analyzer", href: "/resume", icon: <FileText className="h-4 w-4" />, desc: "AI resume optimization" },
    ]
  },
  {
    label: "Learn",
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      { label: "AI Tutor", href: "/tutor", icon: <GraduationCap className="h-4 w-4" />, desc: "Deep-dive learning sessions", badge: "AI" },
      { label: "AI Buddy", href: "/assistant", icon: <MessageSquare className="h-4 w-4" />, desc: "Casual study companion", badge: "AI" },
      { label: "Learning Tracks", href: "/learn", icon: <Layers className="h-4 w-4" />, desc: "Structured video courses" },
      { label: "Job Board", href: "/jobs", icon: <Briefcase className="h-4 w-4" />, desc: "Tech opportunities" },
    ]
  },
];

export function Navbar({ showBackButton = false, showAuthButtons = true, isAuthenticated = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [points, setPoints] = useState(0);
  const [role, setRole] = useState("user");
  const [streak, setStreak] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
      const handleScroll = () => setScrolled(window.scrollY > 10);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && mounted) {
      fetch("/api/user/profile", { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d) {
            setPoints(d.user?.points || 0);
            setRole(d.user?.role || "user");
            setStreak(d.user?.streak || 0);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, mounted]);

  if (!mounted) return (
    <header className="h-16 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50 flex items-center px-6">
      <div className="flex items-center gap-3 flex-1">
        <div className="h-10 w-10 bg-muted rounded-xl animate-pulse" />
        <div className="h-6 w-32 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-muted rounded-xl animate-pulse" />
        <div className="h-8 w-32 bg-muted rounded-xl animate-pulse" />
      </div>
    </header>
  );

  return (
    <>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/85 backdrop-blur-2xl border-b border-border/60 shadow-lg shadow-black/5"
            : "bg-background/60 backdrop-blur-xl border-b border-border/40"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="relative h-8 w-8">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 animate-pulse-glow" />
                <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Cpu className="h-4 w-4 text-white" />
                </div>
              </div>
              <span className="text-lg font-black tracking-tight group-hover:gradient-text transition-all duration-300">
                DevArise <span className="text-primary">AI</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            {isAuthenticated && showAuthButtons && (
              <nav className="hidden lg:flex items-center gap-1">
                {NAV_GROUPS.map((group) => (
                  <DropdownMenu key={group.label}>
                    <DropdownMenuTrigger asChild>
                      <button className="nav-pill group">
                        {group.icon}
                        <span>{group.label}</span>
                        <ChevronDown className="h-3 w-3 opacity-50 group-data-[state=open]:rotate-180 transition-transform duration-200" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className="w-64 p-2 rounded-2xl border-border/60 shadow-2xl shadow-black/20 glass-card"
                    >
                      <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 pb-2">
                        {group.label}
                      </DropdownMenuLabel>
                      {group.items.map((item) => (
                        <DropdownMenuItem key={item.href} asChild className="rounded-xl p-0 focus:bg-transparent">
                          <Link
                            href={item.href}
                            className={`flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 hover:bg-primary/8 group/item ${
                              pathname === item.href ? "bg-primary/10 text-primary" : ""
                            }`}
                          >
                            <div className={`mt-0.5 p-1.5 rounded-lg transition-colors ${
                              pathname === item.href
                                ? "bg-primary/20 text-primary"
                                : "bg-secondary text-muted-foreground group-hover/item:bg-primary/15 group-hover/item:text-primary"
                            }`}>
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{item.label}</span>
                                {item.badge && (
                                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}

                <Link href="/dashboard" className={`nav-pill ${pathname === "/dashboard" ? "text-primary bg-primary/10 border-primary/20" : ""}`}>
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </nav>
            )}

            {/* Right slot */}
            {showAuthButtons && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {isAuthenticated ? (
                  <>
                    {/* Streak */}
                    {streak > 0 && (
                      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-bold">
                        <Flame className="h-3.5 w-3.5 fill-current" />
                        {streak}
                      </div>
                    )}

                    {/* Points */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {points.toLocaleString()}
                    </div>

                    {/* Admin Badge */}
                    {role === "admin" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="hidden sm:flex gap-1.5 rounded-xl h-8"
                        onClick={() => router.push("/admin")}
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Admin
                      </Button>
                    )}

                    <ThemeToggle />

                    {/* User menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black hover:scale-105 transition-transform shadow-md">
                          <User className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-2xl glass-card border-border/60 p-2">
                        <div className="px-3 py-2 mb-1">
                          <p className="text-xs text-muted-foreground">Signed in as</p>
                          <p className="text-sm font-bold truncate">Your Account</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="rounded-xl">
                          <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                            <LayoutDashboard className="h-4 w-4" /> Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl">
                          <Link href="/resume" className="flex items-center gap-2 cursor-pointer">
                            <User className="h-4 w-4" /> Profile & Resume
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="rounded-xl text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => signOut({ callbackUrl: "/" })}
                        >
                          <LogOut className="h-4 w-4 mr-2" /> Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile hamburger */}
                    <button
                      className="lg:hidden h-8 w-8 rounded-xl border border-border flex items-center justify-center"
                      onClick={() => setMobileOpen(!mobileOpen)}
                    >
                      {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                  </>
                ) : (
                  <>
                    <ThemeToggle />
                    <Button
                      size="sm"
                      onClick={() => router.push("/auth/signin")}
                      className="rounded-xl h-9 px-5 font-semibold btn-glow"
                    >
                      Sign In <Zap className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden sticky top-16 z-40 border-b border-border/60 glass overflow-hidden"
          >
            <div className="max-w-[1400px] mx-auto px-4 py-4 grid grid-cols-2 gap-2">
              {NAV_GROUPS.flatMap(g => g.items).map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold transition-all ${
                    pathname === item.href
                      ? "bg-primary/10 border-primary/25 text-primary"
                      : "border-border bg-card hover:border-primary/20 hover:bg-primary/5"
                  }`}
                >
                  <span className="opacity-70">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card text-sm font-semibold col-span-2"
              >
                <LayoutDashboard className="h-4 w-4 opacity-70" />
                Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
