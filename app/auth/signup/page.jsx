"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  Check, 
  GraduationCap, 
  Target, 
  Sparkles,
  Loader2,
  AlertCircle,
  Briefcase
} from "lucide-react";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    academicStatus: "",
    targetRole: "",
    skillLevel: "Beginner"
  });

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password) {
        setError("Please fill in all basic details");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      setError("");
      setStep(2);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // Success! Now sign them in automatically
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result.error) {
        router.push("/auth/signin?msg=Account created. Please sign in.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="h-14 w-14 bg-gradient-to-br from-violet-600 to-blue-500 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-violet-900/20 mb-4">
            <Sparkles className="text-white h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="text-slate-400 mt-2 text-sm">Join DevArise AI and accelerate your career</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          {/* Progress Indicator */}
          <div className="flex gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'bg-slate-800'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'bg-slate-800'}`} />
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-violet-500 transition-colors" />
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-violet-500 transition-colors" />
                      <input 
                        type="email" 
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-violet-500 transition-colors" />
                      <input 
                        type="password" 
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold rounded-2xl transition shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2 mt-4"
                  >
                    Personalize My Path <ArrowRight className="h-5 w-5" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Academic Status</label>
                    <div className="relative group">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-violet-500 transition-colors" />
                      <select 
                        value={formData.academicStatus}
                        onChange={(e) => setFormData({...formData, academicStatus: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                      >
                        <option value="" className="bg-slate-900">Select Status</option>
                        <option value="BTech" className="bg-slate-900">BTech / BE</option>
                        <option value="BCA" className="bg-slate-900">BCA</option>
                        <option value="BSc IT" className="bg-slate-900">BSc IT / CS</option>
                        <option value="MTech" className="bg-slate-900">MTech / ME</option>
                        <option value="MCA" className="bg-slate-900">MCA</option>
                        <option value="Working Professional" className="bg-slate-900">Working Professional</option>
                        <option value="Other" className="bg-slate-900">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Target Role</label>
                    <div className="relative group">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-violet-500 transition-colors" />
                      <select 
                        value={formData.targetRole}
                        onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                      >
                        <option value="" className="bg-slate-900">Preferred Career Path</option>
                        <option value="Frontend Developer" className="bg-slate-900">Frontend Developer</option>
                        <option value="Backend Developer" className="bg-slate-900">Backend Developer</option>
                        <option value="Full Stack Developer" className="bg-slate-900">Full Stack Developer</option>
                        <option value="Data Scientist" className="bg-slate-900">Data Scientist / AI</option>
                        <option value="Mobile Developer" className="bg-slate-900">Mobile App Developer</option>
                        <option value="DevOps Engineer" className="bg-slate-900">DevOps / Cloud</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Current Skill Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({...formData, skillLevel: level})}
                          className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                            formData.skillLevel === level 
                              ? 'bg-violet-600/20 border-violet-500 text-violet-400' 
                              : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold rounded-2xl transition shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Get Started <Check className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-500 text-xs font-medium"
              >
                <AlertCircle className="h-4 w-4" />
                {error}
              </motion.div>
            )}
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-500">Already have an account? </span>
            <Link href="/auth/signin" className="text-violet-400 font-bold hover:text-violet-300 transition-colors">
              Log in
            </Link>
          </div>
        </div>

        {/* Social Register */}
        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Or join with</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <div className="mt-6">
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => { setLoading(true); signIn('google'); }}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl transition-all shadow-xl disabled:opacity-50"
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
