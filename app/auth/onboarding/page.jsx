"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  Briefcase, 
  Target, 
  Loader2,
  Check
} from "lucide-react";

export default function SocialOnboarding() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    academicStatus: "",
    targetRole: "",
    skillLevel: "Beginner"
  });

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.needsOnboarding) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Update session to reflect completion
        await update({
          ...session,
          user: {
            ...session.user,
            academicStatus: formData.academicStatus,
            targetRole: formData.targetRole,
            needsOnboarding: false
          }
        });
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
             <div className="h-14 w-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl mb-4">
                <Sparkles className="text-white h-7 w-7" />
             </div>
             <h1 className="text-2xl font-bold text-white tracking-tight">Finish Setting Up</h1>
             <p className="text-slate-400 mt-2 text-sm">Help us personalize your DevArise experience</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Academic Status</label>
              <div className="relative group">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <select 
                  required
                  value={formData.academicStatus}
                  onChange={(e) => setFormData({...formData, academicStatus: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                >
                  <option value="" className="bg-slate-900">Select Status</option>
                  <option value="BTech" className="bg-slate-900">BTech / BE</option>
                  <option value="BCA" className="bg-slate-900">BCA</option>
                  <option value="BSc IT" className="bg-slate-900">BSc IT / CS</option>
                  <option value="MTech" className="bg-slate-900">MTech / ME</option>
                  <option value="MCA" className="bg-slate-900">MCA</option>
                  <option value="Working Professional" className="bg-slate-900">Working Professional</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Target Role</label>
              <div className="relative group">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <select 
                  required
                  value={formData.targetRole}
                  onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                >
                  <option value="" className="bg-slate-900">Career Goal</option>
                  <option value="Frontend Developer" className="bg-slate-900">Frontend Developer</option>
                  <option value="Backend Developer" className="bg-slate-900">Backend Developer</option>
                  <option value="Full Stack Developer" className="bg-slate-900">Full Stack Developer</option>
                  <option value="Data Scientist" className="bg-slate-900">Data Scientist / AI</option>
                  <option value="DevOps Engineer" className="bg-slate-900">DevOps / Cloud</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Current skill Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({...formData, skillLevel: level})}
                    className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                      formData.skillLevel === level 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Complete Setup <Check className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
