"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Star, 
  Coins, 
  TrendingUp, 
  ShieldCheck, 
  History, 
  ShoppingBag, 
  Zap,
  ArrowUpRight,
  Award,
  Crown,
  Lock,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";

export default function RewardsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/rewards/stats");
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast.error("Failed to sync rewards data");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (itemId) => {
    setRedeeming(itemId);
    try {
      // Logic for redemption API call
      toast.success("Reward unlocked successfully!");
      fetchStats();
    } catch (err) {
      toast.error("Insufficient points");
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center">
         <Loader2 className="h-10 w-10 animate-spin text-violet-500 mb-4" />
         <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Syncing Rewards Hub...</p>
      </div>
    );
  }

  const expProgress = (data.exp / data.nextLevelExp) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 pt-32">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-8">
           <div className="space-y-4">
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-1 rounded-xl">Elite Tier Participant</Badge>
              <h1 className="text-5xl font-black tracking-tight leading-tight">
                Rewards <span className="text-amber-500">& Recognition</span>
              </h1>
              <p className="text-slate-500 max-w-xl">Every mission completed brings you closer to legendary status. Earn points, level up, and unlock premium AI guidance.</p>
           </div>
           <div className="flex gap-4">
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-[32px] text-center min-w-[160px] relative overflow-hidden group">
                 <Coins className="h-4 w-4 text-amber-500 absolute top-4 right-4 opacity-50 group-hover:scale-125 transition-transform" />
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Available Arise Points</p>
                 <p className="text-4xl font-black text-white">{data.points}</p>
              </div>
              <div className="p-6 bg-violet-600 border border-violet-500 rounded-[32px] text-center min-w-[160px] relative overflow-hidden group shadow-xl shadow-violet-900/20">
                 <Zap className="h-4 w-4 text-white absolute top-4 right-4 opacity-50" />
                 <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Current XP Level</p>
                 <p className="text-4xl font-black text-white">Lvl {data.level}</p>
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* Left Column: Progress & History */}
           <div className="lg:col-span-2 space-y-10">
              <Card className="bg-slate-900/40 border border-slate-800 rounded-[40px] p-10 overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-10 opacity-5">
                    <TrendingUp className="h-32 w-32 text-white" />
                 </div>
                 <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-end">
                       <h3 className="text-2xl font-black flex items-center gap-3">
                          <Zap className="h-6 w-6 text-violet-500" /> Mastery Progress
                       </h3>
                       <span className="text-sm font-bold text-slate-500">{data.exp} / {data.nextLevelExp} XP to Level {data.level + 1}</span>
                    </div>
                    <div className="space-y-4">
                       <Progress value={expProgress} className="h-4 bg-slate-800" />
                       <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <span>Novice</span>
                          <span>Intermediate</span>
                          <span>Expert</span>
                          <span className="text-violet-500">Legendary</span>
                       </div>
                    </div>
                 </div>
              </Card>

              <div>
                 <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                   <History className="h-5 w-5 text-slate-500" /> Recent Activities
                 </h3>
                 <div className="space-y-3">
                    {data.transactions.map((t, idx) => (
                      <motion.div 
                        key={t.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-5 bg-slate-900/30 border border-slate-800 rounded-2xl hover:bg-slate-900/50 transition-colors"
                      >
                         <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${t.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                               {t.amount > 0 ? <Zap className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                            </div>
                            <div>
                               <p className="text-sm font-black">{t.reason}</p>
                               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(t.createdAt).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <p className={`font-black ${t.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {t.amount > 0 ? '+' : ''}{t.amount} PTS
                         </p>
                      </motion.div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Right Column: Points Store */}
           <div className="space-y-8">
              <Card className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 overflow-hidden">
                 <header className="mb-8">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                       <ShoppingBag className="h-6 w-6 text-amber-500" /> Points Store
                    </h3>
                    <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-widest">Exchange points for power</p>
                 </header>
                 
                 <div className="space-y-4">
                    {[
                      { id: '1', title: 'Unlock Premium DSA', cost: 1500, icon: <Trophy className="text-violet-400" /> },
                      { id: '2', title: 'AI Mock Interview Set', cost: 500, icon: <Star className="text-amber-400" /> },
                      { id: '3', title: 'Exclusive System Design', cost: 2000, icon: <Crown className="text-blue-400" /> },
                      { id: '4', title: 'No-Limit AI Tutor', cost: 3500, icon: <ShieldCheck className="text-emerald-400" /> }
                    ].map((item) => {
                      const canAfford = data.points >= item.cost;
                      return (
                        <div key={item.id} className={`p-5 rounded-3xl border transition-all ${canAfford ? 'bg-slate-950 border-slate-800 hover:border-violet-500/50' : 'bg-slate-900/50 border-transparent opacity-60'}`}>
                           <div className="flex items-center justify-between mb-4">
                              <div className="h-10 w-10 bg-white/5 rounded-2xl flex items-center justify-center">
                                 {item.icon}
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-slate-500 uppercase mb-1">COST</p>
                                 <p className="text-sm font-black text-amber-500">{item.cost} PTS</p>
                              </div>
                           </div>
                           <h4 className="font-black text-white mb-4">{item.title}</h4>
                           <Button 
                             disabled={!canAfford || redeeming === item.id}
                             onClick={() => handleRedeem(item.id)}
                             className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${canAfford ? 'bg-slate-800 hover:bg-violet-600' : 'bg-slate-900 border-slate-800'}`}
                           >
                              {redeeming === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : canAfford ? 'Purchase Reward' : <><Lock className="h-3 w-3 mr-2" /> Locked</>}
                           </Button>
                        </div>
                      )
                    })}
                 </div>
              </Card>

              {/* Badges Section */}
              <div className="p-8 bg-indigo-600/10 border border-indigo-600/20 rounded-[40px]">
                 <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest mb-6 flex items-center justify-between">
                    Your Badges
                    <span className="text-[10px] text-slate-500 font-bold">{data.badges.length} Unlocked</span>
                 </h4>
                 <div className="flex flex-wrap gap-4">
                    {data.badges.length > 0 ? data.badges.map(b => (
                       <div key={b.id} className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group relative cursor-help">
                          <span className="text-2xl group-hover:scale-125 transition-transform">{b.icon || '🏆'}</span>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-800 rounded-lg text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                             {b.title}
                          </div>
                       </div>
                    )) : (
                      <p className="text-xs italic text-slate-600">Start your first mission to earn badges</p>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
