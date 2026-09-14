'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { teamApi } from '@/services/api/team.api';
import { ticketApi } from '@/services/api/ticket.api';
import {
  Users,
  Building,
  Wrench,
  Clock,
  ChevronRight,
  ShieldCheck,
  Ticket as TicketIcon,
  PlusCircle,
  Trash2,
} from 'lucide-react';

export default function TeamPage() {
  const { currentUser, isAuthenticated, getAuthHeaders } = useAuth();
  const currentRole = currentUser?.role;

  const [teams, setTeams] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Add Member Modal State
  const [selectedTeamForAdd, setSelectedTeamForAdd] = useState<any | null>(null);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<string>('');
  const [addingMember, setAddingMember] = useState<boolean>(false);
  const [seenTicketIds, setSeenTicketIds] = useState<Set<string>>(new Set());
  const [workDeskTab, setWorkDeskTab] = useState<'ACTIVE' | 'PENDING_TESTING'>('ACTIVE');

  useEffect(() => {
    if (currentUser?.id) {
      try {
        const raw = localStorage.getItem(`seen_tickets_${currentUser.id}`) || '[]';
        const list = JSON.parse(raw);
        setSeenTicketIds(new Set(list));
      } catch (e) { }
    }
  }, [currentUser]);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [dataTeams, dataTickets, dataUsers] = await Promise.all([
        teamApi.getTeams(),
        ticketApi.getAll(),
        teamApi.getUsers(),
      ]);

      if (dataTeams.teams) setTeams(dataTeams.teams);
      if (dataTickets.tickets) setTickets(dataTickets.tickets);
      if (dataUsers.users) setUsers(dataUsers.users);
    } catch (err) {
      console.error('Failed to fetch team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, isAuthenticated]);

  const handleAddMember = async () => {
    if (!selectedTeamForAdd || !selectedUserIdToAdd) return;
    setAddingMember(true);
    try {
      const { apiClient } = await import('@/lib/apiClient');
      await apiClient(`/api/v1/teams/${selectedTeamForAdd.id}/members`, {
        method: 'POST',
        body: { userId: selectedUserIdToAdd },
      });
      setSelectedTeamForAdd(null);
      setSelectedUserIdToAdd('');
      fetchData();
    } catch (err) {
      console.error('Failed to add member to team:', err);
    } finally {
      setAddingMember(false);
    }
  };

  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await teamApi.createTeam({ name: newTeamName, description: newTeamDesc });
      setNewTeamName('');
      setNewTeamDesc('');
      setShowCreateTeamModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create team:', err);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete the team "${teamName}"?`)) return;
    try {
      const { apiClient } = await import('@/lib/apiClient');
      await apiClient(`/api/v1/teams/${teamId}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    try {
      const { apiClient } = await import('@/lib/apiClient');
      await apiClient(`/api/v1/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to remove member from team:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-6">
        <div className="bg-white dark:bg-[#0f172a] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-lg shadow-indigo-500/30">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Sign In Required</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The IT Work Desk & Teams overview is restricted to authenticated IT technical staff, Managers, and Administrators.
          </p>
          <Link
            href="/login"
            className="w-full py-3 rounded-xl bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all block"
          >
            Log In to Access Work Desk
          </Link>
        </div>
      </div>
    );
  }

  if (currentUser?.role === 'GUEST_USER') {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-6">
        <div className="bg-white dark:bg-[#0f172a] p-8 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-cyan-400 flex items-center justify-center font-bold text-2xl mx-auto border border-indigo-200 dark:border-indigo-800">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Access Restricted</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The IT Work Desk & Teams overview is restricted to authenticated portal staff. Normal guest users do not have permission to access internal team desks.
          </p>
          <Link
            href="/tickets"
            className="w-full py-3 rounded-xl bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all block"
          >
            Return to Tickets Portal
          </Link>
        </div>
      </div>
    );
  }

  const isITSpecialist = currentUser?.role === 'IT_SOFTWARE';
  const activeAssignedTickets = tickets.filter(
    (t) =>
      (t.assignedToId === currentUser?.id || t.testedById === currentUser?.id || ((currentUser as any)?.teamId && t.teamId === (currentUser as any)?.teamId)) &&
      ['ASSIGNED', 'IN_PROGRESS', 'NEED_MORE_DETAILS', 'APPROVED', 'SUBMITTED', 'PENDING_APPROVAL'].includes(t.status)
  );

  const pendingTestingTickets = tickets.filter(
    (t) =>
      (t.assignedToId === currentUser?.id || t.testedById === currentUser?.id || ((currentUser as any)?.teamId && t.teamId === (currentUser as any)?.teamId)) &&
      t.status === 'PENDING_TESTING'
  );

  const assignedTickets = workDeskTab === 'ACTIVE' ? activeAssignedTickets : pendingTestingTickets;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-indigo-600 via-indigo-700 to-cyan-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/15 text-cyan-200 border border-white/20 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 backdrop-blur-md">
              <Users className="w-3.5 h-3.5" />
              {isITSpecialist ? 'IT Team Work Desk' : 'Teams Management'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {isITSpecialist ? 'IT Operations & Teams' : 'Teams & Resource Roster'}
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm max-w-2xl font-medium">
            {isITSpecialist
              ? 'View assigned technical tickets, log work hours, update bug investigation statuses, and review active subcontractor teams.'
              : 'Manage engineering teams, assign technical specialists to subcontractor units, and monitor active operational rosters.'}
          </p>
        </div>

        {isITSpecialist ? (
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 text-center shrink-0 w-full md:w-auto shadow-sm">
            <p className="text-3xl font-black text-cyan-300">{assignedTickets.length}</p>
            <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider">Tickets Assigned to You</p>
          </div>
        ) : (
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 text-center shrink-0 w-full md:w-auto shadow-sm">
            <p className="text-3xl font-black text-cyan-300">{teams.length}</p>
            <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider">Active Teams</p>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      {isITSpecialist ? (
        /* IT Specialist Split View: My Assigned Work Desk on Left (7 cols), Subcontractor Teams on Right (5 cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: My Assigned Tickets (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                  <span>My Assigned Technical Work Desk</span>
                </h2>

                <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl border border-slate-300/60 dark:border-slate-700 w-full sm:w-auto">
                  <button
                    onClick={() => setWorkDeskTab('ACTIVE')}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                      workDeskTab === 'ACTIVE'
                        ? 'bg-linear-to-r from-indigo-600 to-cyan-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Active Work ({activeAssignedTickets.length})
                  </button>
                  <button
                    onClick={() => setWorkDeskTab('PENDING_TESTING')}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                      workDeskTab === 'PENDING_TESTING'
                        ? 'bg-linear-to-r from-indigo-600 to-cyan-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    In Testing ({pendingTestingTickets.length})
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                    Loading assigned tickets...
                  </div>
                ) : assignedTickets.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <TicketIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {workDeskTab === 'ACTIVE'
                        ? 'No active tickets currently assigned to you'
                        : 'No tickets currently pending testing'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {workDeskTab === 'ACTIVE'
                        ? 'When a ticket is assigned to you, it will appear here.'
                        : 'Tickets marked as Pending Testing will appear here.'}
                    </p>
                  </div>
                ) : (
                  assignedTickets.map((t) => {
                    const isSeen = seenTicketIds.has(t.id);
                    return (
                      <div key={t.id} className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400">{t.ticketNumber}</span>
                            {!isSeen ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-white animate-pulse">
                                NEW UNREAD
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                VIEWED
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                              {t.status.replace('_', ' ')}
                            </span>
                            {t.environment && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                                t.environment === 'PROD'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : t.environment === 'UAT'
                                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              }`}>
                                Env: {t.environment}
                              </span>
                            )}
                            {t.testingStatus && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                                t.testingStatus === 'PASSED'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                  : t.testingStatus === 'FAILED'
                                  ? 'bg-red-100 dark:bg-red-950/60 text-red-900 dark:text-red-300 border-red-300 dark:border-red-700'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                              }`}>
                                Test: {t.testingStatus}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{t.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t.websiteName} • {t.module} {t.branchName ? `• Branch: ${t.branchName}` : ''}</p>
                        </div>

                        <Link
                          href={`/tickets/${t.id}`}
                          className={`w-full sm:w-auto text-center px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            !isSeen
                              ? 'bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-md shadow-indigo-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {!isSeen ? 'Open New Ticket' : 'Open & Log Work'}
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: Subcontractor Teams List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>Teams</span>
              </h2>

              {loading ? (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                  Loading teams...
                </div>
              ) : teams.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs font-medium">
                  No teams registered.
                </div>
              ) : (
                <div className="space-y-4">
                  {teams.map((team) => {
                    const teamMembers = users.filter((u) => u.teamId === team.id);
                    const memberCount = teamMembers.length || team.members?.length || 0;

                    return (
                      <div key={team.id} className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">{team.name}</h3>
                          <span className="text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-0.5 rounded-full shrink-0">
                            {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{team.description}</p>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Team Members</span>
                          </div>

                          {teamMembers.length === 0 ? (
                            <p className="text-[11px] text-slate-400 font-medium italic">No members assigned yet.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {teamMembers.map((m: any) => (
                                <div
                                  key={m.id}
                                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
                                >
                                  <img
                                    src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=6366f1&color=fff`}
                                    alt={m.name}
                                    className="w-4 h-4 rounded-full object-cover shrink-0"
                                  />
                                  <span>{m.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Manager & Super Admin View: Full Width Subcontractor Teams Management Roster */
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-black text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
                <span>Audit & Engineering Teams Roster</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Assign engineers and specialists to operational subcontractor units.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-extrabold px-3 py-1 rounded-full">
                {teams.length} Registered Teams
              </span>
              {(currentRole === 'SUPER_ADMIN' || currentRole === 'MANAGER') && (
                <button
                  onClick={() => setShowCreateTeamModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all hover:scale-105 shrink-0 active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create New Team</span>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              Loading teams and members...
            </div>
          ) : teams.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              No teams registered.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team) => {
                const teamMembers = users.filter((u) => u.teamId === team.id);
                const memberCount = teamMembers.length || team.members?.length || 0;

                return (
                  <div key={team.id} className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{team.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{team.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-start">
                        <span className="text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full">
                          {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                        </span>
                        {(currentRole === 'SUPER_ADMIN' || currentRole === 'MANAGER') && (
                          <button
                            onClick={() => handleDeleteTeam(team.id, team.name)}
                            title={`Delete team ${team.name}`}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Members List */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Assigned Team Members</span>
                        <button
                          onClick={() => { setSelectedTeamForAdd(team); setSelectedUserIdToAdd(''); }}
                          className="text-xs font-extrabold text-indigo-600 dark:text-cyan-400 hover:text-indigo-700 dark:hover:text-cyan-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          + Add Member
                        </button>
                      </div>

                      {teamMembers.length === 0 ? (
                        <p className="text-xs text-slate-400 font-medium italic">No members assigned to this team yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {teamMembers.map((m: any) => (
                            <div
                              key={m.id}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs group"
                            >
                              <img
                                src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=6366f1&color=fff`}
                                alt={m.name}
                                className="w-5 h-5 rounded-full object-cover shrink-0"
                              />
                              <span>{m.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({m.role.replace('_', ' ')})</span>
                              <button
                                onClick={() => handleRemoveMember(team.id, m.id)}
                                title="Remove from team"
                                className="text-slate-400 hover:text-red-500 transition-colors ml-1 text-sm font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      {selectedTeamForAdd && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              <span>Add Member to {selectedTeamForAdd.name}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select a registered user to add to this team:</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select User</label>
              <select
                value={selectedUserIdToAdd}
                onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                className="w-full p-2.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">-- Choose User --</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.replace('_', ' ')}) - {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setSelectedTeamForAdd(null); setSelectedUserIdToAdd(''); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedUserIdToAdd || addingMember}
                onClick={handleAddMember}
                className="px-4 py-2 rounded-xl bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
              >
                {addingMember ? 'Adding...' : 'Add Member to Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTeam} className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              <span>Create New Operational Team</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Register a new engineering or subcontractor team unit.</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Team Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Mobile Engineering Team"
                className="w-full px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={newTeamDesc}
                onChange={(e) => setNewTeamDesc(e.target.value)}
                placeholder="Brief summary of team responsibilities..."
                className="w-full px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowCreateTeamModal(false); setNewTeamName(''); setNewTeamDesc(''); }}
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
