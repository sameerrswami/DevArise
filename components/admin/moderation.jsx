'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  FileText, 
  User, 
  Clock, 
  ExternalLink,
  Shield,
  MessageSquare,
  Eye,
  X
} from 'lucide-react';
import { 
  AdminCard, 
  AdminTable, 
  AdminModal, 
  AdminPagination, 
  AdminAlert,
  AdminStatusBadge 
} from './admin-components';

export function ModerationDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/moderation/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (e) {
      console.error(e);
      setError('Failed to load moderation reports');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (report) => {
    try {
      const res = await fetch(`/api/admin/moderation/reports/${report.id}/resolve`, { 
        method: 'POST' 
      });
      if (res.ok) {
        setSuccess('Report resolved successfully');
        fetchReports();
        setIsModalOpen(false);
      } else {
        throw new Error('Failed to resolve report');
      }
    } catch (e) {
      console.error(e);
      setError('Error resolving report');
    }
  };

  const handleDeleteContent = async (report) => {
    if (!confirm('Are you absolutely sure you want to delete this content? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/admin/moderation/content/${report.contentType}/${report.contentId}`, { 
        method: 'DELETE' 
      });
      
      if (res.ok) {
        setSuccess('Content deleted and report resolved');
        fetchReports();
        setIsModalOpen(false);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete content');
      }
    } catch (e) {
      console.error(e);
      setError(e.message || 'Error deleting content');
    }
  };

  const columns = [
    { 
      key: 'reporter', 
      label: 'Reporter',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
            <User className="h-3 w-3" />
          </div>
          <span>{val}</span>
        </div>
      )
    },
    { 
      key: 'contentType', 
      label: 'Type',
      render: (val) => (
        <span className="capitalize font-medium text-slate-400 flex items-center gap-1.5">
          {val === 'question' && <MessageSquare className="h-3 w-3" />}
          {val === 'answer' && <FileText className="h-3 w-3" />}
          {val === 'experience' && <Shield className="h-3 w-3" />}
          {val}
        </span>
      )
    },
    { 
      key: 'summary', 
      label: 'Reason', 
      render: (s) => (
        <span className="text-slate-300 italic">"{s.length > 50 ? s.slice(0, 50) + '...' : s}"</span>
      ) 
    },
    {
      key: 'status',
      label: 'Status',
      render: (s) => <AdminStatusBadge status={s} />
    },
    { 
      key: 'createdAt', 
      label: 'Date',
      render: (d) => (
        <div className="flex items-center gap-1 text-slate-500 text-xs">
          <Clock className="h-3 w-3" />
          {d}
        </div>
      )
    }
  ];

  const paginatedReports = reports.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {error && <AdminAlert type="error" message={error} onDismiss={() => setError(null)} />}
      {success && <AdminAlert type="success" message={success} onDismiss={() => setSuccess(null)} />}

      <AdminCard 
        title="Content Moderation" 
        subtitle={`${reports.filter(r => r.status === 'pending').length} pending reports require your attention`}
      >
        <AdminTable 
          columns={columns} 
          data={paginatedReports} 
          loading={loading} 
          empty="No moderation reports found" 
          onView={(r) => { setSelectedReport(r); setIsModalOpen(true); }} 
        />
        {reports.length > 10 && (
          <AdminPagination 
            currentPage={currentPage} 
            totalPages={Math.ceil(reports.length / 10)} 
            onPageChange={setCurrentPage} 
          />
        )}
      </AdminCard>

      <AdminModal 
        isOpen={isModalOpen} 
        title={selectedReport ? `Report Details` : 'Report'} 
        onClose={() => { setIsModalOpen(false); setSelectedReport(null); }}
      >
        {selectedReport && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Reporter</p>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-violet-400" />
                  <span className="text-sm font-medium text-white">{selectedReport.reporter}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Content Type</p>
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-sm font-medium text-white capitalize">{selectedReport.contentType}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/50">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Reported Reason</p>
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-200 leading-relaxed font-medium">{selectedReport.summary}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Flagged Content Preview</p>
              <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-xs text-slate-400 italic leading-relaxed">
                  {selectedReport.content}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {selectedReport.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleResolve(selectedReport)} 
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/20"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Dismiss Report
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDeleteContent(selectedReport)} 
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Content
                  </motion.button>
                </div>
              )}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setIsModalOpen(false); setSelectedReport(null); }}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition"
              >
                Close
              </motion.button>
            </div>
          </div>
        )}
      </AdminModal>
    </motion.div>
  );
}
