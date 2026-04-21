'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  CheckCircle, 
  Edit2, 
  Trash2, 
  Search, 
  MapPin, 
  Building2, 
  DollarSign, 
  Plus, 
  Globe, 
  Clock, 
  ExternalLink,
  Target,
  BadgeInfo,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import { 
  AdminCard, 
  AdminTable, 
  AdminSearchBar, 
  AdminModal, 
  AdminPagination, 
  AdminStatusBadge,
  AdminAlert,
  AdminFormField,
  inputClass,
  selectClass
} from './admin-components';

export function JobManagementDashboard() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [formData, setFormData] = useState({ 
    title: '', 
    company: '', 
    location: '', 
    description: '', 
    type: 'Full-time',
    category: 'Software Engineering',
    salary: ''
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(data.jobs || []);
      setFilteredJobs(data.jobs || []);
    } catch (e) { 
      console.error(e); 
      setError('Failed to load job listings');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearch = (q) => {
    const filtered = jobs.filter(j => 
      j.title?.toLowerCase().includes(q.toLowerCase()) || 
      j.company?.toLowerCase().includes(q.toLowerCase()) ||
      j.category?.toLowerCase().includes(q.toLowerCase())
    );
    setFilteredJobs(filtered);
    setCurrentPage(1);
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/admin/jobs', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(formData)
      });
      if (res.ok) { 
        setSuccess('Job posting created successfully');
        setIsModalOpen(false); 
        fetchJobs(); 
        setFormData({ title: '', company: '', location: '', description: '', type: 'Full-time', category: 'Software Engineering', salary: '' });
      } else {
        throw new Error('Creation failed');
      }
    } catch (e) { 
      console.error('Create job error', e); 
      setError('Error creating job posting');
    }
  };

  const handleDelete = async (job) => {
    if (!confirm('Are you sure you want to remove this job listing?')) return;
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('Job posting removed');
        fetchJobs();
      }
    } catch (e) {
      console.error(e);
      setError('Failed to delete job');
    }
  };

  const columns = [
    { 
      key: 'title', 
      label: 'Role & Company',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700/50 shadow-inner group">
             <Building2 className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-tight leading-tight">{val}</span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">{row.company}</span>
          </div>
        </div>
      )
    },
    {
      key: 'location',
      label: 'Location',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-slate-400">
          <MapPin className="h-3 w-3" />
          <span className="text-xs">{val || 'Remote'}</span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (val) => (
        <div className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
           {val || 'General'}
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (val) => <AdminStatusBadge status={val?.toLowerCase().includes('time') ? 'active' : 'pending'} label={val} size="sm" />,
    },
    {
      key: 'createdAt',
      label: 'Posted',
      render: (date) => (
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Clock className="h-3 w-3" />
          <span className="text-xs">{new Date(date).toLocaleDateString()}</span>
        </div>
      ),
    },
  ];

  const paginated = filteredJobs.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {error && <AdminAlert type="error" message={error} onDismiss={() => setError(null)} />}
      {success && <AdminAlert type="success" message={success} onDismiss={() => setSuccess(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard icon={Briefcase} label="All Openings" value={jobs.length} color="blue" />
        <AdminStatCard icon={Globe}     label="Remote"       value={jobs.filter(j=>j.location?.toLowerCase().includes('remote')).length} color="purple" />
        <AdminStatCard icon={Target}    label="Applied"      value="248" color="green" />
        <AdminStatCard icon={TrendingDown} label="Views"     value="1.2k" color="amber" />
      </div>

      <AdminCard 
        title="Placement Board" 
        subtitle="Manage industry opportunities and company profiles"
        actions={
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white text-xs font-bold transition shadow-lg shadow-blue-900/20"
          > 
            <Plus className="w-3.5 h-3.5"/> 
            Post Job
          </motion.button>
        }
      >
        <AdminSearchBar onSearch={handleSearch} placeholder="Search by role, company or domain..." />
        <AdminTable 
          columns={columns} 
          data={paginated} 
          loading={loading} 
          empty="No placement opportunities found" 
          onDelete={handleDelete} 
          onEdit={(j) => { setFormData(j); setIsModalOpen(true); }} 
        />
        {filteredJobs.length > 10 && (
          <AdminPagination 
            currentPage={currentPage} 
            totalPages={Math.ceil(filteredJobs.length / 10)} 
            onPageChange={setCurrentPage} 
          />
        )}
      </AdminCard>

      <AdminModal 
        isOpen={isModalOpen} 
        title={formData.id ? "Edit Job Posting" : "New Placement Opportunity"} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreate} 
        submitText={formData.id ? "Update Post" : "Publish Post"}
      >
        <div className="space-y-4">
          <AdminFormField label="Job Designation">
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
              className={inputClass} 
              placeholder="e.g. Senior Frontend Engineer"
            />
          </AdminFormField>

          <div className="grid grid-cols-2 gap-4">
            <AdminFormField label="Hiring Company">
              <input 
                type="text" 
                value={formData.company} 
                onChange={(e) => setFormData({ ...formData, company: e.target.value })} 
                className={inputClass}
                placeholder="Google, Meta, etc."
              />
            </AdminFormField>
            <AdminFormField label="Work Location">
              <input 
                type="text" 
                value={formData.location} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                className={inputClass}
                placeholder="San Francisco, CA or Remote"
              />
            </AdminFormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AdminFormField label="Employment Type">
              <select 
                value={formData.type} 
                onChange={(e) => setFormData({ ...formData, type: e.target.value })} 
                className={selectClass}
              >
                 <option value="Full-time">Full-time</option>
                 <option value="Internship">Internship</option>
                 <option value="Contract">Contract</option>
                 <option value="Part-time">Part-time</option>
              </select>
            </AdminFormField>
            <AdminFormField label="Annual Compensation">
              <div className="relative">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                 <input 
                  type="text" 
                  value={formData.salary} 
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })} 
                  className={`${inputClass} pl-9`}
                  placeholder="e.g. $120k - $160k"
                />
              </div>
            </AdminFormField>
          </div>

          <AdminFormField label="Detailed Description">
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              className={`${inputClass} resize-none text-xs leading-relaxed`} 
              rows={5} 
              placeholder="Outline the responsibilities, requirements and benefits..."
            />
          </AdminFormField>
          
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex gap-2">
            <BadgeInfo className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <p className="text-[10px] text-blue-300 leading-tight">
               Your listing will be instantly visible to all qualified candidates on the platform dashboard.
            </p>
          </div>
        </div>
      </AdminModal>
    </motion.div>
  );
}
