"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Mail, 
  ArrowLeft, 
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to send reset link");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
             <div className="h-12 w-12 bg-slate-800 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Sparkles className="text-violet-400 h-6 w-6" />
             </div>
             <h1 className="text-2xl font-bold text-white">Reset Password</h1>
             <p className="text-slate-400 mt-2 text-sm">We'll send a secure reset link to your email</p>
          </div>

          {success ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <p className="text-white font-semibold">Check your inbox</p>
                <p className="text-sm text-slate-500">We've sent a password reset link to <span className="text-slate-300 font-medium">{email}</span></p>
              </div>
              <Link 
                href="/auth/signin"
                className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition"
              >
                Return to Login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-violet-500 transition-colors" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-500 text-xs font-medium">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold rounded-2xl transition shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
              </button>

              <Link 
                href="/auth/signin"
                className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
