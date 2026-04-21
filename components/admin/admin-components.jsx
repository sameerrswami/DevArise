'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

/* ─── AdminStatCard ──────────────────────────────────────────── */
export function AdminStatCard({ icon: Icon, label, value, sub, color = 'blue', trend }) {
  const colorMap = {
    blue:   { bg: 'from-blue-500/20 to-blue-600/5',   icon: 'text-blue-400',   border: 'border-blue-500/20' },
    green:  { bg: 'from-emerald-500/20 to-emerald-600/5', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
    red:    { bg: 'from-red-500/20 to-red-600/5',     icon: 'text-red-400',    border: 'border-red-500/20' },
    purple: { bg: 'from-purple-500/20 to-purple-600/5', icon: 'text-purple-400', border: 'border-purple-500/20' },
    amber:  { bg: 'from-amber-500/20 to-amber-600/5', icon: 'text-amber-400',  border: 'border-amber-500/20' },
    cyan:   { bg: 'from-cyan-500/20 to-cyan-600/5',   icon: 'text-cyan-400',   border: 'border-cyan-500/20' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className={`relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} p-5 backdrop-blur`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value ?? '—'}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={`rounded-xl p-3 bg-white/5 ${c.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <p className={`mt-3 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </p>
      )}
    </motion.div>
  );
}

/* ─── AdminCard ──────────────────────────────────────────────── */
export function AdminCard({ title, subtitle, children, actions, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur p-6 ${className}`}>
      {(title || actions) && (
        <div className="flex items-start justify-between mb-5">
          <div>
            {title && <h3 className="text-base font-semibold text-white">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── AdminSearchBar ─────────────────────────────────────────── */
export function AdminSearchBar({ onSearch, placeholder = 'Search…', className = '' }) {
  const [val, setVal] = useState('');

  const handleChange = (e) => {
    setVal(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <div className={`relative mb-4 ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
      <input
        type="text"
        value={val}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-700/40 border border-slate-600/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition"
      />
    </div>
  );
}

/* ─── AdminStatusBadge ───────────────────────────────────────── */
export function AdminStatusBadge({ status, size = 'md' }) {
  const map = {
    active:    { label: 'Active',    class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    inactive:  { label: 'Inactive',  class: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
    suspended: { label: 'Suspended', class: 'bg-red-500/15 text-red-400 border-red-500/25' },
    verified:  { label: 'Verified',  class: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
    pending:   { label: 'Pending',   class: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    live:      { label: 'Live',      class: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
    upcoming:  { label: 'Upcoming',  class: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25' },
    ended:     { label: 'Ended',     class: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
    approved:  { label: 'Approved',  class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    rejected:  { label: 'Rejected',  class: 'bg-red-500/15 text-red-400 border-red-500/25' },
    resolved:  { label: 'Resolved',  class: 'bg-teal-500/15 text-teal-400 border-teal-500/25' },
    easy:      { label: 'Easy',      class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    medium:    { label: 'Medium',    class: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    hard:      { label: 'Hard',      class: 'bg-red-500/15 text-red-400 border-red-500/25' },
  };

  const cfg = map[status?.toLowerCase()] || { label: status || 'Unknown', class: 'bg-slate-500/15 text-slate-400 border-slate-500/25' };
  const sz  = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${sz} ${cfg.class}`}>
      {cfg.label}
    </span>
  );
}

/* ─── AdminTable ─────────────────────────────────────────────── */
export function AdminTable({ columns, data, loading, empty, onEdit, onDelete, onView }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-500">
        <div className="h-12 w-12 rounded-full bg-slate-700/40 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm">{empty || 'No data found'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 bg-slate-900/40">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete || onView) && (
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {data.map((row, idx) => (
            <motion.tr
              key={row.id || idx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="hover:bg-slate-700/20 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-300 max-w-[220px] truncate">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
              {(onEdit || onDelete || onView) && (
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onView && (
                      <button onClick={() => onView(row)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onEdit && (
                      <button onClick={() => onEdit(row)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(row)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── AdminModal ─────────────────────────────────────────────── */
export function AdminModal({ isOpen, title, onClose, onSubmit, submitText = 'Submit', children, danger = false }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
            {onSubmit && (
              <div className="px-6 py-4 border-t border-slate-700/60 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-700 transition">
                  Cancel
                </button>
                <button
                  onClick={onSubmit}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition ${
                    danger
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-violet-600 hover:bg-violet-500'
                  }`}
                >
                  {submitText}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── AdminAlert ─────────────────────────────────────────────── */
export function AdminAlert({ type = 'info', message, onDismiss }) {
  const map = {
    info:    { icon: CheckCircle, class: 'bg-blue-500/10 border-blue-500/30 text-blue-300' },
    success: { icon: CheckCircle, class: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
    warning: { icon: AlertTriangle, class: 'bg-amber-500/10 border-amber-500/30 text-amber-300' },
    error:   { icon: XCircle, class: 'bg-red-500/10 border-red-500/30 text-red-300' },
  };
  const cfg = map[type] || map.info;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${cfg.class}`}
    >
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-auto opacity-70 hover:opacity-100">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}

/* ─── AdminPagination ────────────────────────────────────────── */
export function AdminPagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xs text-slate-400 min-w-[80px] text-center">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── AdminFormField ─────────────────────────────────────────── */
export function AdminFormField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  'w-full px-3 py-2 rounded-xl bg-slate-700/50 border border-slate-600/60 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition';

export const selectClass = inputClass + ' cursor-pointer';
