'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ticketApi } from '@/services/api/ticket.api';
import { recommendationApi } from '@/services/api/recommendation.api';
import { teamApi } from '@/services/api/team.api';
import {
  Ticket as TicketIcon,
  Lightbulb,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Wrench,
  ShieldCheck,
  Crown,
  ChevronRight,
  ThumbsUp,
  Building,
  LogIn,
  Zap,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, isAuthenticated, getAuthHeaders } = useAuth();
  const currentRole = currentUser?.role || 'GUEST_USER';

  const [tickets, setTickets] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Manager Approval Modal State
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [targetClosureDate, setTargetClosureDate] = useState<string>('');
  const [teams, setTeams] = useState<any[]>([]);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
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
    setLoading(true);
    try {
      const [dataTickets, dataRecs, dataTeams] = await Promise.all([
        ticketApi.getAll(),
        recommendationApi.getAll(),
        teamApi.getTeams(),
      ]);

      if (dataTickets.tickets) setTickets(dataTickets.tickets);
      if (dataRecs.recommendations) setRecommendations(dataRecs.recommendations);
      if (dataTeams.teams) setTeams(dataTeams.teams);

      if (currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN') {
        try {
          const [dataAdmin, dataUsers] = await Promise.all([
            teamApi.getAdminMetrics(),
            teamApi.getUsers(),
          ]);
          if (dataAdmin.metrics) setMetrics(dataAdmin.metrics);
          if (dataUsers.users) setUsers(dataUsers.users);
        } catch (e) {
          console.error('Failed to fetch admin metrics:', e);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUser, currentRole]);

  const handleApprove = async () => {
    if (!selectedTicket) return;
    try {
      await ticketApi.approve(selectedTicket.id, {
        assignedToId: assigneeId || undefined,
        teamId: selectedTeamId || undefined,
        targetClosureDate: targetClosureDate || undefined,
      });
      setShowApproveModal(false);
      setSelectedTicket(null);
      fetchData();
    } catch (e) {
      console.error('Approve failed:', e);
    }
  };

  const handleReject = async () => {
    if (!selectedTicket || !rejectReason) return;
    try {
      await ticketApi.reject(selectedTicket.id, rejectReason);
      setShowRejectModal(false);
      setSelectedTicket(null);
      setRejectReason('');
      fetchData();
    } catch (e) {
      console.error('Reject failed:', e);
    }
  };

  const handleUpvote = async (recId: string) => {
    try {
      const data = await recommendationApi.toggleUpvote(recId);
      if (data.recommendation) {
        setRecommendations((prevRecs) =>
          prevRecs.map((r) => (r.id === recId ? data.recommendation : r))
        );
      }
    } catch (e) {
      console.error('Upvote failed:', e);
      fetchData();
    }
  };

  const pendingTickets = tickets.filter((t) => t.status === 'PENDING_APPROVAL');
  const mySubmittedTickets = tickets.filter((t) => t.createdById === currentUser?.id);

  const activeAssignedTickets = tickets.filter(
    (t) =>
      (t.assignedToId === currentUser?.id || ((currentUser as any)?.teamId && t.teamId === (currentUser as any)?.teamId)) &&
      ['ASSIGNED', 'IN_PROGRESS', 'NEED_MORE_DETAILS', 'APPROVED', 'SUBMITTED'].includes(t.status)
  );

  const pendingTestingTickets = tickets.filter(
    (t) =>
      (t.assignedToId === currentUser?.id || ((currentUser as any)?.teamId && t.teamId === (currentUser as any)?.teamId)) &&
      t.status === 'PENDING_TESTING'
  );

  const myAssignedTickets = workDeskTab === 'ACTIVE' ? activeAssignedTickets : pendingTestingTickets;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome & Role Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 translate-y-12 w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white border border-white/30 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs backdrop-blur-xs flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-300" />
                <span>{currentRole.replace('_', ' ')}</span>
              </span>
              <span className="text-cyan-200 text-xs font-semibold">NextGen Operational Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {currentUser?.name}!
            </h1>
            <p className="text-indigo-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {currentRole === 'GUEST_USER'
                ? 'Submit support tickets directly without manager approval, attach diagnostic screenshots, track live status, and recommend features.'
                : currentRole === 'IT_SOFTWARE'
                  ? 'Manage technical tickets, log work hours, update bug statuses, and record internal notes.'
                  : currentRole === 'MANAGER'
                    ? 'Oversee incoming client requests, assign to IT teams, review work logs, and ensure SLA compliance.'
                    : 'Monitor overall platform health, track developer work hours, configure teams, and audit ticket lifecycles.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
            {currentRole === 'SUPER_ADMIN' && (
              <Link
                href="/admin"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span>Super Admin Console</span>
              </Link>
            )}
            <Link
              href="/tickets/new"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>Raise New Ticket</span>
            </Link>
            <Link
              href="/recommendations"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center gap-2 border border-white/20 transition-all backdrop-blur-xs"
            >
              <Lightbulb className="w-4 h-4 text-amber-300" />
              <span>Suggest Feature</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <TicketIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tickets</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{tickets.length}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">In system</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Queue</p>
            <h3 className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {tickets.filter((t) => ['SUBMITTED', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Ready / in progress</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resolved</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.completedTickets !== undefined
                ? metrics.completedTickets
                : tickets.filter((t) => ['RESOLVED', 'COMPLETED', 'CLOSED'].includes(t.status)).length}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Issues closed</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Teams</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalTeams || teams.length}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Active units</p>
          </div>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tickets Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Super Admin Section */}
          {currentRole === 'SUPER_ADMIN' && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-500/30 shadow-xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-800/60 pb-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h2 className="font-extrabold text-sm tracking-tight text-amber-300">
                    Super Admin Executive Management Desk
                  </h2>
                </div>
                <Link
                  href="/admin"
                  className="text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1"
                >
                  <span>Full Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] uppercase font-bold text-indigo-200">Active Tickets</p>
                  <p className="text-2xl font-black text-white">
                    {metrics.approvedTickets !== undefined
                      ? metrics.approvedTickets
                      : tickets.filter((t) => ['APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'COMPLETED', 'CLOSED'].includes(t.status)).length}
                  </p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] uppercase font-bold text-indigo-200">Total Teams</p>
                  <p className="text-2xl font-black text-white">{metrics.totalTeams || 2}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] uppercase font-bold text-indigo-200">Registered Users</p>
                  <p className="text-2xl font-black text-white">{metrics.totalUsers || 5}</p>
                </div>
              </div>
            </div>
          )}

          {/* IT Staff Desk (Level 2) */}
          {currentRole === 'IT_SOFTWARE' && (
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-indigo-200 dark:border-indigo-900/50 shadow-xs overflow-hidden transition-colors">
              <div className="px-6 py-4 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="font-extrabold text-slate-900 dark:text-white text-sm">Assigned Technical Work Desk</h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-indigo-100/70 dark:bg-indigo-900/50 p-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <button
                      onClick={() => setWorkDeskTab('ACTIVE')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        workDeskTab === 'ACTIVE'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-indigo-900 dark:text-indigo-300 hover:text-indigo-950'
                      }`}
                    >
                      Active Work ({activeAssignedTickets.length})
                    </button>
                    <button
                      onClick={() => setWorkDeskTab('PENDING_TESTING')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        workDeskTab === 'PENDING_TESTING'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-indigo-900 dark:text-indigo-300 hover:text-indigo-950'
                      }`}
                    >
                      In Testing ({pendingTestingTickets.length})
                    </button>
                  </div>

                  <Link href="/team" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0 ml-2">
                    <span>Go to Work Desk</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {myAssignedTickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                    {workDeskTab === 'ACTIVE'
                      ? 'No active tickets currently assigned to you.'
                      : 'No tickets currently pending testing.'}
                  </div>
                ) : (
                  myAssignedTickets.map((t) => {
                    const isSeen = seenTicketIds.has(t.id);
                    return (
                      <div key={t.id} className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{t.ticketNumber}</span>
                            {!isSeen ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-white animate-pulse">
                                NEW UNREAD
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                VIEWED
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${`badge-status-${t.status}`}`}>
                              {t.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t.title}</h3>
                        </div>

                        <Link
                          href={`/tickets/${t.id}`}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            !isSeen
                              ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white shadow-md shadow-indigo-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {!isSeen ? 'Open Ticket' : 'View Details'}
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tickets Stream Table */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <TicketIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{currentRole === 'GUEST_USER' ? 'My Support Tickets' : 'Recent Support Tickets'}</span>
              </h2>
              <Link href="/tickets" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                <span>View All Tickets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                  No tickets found. Click "Raise New Ticket" to create your first issue!
                </div>
              ) : (
                tickets.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{t.ticketNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {t.category}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${`badge-status-${t.status}`}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        <Link href={`/tickets/${t.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          {t.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t.websiteName || 'General Portal'} • {t.module || 'Core'}</p>
                    </div>

                    <Link
                      href={`/tickets/${t.id}`}
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recommendations & Platform Info */}
        <div className="space-y-6">
          {/* Feature Suggestions Widget */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
            <div className="px-6 py-4 bg-indigo-50/50 dark:bg-indigo-950/40 border-b border-indigo-200/60 dark:border-indigo-900/50 flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Popular Recommendations</span>
              </h2>
              <Link href="/recommendations" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="p-5 space-y-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs font-medium">
                  No feature suggestions posted yet.
                </div>
              ) : (
                recommendations.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">{rec.title}</h4>
                      {(() => {
                        const hasUserVoted = Array.isArray(rec.votes)
                          ? rec.votes.some((v: any) => v.userId === currentUser?.id)
                          : (rec.votedUserIds && Array.isArray(rec.votedUserIds) ? rec.votedUserIds.includes(currentUser?.id) : rec.userVoted);

                        return (
                          <button
                            onClick={() => handleUpvote(rec.id)}
                            title={hasUserVoted ? "Click to remove your upvote" : "Click to upvote"}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold shrink-0 transition-colors ${
                              hasUserVoted
                                ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-xs'
                                : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white'
                            }`}
                          >
                            <ThumbsUp className={`w-3 h-3 ${hasUserVoted ? 'fill-white' : ''}`} />
                            <span>{rec.upvotes}</span>
                          </button>
                        );
                      })()}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 whitespace-pre-line">{rec.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium pt-1">
                      <span>{rec.websiteName}</span>
                      <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-bold">{rec.status}</span>
                    </div>
                  </div>
                ))
              )}

              <Link
                href="/recommendations"
                className="w-full py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit Feature Suggestion</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Approve & Assign IT Specialist Modal */}
      {showApproveModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Assign Ticket #{selectedTicket.ticketNumber}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{selectedTicket.title}</p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Team (Broadcasts to all team members)
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => {
                    const teamId = e.target.value;
                    setSelectedTeamId(teamId);
                    if (teamId && assigneeId) {
                      const foundUser = users.find((u) => u.id === assigneeId);
                      const isMember =
                        foundUser?.teamId === teamId ||
                        foundUser?.teams?.some((t: any) => t.id === teamId);
                      if (!isMember) setAssigneeId('');
                    }
                  }}
                  className="w-full p-2.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- No Specific Team --</option>
                  {teams.map((tm: any) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name} ({tm.members?.length || 0} Members)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign IT Specialist / Engineer
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => {
                    const userId = e.target.value;
                    setAssigneeId(userId);
                    if (userId) {
                      const foundUser = users.find((u) => u.id === userId);
                      if (foundUser?.teamId) {
                        setSelectedTeamId(foundUser.teamId);
                      } else if (foundUser?.teams && foundUser.teams.length > 0) {
                        setSelectedTeamId(foundUser.teams[0].id);
                      }
                    }
                  }}
                  className="w-full p-2.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Leave Unassigned for now --</option>
                  {users.filter((u) => u.role === 'IT_SOFTWARE').map((u: any) => {
                    const userTeam = teams.find((t: any) => t.id === u.teamId || t.members?.some((m: any) => m.id === u.id));
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} {userTeam ? `[Team: ${userTeam.name}]` : `(${u.jobTitle || 'IT Specialist'})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Target Closure / SLA Due Date (Optional)</span>
                </label>
                <input
                  type="date"
                  value={targetClosureDate}
                  onChange={(e) => setTargetClosureDate(e.target.value)}
                  className="w-full p-2.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowApproveModal(false); setSelectedTicket(null); setAssigneeId(''); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white text-xs font-bold shadow-md"
              >
                Assign Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Reject Ticket #{selectedTicket.ticketNumber}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Provide a clear rejection reason for the client:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Insufficient details provided / Works as intended per spec."
              rows={3}
              className="w-full p-3 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/40 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowRejectModal(false); setSelectedTicket(null); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
