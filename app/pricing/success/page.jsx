"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  PartyPopper, 
  ArrowRight, 
  Sparkles,
  Zap,
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Add any post-payment logic here (e.g. tracking)
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background celebration logic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-2xl border border-emerald-500/20 rounded-[40px] p-10 text-center relative z-10 shadow-2xl shadow-emerald-900/10"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative inline-block mb-8"
        >
          <div className="h-24 w-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto relative z-10">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl" 
          />
          <PartyPopper className="absolute -top-2 -right-4 h-8 w-8 text-amber-400 -rotate-12 animate-bounce" />
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-4">Welcome to Premium</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-10">
          Your payment was successful. Your account has been upgraded to <span className="text-emerald-400 font-bold">Pro Elite</span>. You now have full access to all AI features and tools.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-10">
           <div className="p-4 rounded-3xl bg-slate-800/50 border border-slate-700/50 text-left">
              <Zap className="h-5 w-5 text-amber-400 mb-2" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
              <p className="text-sm font-bold text-white">Active Now</p>
           </div>
           <div className="p-4 rounded-3xl bg-slate-800/50 border border-slate-700/50 text-left">
              <ShieldCheck className="h-5 w-5 text-blue-400 mb-2" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Validity</p>
              <p className="text-sm font-bold text-white">Pro Plan</p>
           </div>
        </div>

        <div className="space-y-3">
          <Link 
            href="/dashboard"
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 group"
          >
            Explore Dashboard <LayoutDashboard className="h-4 w-4" />
          </Link>
          <button 
           onClick={() => router.back()}
           className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold rounded-2xl transition"
          >
            Return
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
           <Sparkles className="h-3 w-3" />
           Unlock your potential
        </div>
      </motion.div>
    </div>
  );
}
