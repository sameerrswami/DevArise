'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Shield,
  AlertCircle,
  CheckCircle,
  Trash2,
  Lock,
  Mail,
  Calendar,
  Activity,
  TrendingUp,
  Search,
  ExternalLink,
  ShieldCheck,
  UserX,
  CreditCard,
  Target
} from 'lucide-react';
import {
  AdminTable,
  AdminCard,
  AdminStatCard,
  AdminSearchBar,
  AdminStatusBadge,
  AdminModal,
  AdminAlert,
  AdminPagination,
} from './admin-components';

export function UserManagementDashboard() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    verifiedUsers: 0,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Could not load users list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (query) => {
    const filtered = users.filter(user =>
      user.name?.toLowerCase().includes(query.toLowerCase()) ||
      user.email?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleAction = async (userId, type, value) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [type]: value }),
      });
      if (response.ok) {
        setSuccess(`User updated successfully`);
        fetchUsers();
        setIsModalOpen(false);
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user status');
    }
  };

  const columns = [
    { 
      key: 'name', 
      label: 'User',
      render: (name, row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-xs">
            {name?.[0] || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white">{name || 'Anonymous'}</span>
            <span className="text-[10px] text-slate-500 font-mono">{row.id?.slice(-8)}</span>
          </div>
        </div>
      )
    },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <AdminStatusBadge status={status} />,
    },
    {
      key: 'points',
      label: 'Activity',
      render: (val) => (
        <div className="flex items-center gap-1.5 font-bold text-amber-400">
          <Target className="h-3 w-3" />
          {val.toLocaleString()}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (date) => (
        <span className="text-slate-500 font-medium">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {error && <AdminAlert type="error" message={error} onDismiss={() => setError(null)} />}
      {success && <AdminAlert type="success" message={success} onDismiss={() => setSuccess(null)} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard icon={Users}    label="Total Users"   value={stats.totalUsers}     color="blue"   />
        <AdminStatCard icon={Activity} label="Weekly Active" value={stats.activeUsers}    color="green"  />
        <AdminStatCard icon={Lock}     label="Suspended"     value={stats.suspendedUsers} color="red"    />
        <AdminStatCard icon={ShieldCheck} label="Verified"   value={stats.verifiedUsers}  color="purple" />
      </div>

      <AdminCard title="User Directory" subtitle="Manage permissions, status and view profiles">
        <AdminSearchBar onSearch={handleSearch} placeholder="Search by name, email or ID..." />
        <AdminTable
          columns={columns}
          data={paginatedUsers}
          loading={loading}
          empty="No users matched your search"
          onView={(user) => {
            setSelectedUser(user);
            setIsModalOpen(true);
          }}
          onEdit={(user) => {
            setSelectedUser(user);
            setIsModalOpen(true);
          }}
        />
        {filteredUsers.length > 10 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredUsers.length / 10)}
            onPageChange={setCurrentPage}
          />
        )}
      </AdminCard>

      <AdminModal
        isOpen={isModalOpen}
        title="Account Administration"
        onClose={() => { setIsModalOpen(false); setSelectedUser(null); }}
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center font-bold text-xl text-white shadow-lg">
                {selectedUser.name?.[0] || 'U'}
              </div>
              <div className="min-w-0">
                <h4 className="text-lg font-bold text-white truncate">{selectedUser.name}</h4>
                <p className="text-sm text-slate-500 truncate">{selectedUser.email}</p>
                <div className="flex gap-2 mt-1">
                   <AdminStatusBadge status={selectedUser.status} size="sm" />
                   {selectedUser.role === 'admin' && <AdminStatusBadge status="verified" size="sm" />}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/50">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Joined Platform</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-sm font-medium text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/50">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Gamification Rank</p>
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-sm font-medium text-white">{selectedUser.points.toLocaleString()} XP</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Administrative Actions</p>
              
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction(selectedUser.id, 'emailVerified', !selectedUser.emailVerified)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg ${
                    selectedUser.emailVerified 
                      ? 'bg-slate-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {selectedUser.emailVerified ? 'Unverify Email' : 'Verify Email'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction(selectedUser.id, 'status', selectedUser.status === 'suspended' ? 'active' : 'suspended')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg ${
                    selectedUser.status === 'suspended'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20'
                  }`}
                >
                  {selectedUser.status === 'suspended' ? <CheckCircle className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                  {selectedUser.status === 'suspended' ? 'Unsuspend User' : 'Suspend Account'}
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAction(selectedUser.id, 'role', selectedUser.role === 'admin' ? 'user' : 'admin')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition"
              >
                <Shield className="h-3.5 w-3.5 text-violet-400" />
                {selectedUser.role === 'admin' ? 'Remove Admin Privileges' : 'Promote to Administrator'}
              </motion.button>
            </div>
            
            <div className="flex gap-3 pt-2">
               <button 
                 onClick={() => { setIsModalOpen(false); setSelectedUser(null); }}
                 className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-bold transition"
               >
                 Close
               </button>
            </div>
          </div>
        )}
      </AdminModal>
    </motion.div>
  );
}

/**
 * User Engagement Analytics Component
 */
export function UserEngagementAnalytics() {
  const [engagement, setEngagement] = useState({
    dailyActiveUsers: 0,
    weeklyActiveUsers: 0,
    monthlyActiveUsers: 0,
    averageSessionDuration: 0,
    returnRate: 0,
    topFeatures: [],
  });

  useEffect(() => {
    const fetchEngagement = async () => {
      try {
        const response = await fetch('/api/admin/analytics/engagement');
        const data = await response.json();
        setEngagement(data);
      } catch (error) {
        console.error('Error fetching engagement data:', error);
      }
    };
    fetchEngagement();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <AdminCard title="Engagement Metrics">
        <div className="space-y-4">
          <div>
            <p className="text-slate-400 text-sm">Daily Active Users (DAU)</p>
            <p className="text-3xl font-bold text-white mt-1">{engagement.dailyActiveUsers}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Weekly Active Users (WAU)</p>
            <p className="text-3xl font-bold text-white mt-1">{engagement.weeklyActiveUsers}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Monthly Active Users (MAU)</p>
            <p className="text-3xl font-bold text-white mt-1">{engagement.monthlyActiveUsers}</p>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="User Behavior">
        <div className="space-y-4">
          <div>
            <p className="text-slate-400 text-sm">Avg Session Duration</p>
            <p className="text-3xl font-bold text-white mt-1">
              {engagement.averageSessionDuration} min
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Return Rate</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">
              {engagement.returnRate}%
            </p>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Top Features" className="lg:col-span-2">
        <div className="space-y-2">
          {engagement.topFeatures?.map((feature, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/20 rounded">
              <div>
                <p className="text-white font-medium">{feature.name}</p>
                <p className="text-slate-400 text-sm">{feature.usage} uses</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 font-semibold">{feature.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </motion.div>
  );
}
