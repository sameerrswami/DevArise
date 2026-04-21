'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Key,
  ToggleLeft,
  ToggleRight,
  Shield,
  Bell,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { AdminCard, AdminAlert, inputClass } from './admin-components';

/* ─── Feature Toggle ── */
function FeatureToggle({ label, description, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-violet-600' : 'bg-slate-700'
        }`}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
          style={{ left: enabled ? '1.375rem' : '0.25rem' }}
        />
      </button>
    </div>
  );
}

/* ─── Secret Key Field ── */
function SecretField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputClass} pr-20`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <button onClick={() => setShow(!show)} className="p-1 rounded text-slate-500 hover:text-slate-300 transition">
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button onClick={handleCopy} className="p-1 rounded text-slate-500 hover:text-slate-300 transition">
            {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── System Settings Component ── */
export function SystemSettingsDashboard() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [apiKeys, setApiKeys] = useState({
    geminiApiKey: '',
    openaiApiKey: '',
    githubClientId: '',
    githubClientSecret: '',
    googleClientId: '',
    googleClientSecret: '',
    cloudinaryUrl: '',
    resendApiKey: '',
  });

  const [features, setFeatures] = useState({
    aiTutor:           true,
    aiInterviewer:     true,
    codingContests:    true,
    communityForum:    true,
    jobRecommendations: true,
    gamification:      true,
    plagiarismDetection: false,
    betaFeatures:      false,
    maintenanceMode:   false,
    emailNotifications: true,
    pushNotifications: false,
  });

  const [limits, setLimits] = useState({
    maxApiCallsPerUser: 500,
    maxFileUploadMb: 10,
    maxContestEntries: 1000,
    sessionTimeoutMin: 60,
    freeTierMonthlyAI: 50,
  });

  const [notifications, setNotifications] = useState({
    alertEmail: 'admin@devarise.ai',
    slackWebhook: '',
    errorThreshold: 5,
    uptimeCheckMin: 5,
  });

  const featureConfigs = [
    { key: 'aiTutor',            label: 'AI Tutor',               description: 'Personalized AI learning assistant' },
    { key: 'aiInterviewer',      label: 'AI Interviewer',          description: 'Mock interview simulation with AI' },
    { key: 'codingContests',     label: 'Coding Contests',         description: 'Live competitive programming events' },
    { key: 'communityForum',     label: 'Community Forum',         description: 'Q&A and discussion boards' },
    { key: 'jobRecommendations', label: 'Job Recommendations',     description: 'AI-curated job listings' },
    { key: 'gamification',       label: 'Gamification',            description: 'Points, badges, and leaderboards' },
    { key: 'plagiarismDetection',label: 'Plagiarism Detection',    description: 'Detect code plagiarism in contests' },
    { key: 'betaFeatures',       label: 'Beta Features',           description: 'Enable experimental features for all users' },
    { key: 'maintenanceMode',    label: 'Maintenance Mode',        description: '⚠️ Locks platform for all non-admin users' },
    { key: 'emailNotifications', label: 'Email Notifications',     description: 'Send transactional and marketing emails' },
    { key: 'pushNotifications',  label: 'Push Notifications',      description: 'Browser push notification support' },
  ];

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {saved && (
        <AdminAlert type="success" message="Settings saved successfully." onDismiss={() => setSaved(false)} />
      )}

      {features.maintenanceMode && (
        <AdminAlert type="warning" message="⚠️ Maintenance mode is ON — All non-admin users are locked out." />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">System Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage API keys, feature flags, and platform limits</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition disabled:opacity-70"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* API Keys */}
        <AdminCard title="API Keys" subtitle="Third-party service credentials">
          <div className="space-y-4">
            <SecretField label="Gemini API Key"         value={apiKeys.geminiApiKey}      onChange={(v) => setApiKeys({ ...apiKeys, geminiApiKey: v })}      placeholder="AIza..." />
            <SecretField label="OpenAI API Key"         value={apiKeys.openaiApiKey}       onChange={(v) => setApiKeys({ ...apiKeys, openaiApiKey: v })}       placeholder="sk-..." />
            <SecretField label="GitHub Client ID"       value={apiKeys.githubClientId}     onChange={(v) => setApiKeys({ ...apiKeys, githubClientId: v })}     placeholder="Ov23..." />
            <SecretField label="GitHub Client Secret"   value={apiKeys.githubClientSecret} onChange={(v) => setApiKeys({ ...apiKeys, githubClientSecret: v })} placeholder="..." />
            <SecretField label="Google Client ID"       value={apiKeys.googleClientId}     onChange={(v) => setApiKeys({ ...apiKeys, googleClientId: v })}     placeholder="xxx.apps.googleusercontent.com" />
            <SecretField label="Google Client Secret"   value={apiKeys.googleClientSecret} onChange={(v) => setApiKeys({ ...apiKeys, googleClientSecret: v })} placeholder="GOCSPX-..." />
            <SecretField label="Cloudinary URL"         value={apiKeys.cloudinaryUrl}      onChange={(v) => setApiKeys({ ...apiKeys, cloudinaryUrl: v })}      placeholder="cloudinary://..." />
            <SecretField label="Resend API Key"         value={apiKeys.resendApiKey}       onChange={(v) => setApiKeys({ ...apiKeys, resendApiKey: v })}       placeholder="re_..." />
          </div>
        </AdminCard>

        {/* Platform Limits */}
        <div className="space-y-6">
          <AdminCard title="Platform Limits" subtitle="Resource and usage restrictions">
            <div className="space-y-4">
              {[
                { key: 'maxApiCallsPerUser',  label: 'Max API Calls / User / Month' },
                { key: 'maxFileUploadMb',     label: 'Max File Upload Size (MB)'     },
                { key: 'maxContestEntries',   label: 'Max Contest Entries'            },
                { key: 'sessionTimeoutMin',   label: 'Session Timeout (minutes)'      },
                { key: 'freeTierMonthlyAI',   label: 'Free Tier Monthly AI Credits'   },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
                  <input
                    type="number"
                    value={limits[key]}
                    onChange={(e) => setLimits({ ...limits, [key]: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </AdminCard>

          {/* Alert / Monitoring */}
          <AdminCard title="Monitoring & Alerts" subtitle="Configure error reporting and notifications">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Alert Email</label>
                <input
                  type="email"
                  value={notifications.alertEmail}
                  onChange={(e) => setNotifications({ ...notifications, alertEmail: e.target.value })}
                  className={inputClass}
                />
              </div>
              <SecretField
                label="Slack Webhook URL"
                value={notifications.slackWebhook}
                onChange={(v) => setNotifications({ ...notifications, slackWebhook: v })}
                placeholder="https://hooks.slack.com/..."
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Error Alert Threshold (%)</label>
                  <input
                    type="number"
                    value={notifications.errorThreshold}
                    onChange={(e) => setNotifications({ ...notifications, errorThreshold: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Uptime Check Interval (min)</label>
                  <input
                    type="number"
                    value={notifications.uptimeCheckMin}
                    onChange={(e) => setNotifications({ ...notifications, uptimeCheckMin: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Feature Toggles */}
      <AdminCard title="Feature Flags" subtitle="Enable or disable platform features in real time">
        <div className="divide-y divide-slate-700/30">
          {featureConfigs.map(({ key, label, description }) => (
            <FeatureToggle
              key={key}
              label={label}
              description={description}
              enabled={features[key]}
              onChange={(val) => setFeatures({ ...features, [key]: val })}
            />
          ))}
        </div>
      </AdminCard>

    </motion.div>
  );
}
