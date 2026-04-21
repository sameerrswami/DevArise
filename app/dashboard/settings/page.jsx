"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Link as LinkIcon, 
  Unlink, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Lock,
  Globe,
  Settings as SettingsIcon,
  ChevronRight
} from "lucide-react";

const PROVIDERS = [
  { id: 'google',   name: 'Google',   color: 'text-blue-400' },
  { id: 'linkedin', name: 'LinkedIn', color: 'text-sky-500' },
  { id: 'facebook', name: 'Facebook', color: 'text-blue-600' }
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("Profile");

  const [profileData, setProfileData] = useState({
    academicStatus: session?.user?.academicStatus || "",
    targetRole: session?.user?.targetRole || "",
    skillLevel: session?.user?.preparationLevel || "Beginner"
  });

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/auth/accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleUnlink = async (accountId) => {
    setActionLoading(accountId);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/auth/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Account unlinked successfully", type: "success" });
        fetchAccounts();
      } else {
        setMessage({ text: data.message, type: "error" });
      }
    } catch (err) {
      setMessage({ text: "An error occurred", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setActionLoading("profile");
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      if (res.ok) {
        setMessage({ text: "Profile updated successfully", type: "success" });
      }
    } catch (err) {
      setMessage({ text: "Failed to update profile", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const isLinked = (providerId) => accounts.some(a => a.provider === providerId);
  const getAccountId = (providerId) => accounts.find(a => a.provider === providerId)?.id;

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 pt-20">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center gap-4 border-b border-slate-800 pb-8">
          <div className="h-14 w-14 rounded-2xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20">
             <SettingsIcon className="h-7 w-7 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">System Settings</h1>
            <p className="text-slate-500 text-sm mt-1">Personalize your journey and manage security</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-2">
             {['Account', 'Profile', 'Connected Apps', 'Privacy'].map((item) => (
               <button 
                key={item}
                onClick={() => setActiveTab(item)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === item 
                    ? 'bg-violet-600/20 text-violet-400 border border-violet-500/25 shadow-lg shadow-violet-900/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
                }`}
               >
                 {item}
                 <ChevronRight className={`h-4 w-4 opacity-50 transition-transform ${activeTab === item ? 'rotate-90' : ''}`} />
               </button>
             ))}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {message.text && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-medium ${
                  message.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                    : 'bg-red-500/10 border-red-500/50 text-red-400'
                }`}
              >
                {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                {message.text}
              </motion.div>
            )}

            {activeTab === 'Profile' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                   <h2 className="text-xl font-bold text-white mb-6">Personalization</h2>
                   <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Academic Status</label>
                        <select 
                          value={profileData.academicStatus}
                          onChange={(e) => setProfileData({...profileData, academicStatus: e.target.value})}
                          className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white outline-none focus:border-violet-500 transition-all font-bold"
                        >
                          <option value="BTech">BTech / BE</option>
                          <option value="BCA">BCA</option>
                          <option value="BSc IT">BSc IT / CS</option>
                          <option value="Working Professional">Working Professional</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Target Career Role</label>
                        <input 
                          type="text"
                          value={profileData.targetRole}
                          onChange={(e) => setProfileData({...profileData, targetRole: e.target.value})}
                          className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white outline-none focus:border-violet-500 transition-all font-bold"
                          placeholder="e.g. Frontend Developer"
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={actionLoading === 'profile'}
                        className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition disabled:opacity-50 shadow-xl shadow-violet-900/20"
                      >
                        {actionLoading === 'profile' ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Save Changes"}
                      </button>
                   </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'Connected Apps' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-8">
                     <LinkIcon className="h-5 w-5 text-blue-400" />
                     <h2 className="text-xl font-bold text-white">Connected Accounts</h2>
                  </div>

                  <div className="space-y-6">
                    {PROVIDERS.map((provider) => {
                      const linked = isLinked(provider.id);
                      const accountId = getAccountId(provider.id);
                      
                      return (
                        <div 
                          key={provider.id} 
                          className="flex items-center justify-between p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 transition hover:border-slate-600/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center ${provider.color}`}>
                               <Globe className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{provider.name}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">
                                {linked ? 'Connected' : 'Not Connected'}
                              </p>
                            </div>
                          </div>

                          {linked ? (
                            <button
                              onClick={() => handleUnlink(accountId)}
                              disabled={actionLoading === accountId}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 font-bold rounded-xl text-xs transition border border-transparent hover:border-red-500/20 disabled:opacity-50"
                            >
                              {actionLoading === accountId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                              Unlink
                            </button>
                          ) : (
                            <button
                              onClick={() => signIn(provider.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-900/20"
                            >
                              Link Account
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Account' && (
               <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <Lock className="h-24 w-24 text-white" />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                     <Shield className="h-5 w-5 text-emerald-400" />
                     <h2 className="text-xl font-bold text-white">Password Security</h2>
                  </div>
                  <p className="text-slate-400 text-sm mb-6 max-w-sm">Manage your password and two-factor authentication settings to keep your account safe.</p>
                  <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition border border-slate-700">
                     Update Password
                  </button>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
