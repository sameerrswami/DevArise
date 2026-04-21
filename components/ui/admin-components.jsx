'use client';

import { motion } from 'framer-motion';
import {
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Search,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useState } from 'react';

/**
 * Admin Table Component - Clean data display with actions
 */
export function AdminTable({
  columns = [],
  data = [],
  onEdit = null,
  onDelete = null,
  onView = null,
  loading = false,
  empty = 'No data found',
}) {
  const [selectedRows, setSelectedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((_, i) => i)));
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="h-12 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded animate-shimmer"
          />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center p-12 border border-slate-700 rounded-lg bg-slate-800/30"
      >
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">{empty}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30 backdrop-blur"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-blue-500"
                />
              </th>
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-left text-sm font-semibold text-slate-300"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <motion.tr
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(idx)}
                    onChange={() => toggleRow(idx)}
                    className="w-4 h-4 accent-blue-500"
                  />
                </td>
                {columns.map(col => (
                  <td
                    key={`${idx}-${col.key}`}
                    className="px-6 py-4 text-sm text-slate-300"
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key]}
                  </td>
                ))}
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {onView && (
                      <button
                        onClick={() => onView(row)}
                        className="p-2 hover:bg-slate-700 rounded transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="p-2 hover:bg-slate-700 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-blue-400" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="p-2 hover:bg-red-900/20 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/**
 * Admin Status Badge Component
 */
export function AdminStatusBadge({ status, size = 'md' }) {
  const statusConfig = {
    active: { bg: 'bg-emerald-900/20', text: 'text-emerald-400', icon: CheckCircle },
    inactive: { bg: 'bg-slate-900/20', text: 'text-slate-400', icon: XCircle },
    pending: { bg: 'bg-amber-900/20', text: 'text-amber-400', icon: Clock },
    suspended: { bg: 'bg-red-900/20', text: 'text-red-400', icon: XCircle },
    verified: { bg: 'bg-blue-900/20', text: 'text-blue-400', icon: CheckCircle },
  };

  const config = statusConfig[status] || statusConfig.inactive;
  const Icon = config.icon;
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-1.5 w-fit rounded-full ${config.bg} ${config.text} font-medium ${sizeClass}`}
    >
      <Icon className="w-3 h-3" />
      <span className="capitalize">{status}</span>
    </motion.div>
  );
}

/**
 * Admin Card Component - Clean data container
 */
export function AdminCard({ title, subtitle, children, actions = null, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border border-slate-700 rounded-lg p-6 bg-slate-800/30 backdrop-blur ${className}`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {children}
    </motion.div>
  );
}

/**
 * Admin Stat Card Component
 */
export function AdminStatCard({ icon: Icon, label, value, trend = null, color = 'blue' }) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-900/20',
    green: 'text-emerald-400 bg-emerald-900/20',
    red: 'text-red-400 bg-red-900/20',
    amber: 'text-amber-400 bg-amber-900/20',
    purple: 'text-purple-400 bg-purple-900/20',
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="border border-slate-700 rounded-lg p-6 bg-slate-800/30 backdrop-blur"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <p className={trend > 0 ? 'text-emerald-400' : 'text-red-400'} className="text-sm mt-2">
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Admin Search Bar Component
 */
export function AdminSearchBar({ onSearch, placeholder = 'Search...', onFilter = null }) {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="flex gap-3 mb-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 relative"
      >
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
        />
      </motion.div>
      {onFilter && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onFilter}
          className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500 transition-colors flex items-center gap-2 text-slate-300"
        >
          <Filter className="w-4 h-4" />
          Filter
        </motion.button>
      )}
    </div>
  );
}

/**
 * Admin Pagination Component
 */
export function AdminPagination({ currentPage, totalPages, onPageChange }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center gap-2 mt-6 p-4"
    >
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="p-2 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {Array.from({ length: totalPages }).map((_, i) => {
        const page = i + 1;
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-700 text-slate-300'
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="p-2 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

/**
 * Admin Modal Component
 */
export function AdminModal({ isOpen, title, children, onClose, onSubmit, submitText = 'Save' }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full mx-4 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">{children}</div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-white font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2.5 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-white font-medium"
          >
            {submitText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Admin Filter Badge Component
 */
export function AdminFilterBadge({ label, onRemove }) {
  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.9 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 border border-blue-600/50 rounded-full text-sm text-blue-300"
    >
      {label}
      <button
        onClick={onRemove}
        className="text-blue-400 hover:text-blue-300 transition-colors"
      >
        ✕
      </button>
    </motion.div>
  );
}

/**
 * Admin Loading Skeleton
 */
export function AdminSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded animate-shimmer"
        />
      ))}
    </div>
  );
}

/**
 * Admin Alert Component
 */
export function AdminAlert({ type = 'info', message, icon: Icon, onClose }) {
  const typeConfig = {
    success: { bg: 'bg-emerald-900/20', border: 'border-emerald-600/50', text: 'text-emerald-400' },
    error: { bg: 'bg-red-900/20', border: 'border-red-600/50', text: 'text-red-400' },
    warning: { bg: 'bg-amber-900/20', border: 'border-amber-600/50', text: 'text-amber-400' },
    info: { bg: 'bg-blue-900/20', border: 'border-blue-600/50', text: 'text-blue-400' },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-3 p-4 rounded-lg border ${config.bg} ${config.border} ${config.text}`}
    >
      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-current hover:opacity-70 transition-opacity">
          ✕
        </button>
      )}
    </motion.div>
  );
}
