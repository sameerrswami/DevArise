'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Calendar,
  Clock,
  Plus,
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Settings,
  Trash2,
  Award,
  Zap,
  Target
} from 'lucide-react';
import {
  AdminTable,
  AdminCard,
  AdminSearchBar,
  AdminStatusBadge,
  AdminModal,
  AdminPagination,
  AdminAlert,
  AdminFormField,
  inputClass,
  selectClass
} from './admin-components';

export function ContestManagementDashboard() {
  const [contests, setContests] = useState([]);
  const [filteredContests, setFilteredContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    durationMinutes: 60,
    type: 'rated',
  });

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/contests');
      if (!response.ok) throw new Error('Failed to fetch contests');
      const data = await response.json();
      setContests(data.contests || []);
      setFilteredContests(data.contests || []);
    } catch (error) {
      console.error('Error fetching contests:', error);
      setError('Failed to load contests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const handleSearch = (q) => {
    const filtered = contests.filter(c => c.title.toLowerCase().includes(q.toLowerCase()));
    setFilteredContests(filtered);
    setCurrentPage(1);
  };

  const handleCreateContest = async () => {
    try {
      const response = await fetch('/api/admin/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setSuccess('Contest scheduled successfully');
        fetchContests();
        setIsModalOpen(false);
        setFormData({ title: '', startTime: '', durationMinutes: 60, type: 'rated' });
      } else {
        throw new Error('Creation failed');
      }
    } catch (error) {
      setError('Error creating contest');
    }
  };

  const handleDelete = async (contest) => {
    if (!confirm('Cancel this contest and notify all participants?')) return;
    try {
      const response = await fetch(`/api/admin/contests/${contest.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSuccess('Contest cancelled');
        fetchContests();
      }
    } catch (error) {
      setError('Failed to delete contest');
    }
  };

  const columns = [
    { 
      key: 'title', 
      label: 'Contest Name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${row.status === 'active' ? 'from-emerald-500 to-teal-400' : 'from-slate-700 to-slate-800'} text-white shadow-lg`}>
            <Award className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-tight">{val}</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{row.type || 'Standard'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'startTime',
      label: 'Date & Time',
      render: (date) => (
        <div className="flex flex-col">
          <span className="text-slate-300 text-xs font-semibold">{new Date(date).toLocaleDateString()}</span>
          <span className="text-slate-500 text-[10px]">{new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ),
    },
    {
      key: 'durationMinutes',
      label: 'Duration',
      render: (min) => (
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="h-3 w-3" />
          <span className="text-xs font-medium">{min}m</span>
        </div>
      )
    },
    {
      key: 'participants',
      label: 'Registered',
      render: (count) => (
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3 text-blue-400" />
          <span className="text-xs font-bold text-white">{count || 0}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <div className="flex items-center gap-2">
           {status === 'active' && <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
           <AdminStatusBadge status={status} size="sm" />
        </div>
      ),
    },
  ];

  const paginated = filteredContests.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {error && <AdminAlert type="error" message={error} onDismiss={() => setError(null)} />}
      {success && <AdminAlert type="success" message={success} onDismiss={() => setSuccess(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminCard>
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Battles</p>
                <p className="text-2xl font-bold text-white">{contests.filter(c => c.status === 'active').length}</p>
              </div>
           </div>
        </AdminCard>
        <AdminCard>
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scheduled</p>
                <p className="text-2xl font-bold text-white">{contests.filter(c => c.status === 'upcoming').length}</p>
              </div>
           </div>
        </AdminCard>
        <AdminCard className="hidden lg:block">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Participation</p>
                <p className="text-2xl font-bold text-white">8.4k</p>
              </div>
           </div>
        </AdminCard>
      </div>

      <AdminCard
        title="Battle Engine"
        subtitle="Schedule premium coding contests and track real-time leaderboards"
        actions={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-white text-xs font-bold transition shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-3.5 h-3.5" />
            New Contest
          </motion.button>
        }
      >
        <AdminSearchBar onSearch={handleSearch} placeholder="Filter by contest name..." />
        <AdminTable
          columns={columns}
          data={paginated}
          loading={loading}
          empty="No contests scheduled"
          onDelete={handleDelete}
          onView={(c) => window.open(`/contests/${c.id}`, '_blank')}
        />
        {filteredContests.length > 10 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredContests.length / 10)}
            onPageChange={setCurrentPage}
          />
        )}
      </AdminCard>

      <AdminModal
        isOpen={isModalOpen}
        title="Contest Configuration"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateContest}
        submitText="Launch Contest"
      >
        <div className="space-y-4">
          <AdminFormField label="Contest Title">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputClass}
              placeholder="e.g. Weekly Algorithm Challenge #24"
            />
          </AdminFormField>

          <div className="grid grid-cols-2 gap-4">
            <AdminFormField label="Starts At">
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className={inputClass}
              />
            </AdminFormField>

            <AdminFormField label="Duration (Minutes)">
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                className={inputClass}
              />
            </AdminFormField>
          </div>

          <AdminFormField label="Scoring Type">
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className={selectClass}
            >
              <option value="rated">Rated (Standard Elo)</option>
              <option value="unrated">Unrated (Practice)</option>
              <option value="interview">Interview Mode</option>
              <option value="bounty">Bounty Contest</option>
            </select>
          </AdminFormField>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/50">
             <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-white">Problem Set</p>
                <button type="button" className="text-[10px] text-blue-400 hover:underline">Select Problems</button>
             </div>
             <div className="py-8 text-center bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
                <p className="text-[10px] text-slate-500 font-medium">Problems will be linked manually or via AI selection</p>
             </div>
          </div>
        </div>
      </AdminModal>
    </motion.div>
  );
}
