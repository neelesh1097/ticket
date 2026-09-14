'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { configApi } from '@/services/api/config.api';
import { recommendationApi } from '@/services/api/recommendation.api';
import { teamApi } from '@/services/api/team.api';
import { ticketApi } from '@/services/api/ticket.api';
import {
  Crown,
  Clock,
  Ticket as TicketIcon,
  Users,
  ShieldCheck,
  CheckCircle2,
  Building,
  PlusCircle,
  Search,
  Globe,
  Layers,
  Trash2,
  Lightbulb,
  UserCheck,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { currentUser, isAuthenticated, getAuthHeaders } = useAuth();
  const currentRole = currentUser?.role || 'GUEST_USER';

  const [metrics, setMetrics] = useState<any>({});
  const [teams, setTeams] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Predefined Websites & Modules State
  const [targetWebsites, setTargetWebsites] = useState<any[]>([]);
  const [targetModules, setTargetModules] = useState<any[]>([]);
  const [newWebName, setNewWebName] = useState('');
  const [newWebUrl, setNewWebUrl] = useState('');
  const [newModName, setNewModName] = useState('');
  const [newModCategory, setNewModCategory] = useState('');
  const [newModWebsiteId, setNewModWebsiteId] = useState('');
  const [moduleFilterWebsiteId, setModuleFilterWebsiteId] = useState('ALL');

  // Subcontractor Team Form State
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  // Timesheet Filter
  const [timeFilter, setTimeFilter] = useState('');

  const fetchConfigOptions = async () => {
    try {
      const data = await configApi.getOptions();
      if (data.websites) {
        setTargetWebsites(data.websites);
        if (data.websites.length > 0) {
          setNewModWebsiteId((prev) => prev || data.websites[0].id);
        }
      }
      if (data.modules) setTargetModules(data.modules);
    } catch (e) {
      console.error('Failed to fetch config options:', e);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const data = await recommendationApi.getAll();
      if (data.recommendations) setRecommendations(data.recommendations);
    } catch (e) {
      console.error('Failed to fetch recommendations in admin:', e);
    }
  };

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [dataAdmin, dataTeams, dataTickets, dataUsers] = await Promise.all([
        teamApi.getAdminMetrics(timeFilter),
        teamApi.getTeams(),
        ticketApi.getAll(),
        teamApi.getUsers(),
      ]);

      if (dataAdmin.metrics) setMetrics(dataAdmin.metrics);
      if (dataTeams.teams) setTeams(dataTeams.teams);
      if (dataTickets.tickets) setTickets(dataTickets.tickets);
      if (dataUsers.users) setUsers(dataUsers.users);
      fetchConfigOptions();
      fetchRecommendations();
    } catch (err) {
      console.error('Failed to fetch admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, isAuthenticated]);

  const handleAssignTeamToRec = async (recId: string, teamId: string) => {
    try {
      await recommendationApi.assign(recId, { teamId: teamId || null });
      fetchRecommendations();
    } catch (e) {
      console.error('Assign team failed:', e);
    }
  };

  const handleAssignSpecialistToRec = async (recId: string, userId: string) => {
    try {
      let targetTeamId = undefined;
      if (userId) {
        const found = users.find((u) => u.id === userId);
        if (found?.teamId) targetTeamId = found.teamId;
      }
      await recommendationApi.assign(recId, { assignedToId: userId || null, teamId: targetTeamId });
      fetchRecommendations();
    } catch (e) {
      console.error('Assign specialist failed:', e);
    }
  };

  const handleUpdateRecStatus = async (recId: string, status: string) => {
    try {
      await recommendationApi.updateStatus(recId, status);
      fetchRecommendations();
    } catch (e) {
      console.error('Update recommendation status failed:', e);
    }
  };

  const handleConvertRecToTicket = async (recId: string, teamId?: string, assignedToId?: string) => {
    try {
      const data = await recommendationApi.convertToTicket(recId, teamId, assignedToId);
      if (data.ticket) {
        alert(`Suggestion successfully converted to active ticket ${data.ticket.ticketNumber}!`);
        fetchRecommendations();
        fetchData();
      } else {
        alert(data.message || 'Failed to convert suggestion to ticket.');
      }
    } catch (e: any) {
      console.error('Convert to ticket failed:', e);
      alert('Convert to ticket error: ' + (e.message || 'Failed to convert'));
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { apiClient } = await import('@/lib/apiClient');
      await apiClient(`/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: { role: newRole },
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update user role:', err);
    }
  };

  const handleAddTeamToUser = async (userId: string, teamId: string) => {
    if (!teamId) return;
    try {
      const { apiClient } = await import('@/lib/apiClient');
      await apiClient(`/api/v1/teams/${teamId}/members`, {
        method: 'POST',
        body: { userId },
      });
      fetchData();
    } catch (err) {
      console.error('Failed to add user to team:', err);
    }
  };

  const handleRemoveTeamFromUser = async (userId: string, teamId: string) => {
    try {
      const { apiClient } = await import('@/lib/apiClient');
      await apiClient(`/api/v1/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to remove user from team:', err);
    }
  };

  const handleAddTargetWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebName.trim()) return;
    try {
      await configApi.addWebsite(newWebName, newWebUrl);
      setNewWebName('');
      setNewWebUrl('');
      fetchConfigOptions();
    } catch (e) {
      console.error('Failed to add website:', e);
    }
  };

  const handleDeleteTargetWebsite = async (id: string) => {
    try {
      await configApi.deleteWebsite(id);
      fetchConfigOptions();
    } catch (e) {
      console.error('Failed to delete website:', e);
    }
  };

  const handleAddTargetModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModName.trim()) return;
    try {
      await configApi.addModule(newModName, newModCategory, newModWebsiteId);
      setNewModName('');
      setNewModCategory('');
      fetchConfigOptions();
    } catch (e) {
      console.error('Failed to add module:', e);
    }
  };

  const handleDeleteTargetModule = async (id: string) => {
    try {
      await configApi.deleteModule(id);
      fetchConfigOptions();
    } catch (e) {
      console.error('Failed to delete module:', e);
    }
  };

  if (!isAuthenticated || (currentRole !== 'SUPER_ADMIN' && currentRole !== 'MANAGER')) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-lg shadow-purple-600/30">
            <Crown className="w-7 h-7 text-amber-300" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The Super Admin Executive Console is restricted to Level 4 Super Administrators (`kavita.reddy@platformglobal.org`) and Level 3 Managers.
          </p>
          <a
            href="/login"
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all block"
          >
            Sign In with Admin Account
          </a>
        </div>
      </div>
    );
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      await teamApi.createTeam({ name: teamName, description: teamDesc });
      setTeamName('');
      setTeamDesc('');
      setShowTeamModal(false);
      fetchData();
    } catch (e) {
      console.error('Failed to create team:', e);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"?`)) return;
    try {
      await fetch(`/api/v1/teams/${teamId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  const workLogs = metrics.recentWorkLogs || [];
  const filteredLogs = workLogs.filter((log: any) => {
    if (!timeFilter) return true;
    const q = timeFilter.toLowerCase();
    return (
      (log.user?.name || '').toLowerCase().includes(q) ||
      (log.ticket?.ticketNumber || '').toLowerCase().includes(q) ||
      (log.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-indigo-600 via-indigo-700 to-cyan-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/15 text-cyan-200 border border-white/20 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 backdrop-blur-md">
              <Crown className="w-3.5 h-3.5" /> Super Admin Control Panel
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Platform Dashboard & Analytics
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm max-w-2xl font-medium">
            Monitor real-time system metrics, review logged work hours, manage teams, and ensure platform optimization.
          </p>
        </div>

        <button
          onClick={() => setShowTeamModal(true)}
          className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold flex items-center justify-center gap-2 shadow-lg backdrop-blur-md transition-all shrink-0 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Team</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tickets</span>
            <TicketIcon className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{metrics.totalTickets || 0}</p>
          <p className="text-[11px] text-slate-400 font-medium">Across all client websites</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Approved Tickets</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics.approvedTickets ?? (metrics.totalTickets ? metrics.totalTickets - (metrics.pendingApprovalTickets || 0) : 0)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Approved by managers</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resolved Tickets</span>
            <CheckCircle2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{metrics.completedTickets || 0}</p>
          <p className="text-[11px] text-slate-400 font-medium">Issues successfully resolved</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Teams</span>
            <Building className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{metrics.totalTeams || teams.length}</p>
          <p className="text-[11px] text-slate-400 font-medium">Subcontractor units</p>
        </div>
      </div>

      {/* User Accounts & Role Governance Section */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-200/80 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>User Accounts & Role Governance Desk</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Super Admin Control: Self-registered users default to GUEST_USER. Assign elevated role levels below.
            </p>
          </div>
          <span className="bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shrink-0">
            {users.length} Users Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">User Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Job Title</th>
                <th className="p-4">Assigned Role Level</th>
                <th className="p-4 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    No users found in database.
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <img
                        src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff`}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <span>{u.name}</span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{u.jobTitle || 'Portal User'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800' :
                        u.role === 'MANAGER' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                          u.role === 'IT_SOFTWARE' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800' :
                            'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {currentRole === 'SUPER_ADMIN' ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2.5 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          <option value="GUEST_USER">Level 1: Guest User</option>
                          <option value="IT_SOFTWARE">Level 2: IT Specialist</option>
                          <option value="MANAGER">Level 3: Manager</option>
                          <option value="SUPER_ADMIN">Level 4: Super Admin</option>
                        </select>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">Super Admin Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Suggestions & SLA Assignment Desk */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>Feature Suggestions & SLA Assignment Desk</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manager & Super Admin Control: Review submitted feature suggestions, update dev status, assign subcontractor team/specialist, or convert directly into an active support ticket.
            </p>
          </div>
          <span className="bg-linear-to-r from-indigo-600 to-cyan-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shrink-0">
            {recommendations.length} Suggestions Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Title & Details</th>
                <th className="p-4">Platform / Module</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assign Operational Team</th>
                <th className="p-4">Assign IT Specialist</th>
                <th className="p-4 text-right">Convert to Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recommendations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No feature suggestions submitted yet.
                  </td>
                </tr>
              ) : (
                recommendations.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <p className="font-extrabold text-slate-900 dark:text-white">{rec.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs">{rec.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">By: {rec.author?.name || 'Guest User'} • Upvotes: {rec.upvotes}</p>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {rec.websiteName}
                      <span className="block text-[10px] text-slate-400">{rec.moduleName}</span>
                    </td>
                    <td className="p-4">
                      <select
                        value={rec.status}
                        onChange={(e) => handleUpdateRecStatus(rec.id, e.target.value)}
                        className="px-2.5 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="SUBMITTED">Submitted</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="PLANNED">Planned</option>
                        <option value="IN_DEVELOPMENT">In Development</option>
                        <option value="IMPLEMENTED">Implemented</option>
                        <option value="DECLINED">Declined</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={rec.teamId || ''}
                        onChange={(e) => handleAssignTeamToRec(rec.id, e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                      >
                        <option value="">-- No Team --</option>
                        {teams.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={rec.assignedToId || ''}
                        onChange={(e) => handleAssignSpecialistToRec(rec.id, e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                      >
                        <option value="">-- Unassigned --</option>
                        {users
                          .filter((u: any) => u.role === 'IT_SOFTWARE' || u.role === 'MANAGER' || u.role === 'SUPER_ADMIN')
                          .filter((u: any) => !rec.teamId || u.teamId === rec.teamId || u.teams?.some((t: any) => t.id === rec.teamId))
                          .map((u: any) => {
                            const userTeam = teams.find((t: any) => t.id === u.teamId || t.members?.some((m: any) => m.id === u.id));
                            return (
                              <option key={u.id} value={u.id}>
                                {u.name} {userTeam ? `[Team: ${userTeam.name}]` : `(${u.jobTitle || 'IT Specialist'})`}
                              </option>
                            );
                          })}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      {rec.isConverted || rec.status === 'IMPLEMENTED' ? (
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Converted {rec.convertedTicketNumber ? `(#${rec.convertedTicketNumber})` : ''}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConvertRecToTicket(rec.id, rec.teamId, rec.assignedToId)}
                          className="px-3 py-1.5 bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-[11px] font-bold rounded-xl flex items-center gap-1 shadow-xs transition-all ml-auto active:scale-95"
                        >
                          <TicketIcon className="w-3.5 h-3.5" />
                          <span>Convert Ticket</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Websites & Target Modules Predefined Config Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Predefined Target Websites */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>Projects & Portals</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configured by Admin/Manager for Raise Ticket & Suggestion dropdowns</p>
            </div>
            <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60">
              {targetWebsites.length} Active
            </span>
          </div>

          {/* Add Website Form */}
          <form onSubmit={handleAddTargetWebsite} className="flex gap-2">
            <input
              type="text"
              required
              value={newWebName}
              onChange={(e) => setNewWebName(e.target.value)}
              placeholder="Website Name (e.g. Acme Billing Portal)"
              className="flex-1 px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
            />
            <input
              type="text"
              value={newWebUrl}
              onChange={(e) => setNewWebUrl(e.target.value)}
              placeholder="URL (optional)"
              className="hidden sm:block w-36 px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-extrabold shadow-xs transition-all shrink-0 active:scale-95"
            >
              + Add
            </button>
          </form>

          {/* Websites List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {targetWebsites.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div className="space-y-0.5 truncate">
                  <p className="font-extrabold text-slate-900 dark:text-white truncate">{w.name}</p>
                  {w.url && <p className="text-[10px] text-slate-400 font-mono truncate">{w.url}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteTargetWebsite(w.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0 ml-2"
                  title="Delete Website"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Predefined Target Modules */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Predefined Modules & Features</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configured by Admin/Manager for Raise Ticket & Suggestion dropdowns</p>
            </div>
            <span className="bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800/60">
              {targetModules.length} Active
            </span>
          </div>

          {/* Add Module Form */}
          <form onSubmit={handleAddTargetModule} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Select Project / Portal</label>
              <select
                value={newModWebsiteId}
                onChange={(e) => setNewModWebsiteId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
              >
                {targetWebsites.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={newModName}
                onChange={(e) => setNewModName(e.target.value)}
                placeholder="Module Name (e.g. Panel Telemetry)"
                className="flex-1 px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-extrabold shadow-xs transition-all shrink-0 active:scale-95"
              >
                + Add Module
              </button>
            </div>
          </form>

          {/* Module Filter & List */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Project Filter:</span>
              <select
                value={moduleFilterWebsiteId}
                onChange={(e) => setModuleFilterWebsiteId(e.target.value)}
                className="text-xs px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Projects ({targetModules.length})</option>
                {targetWebsites.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {targetModules
                .filter((m: any) => moduleFilterWebsiteId === 'ALL' || m.websiteId === moduleFilterWebsiteId)
                .map((m: any) => {
                  const web = targetWebsites.find((w: any) => w.id === m.websiteId);
                  return (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-slate-900 dark:text-white truncate">{m.name}</p>
                        <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold truncate">
                          {web ? web.name : 'General Project'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTargetModule(m.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0 ml-2"
                        title="Delete Module"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Subcontractor Work Logs Timesheet */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Work Log Audit Timesheet</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live billable hours recorded by IT engineering staff</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              placeholder="Search engineer, ticket #..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Engineer / Staff</th>
                <th className="p-4">Ticket Number</th>
                <th className="p-4">Work Description</th>
                <th className="p-4">Hours Logged</th>
                <th className="p-4">Log Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                    Loading timesheet audit logs from database...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    No work logs found. IT staff can log work hours directly inside assigned tickets.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{log.user?.name || 'IT Staff'}</td>
                    <td className="p-4 font-mono font-bold text-indigo-600 dark:text-cyan-400">{log.ticket?.ticketNumber || 'TKT-1001'}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{log.description}</td>
                    <td className="p-4 font-black text-cyan-600 dark:text-cyan-400">{log.hoursSpent} hrs</td>
                    <td className="p-4 text-slate-400">{new Date(log.createdAt || Date.now()).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTeam} className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Add New Team</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Team Name</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Database Optimization Subcontractor"
                className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
                placeholder="Responsibilities, scope, and technical stack..."
                className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
              >
                Create Team
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
