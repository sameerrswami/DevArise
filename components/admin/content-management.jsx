'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Code2,
  Plus,
  Tag,
  Layers,
  Search,
  Filter as FilterIcon,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Layout,
  Cpu,
  BrainCircuit,
  MessageSquare,
  AlertTriangle
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

export function ContentManagementDashboard() {
  const [activeTab, setActiveTab] = useState('problems');
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    category: '',
    tags: [],
  });

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/content/problems');
      if (!response.ok) throw new Error('Failed to fetch problems');
      const data = await response.json();
      setProblems(data.problems || []);
      setFilteredProblems(data.problems || []);
    } catch (error) {
      console.error('Error fetching problems:', error);
      setError('Could not load problems list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'problems') {
      fetchProblems();
    }
  }, [activeTab]);

  const handleSearch = (query) => {
    const filtered = problems.filter(problem =>
      problem.title?.toLowerCase().includes(query.toLowerCase()) ||
      problem.category?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProblems(filtered);
    setCurrentPage(1);
  };

  const handleDifficultyFilter = (difficulty) => {
    const filtered = problems.filter(p => p.difficulty.toLowerCase() === difficulty.toLowerCase());
    setFilteredProblems(filtered);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilteredProblems(problems);
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setEditingProblem(null);
    setFormData({
      title: '',
      description: '',
      difficulty: 'medium',
      category: '',
      tags: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (problem) => {
    setEditingProblem(problem);
    setFormData({
      title: problem.title,
      description: problem.description || '',
      difficulty: problem.difficulty,
      category: problem.category,
      tags: problem.tags || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const url = editingProblem 
        ? `/api/admin/content/problems/${editingProblem.id}` 
        : '/api/admin/content/problems';
      
      const method = editingProblem ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setSuccess(`Problem ${editingProblem ? 'updated' : 'created'} successfully`);
        fetchProblems();
        setIsModalOpen(false);
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to save coding problem');
    }
  };

  const handleDelete = async (problem) => {
    if (!confirm('Are you sure you want to delete this problem? This will also remove it from any active contests.')) return;
    try {
      const response = await fetch(`/api/admin/content/problems/${problem.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSuccess('Problem deleted permanentely');
        fetchProblems();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting problem:', error);
      setError('Failed to delete problem');
    }
  };

  const problemColumns = [
    { 
      key: 'title', 
      label: 'Problem',
      render: (val, row) => (
        <div className="flex items-center gap-2 group">
          <div className="h-7 w-7 rounded-lg bg-slate-700/50 flex items-center justify-center text-blue-400">
            <Cpu className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{val}</span>
        </div>
      )
    },
    { 
      key: 'category', 
      label: 'Topic',
      render: (val) => (
        <div className="flex items-center gap-1.5 opacity-80">
          <Tag className="h-3 w-3 text-slate-500" />
          <span className="text-xs">{val}</span>
        </div>
      )
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      render: (diff) => <AdminStatusBadge status={diff} size="sm" />,
    },
    {
      key: 'submissions',
      label: 'Solves',
      render: (count) => (
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <TrendingUp className="h-3 w-3" />
          {count || 0}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (date) => (
        <span className="text-slate-500 text-xs">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const paginatedProblems = filteredProblems.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {error && <AdminAlert type="error" message={error} onDismiss={() => setError(null)} />}
      {success && <AdminAlert type="success" message={success} onDismiss={() => setSuccess(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <ContentStatistics />
      </div>

      <div className="flex gap-1.5 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-700/50 w-fit">
        {['problems', 'quizzes', 'resources'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab
                ? 'bg-violet-600/20 text-violet-400 border border-violet-500/25 shadow-lg shadow-violet-900/10'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'problems' && (
        <AdminCard
          title="Question Bank"
          subtitle="DSA, Full-stack and System Design problems"
          actions={
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-white text-xs font-bold transition shadow-lg shadow-violet-900/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Problem
            </motion.button>
          }
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <AdminSearchBar
              onSearch={handleSearch}
              placeholder="Search by title, topic..."
              className="mb-0 flex-1"
            />
            
            <div className="flex gap-2">
              {['Easy', 'Medium', 'Hard'].map(diff => (
                <button
                  key={diff}
                  onClick={() => handleDifficultyFilter(diff)}
                  className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 rounded-lg text-[10px] font-bold text-slate-400 transition"
                >
                  {diff}
                </button>
              ))}
              <button 
                onClick={resetFilters}
                className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 rounded-lg text-[10px] font-bold text-slate-400 transition"
              >
                All
              </button>
            </div>
          </div>

          <AdminTable
            columns={problemColumns}
            data={paginatedProblems}
            loading={loading}
            empty="No problems found matching filters"
            onDelete={handleDelete}
            onEdit={openEditModal}
          />

          {filteredProblems.length > 10 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredProblems.length / 10)}
              onPageChange={setCurrentPage}
            />
          )}
        </AdminCard>
      )}

      {/* Placeholders for other tabs */}
      {activeTab !== 'problems' && (
        <AdminCard>
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <BrainCircuit className="h-8 w-8 text-slate-600" />
             </div>
             <h3 className="text-lg font-bold text-white mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h3>
             <p className="text-sm text-slate-500 max-w-xs">Existing content for {activeTab} will be integrated shortly in the next sync.</p>
          </div>
        </AdminCard>
      )}

      <AdminModal
        isOpen={isModalOpen}
        title={editingProblem ? 'Update Coding Problem' : 'Configure New Problem'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        submitText={editingProblem ? 'Update' : 'Generate'}
      >
        <div className="space-y-4">
          <AdminFormField label="Problem Name">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputClass}
              placeholder="e.g. Reverse Linked List"
            />
          </AdminFormField>

          <div className="grid grid-cols-2 gap-4">
            <AdminFormField label="Topic Category">
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={selectClass}
              >
                <option value="">Select Topic</option>
                <option value="Array">Array</option>
                <option value="String">String</option>
                <option value="Linked List">Linked List</option>
                <option value="Recursion">Recursion</option>
                <option value="Dynamic Programming">DP</option>
                <option value="Graph">Graph</option>
                <option value="System Design">System Design</option>
              </select>
            </AdminFormField>

            <AdminFormField label="Level">
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className={selectClass}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </AdminFormField>
          </div>

          <AdminFormField label="Challenge Description (Markdown supported)">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="6"
              className={`${inputClass} resize-none text-xs font-mono leading-relaxed`}
              placeholder="Provide a detailed objective, constraints and example cases..."
            />
          </AdminFormField>
          
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-[10px] text-amber-400 leading-tight">
               Test cases and boilerplate code will be automatically generated by AI once the problem is created.
            </p>
          </div>
        </div>
      </AdminModal>
    </motion.div>
  );
}

export function ContentStatistics() {
  const [stats, setStats] = useState({
    totalProblems: 0,
    totalQuizzes: 0,
    totalResources: 0,
    avgDifficulty: 'Medium',
    categoriesCount: 0,
    lastProblemCreated: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/content/statistics');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching content statistics:', error);
      }
    };
    fetchStats();
  }, []);

  const statConfig = [
    { label: 'Bank Size', value: stats.totalProblems, icon: Code2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Courses', value: stats.totalQuizzes, icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Domains', value: stats.categoriesCount, icon: Layers, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  return (
    <>
      {statConfig.map((stat, i) => (
        <AdminCard key={i}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value.toLocaleString()}</p>
            </div>
            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        </AdminCard>
      ))}
    </>
  );
}
