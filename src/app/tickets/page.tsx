'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ticketApi } from '@/services/api/ticket.api';
import {
  Ticket as TicketIcon,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Wrench,
  AlertCircle,
  FileText,
  Filter,
  Layers,
} from 'lucide-react';

export default function TicketsPage() {
  const { currentUser, isAuthenticated, getAuthHeaders } = useAuth();
  const currentRole = currentUser?.role || 'GUEST_USER';

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [onlyMine, setOnlyMine] = useState<boolean>(false);

  const fetchTickets = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await ticketApi.getAll();
      if (data.tickets) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    const handleFocus = () => fetchTickets();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUser, isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  // Quick Approve Action (if any tickets were in pending approval)
  const handleQuickApprove = async (ticketId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await ticketApi.approve(ticketId, {});
      fetchTickets();
    } catch (err) {
      console.error('Quick approve failed:', err);
    }
  };

  // Filter Logic
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      (ticket.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (ticket.ticketNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (ticket.websiteName || '').toLowerCase().includes(search.toLowerCase()) ||
      (ticket.module || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter;
    const matchesMine =
      !onlyMine ||
      ticket.createdById === currentUser?.id ||
      ticket.assignedToId === currentUser?.id ||
      ticket.testedById === currentUser?.id ||
      (Boolean((currentUser as any)?.teamId) && ticket.teamId === (currentUser as any)?.teamId);

    return matchesSearch && matchesStatus && matchesPriority && matchesMine;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <TicketIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Support Tickets Desk</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Manage, filter, and track technical issues across target client platforms in real time.
          </p>
        </div>

        <Link
          href="/tickets/new"
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Raise New Ticket</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, title, module..."
              className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved / Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING_TESTING">Pending Testing</option>
            <option value="RESOLVED">Resolved</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Role Mine Toggle */}
          <button
            onClick={() => setOnlyMine(!onlyMine)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
              onlyMine
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white border-transparent shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{onlyMine ? 'Showing My Tickets' : 'Filter My Tickets'}</span>
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
            Loading tickets from database...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching tickets found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              There are no tickets matching your current search or filter criteria in the database.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredTickets.map((t) => (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">{t.ticketNumber}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                      {t.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-white ${
                      t.priority === 'URGENT'
                        ? 'bg-rose-600'
                        : t.priority === 'HIGH'
                        ? 'bg-orange-500'
                        : t.priority === 'MEDIUM'
                        ? 'bg-indigo-600'
                        : 'bg-slate-500'
                    }`}>
                      {t.priority}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${`badge-status-${t.status}`}`}>
                      {t.status.replace('_', ' ')}
                    </span>

                    {t.environment && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
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
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        t.testingStatus === 'PASSED'
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : t.testingStatus === 'FAILED'
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          : 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}>
                        Test: {t.testingStatus}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {t.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{t.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                    <span>Platform: <strong className="text-slate-600 dark:text-slate-300">{t.websiteName || 'N/A'}</strong></span>
                    <span>Module: <strong className="text-slate-600 dark:text-slate-300">{t.module || 'N/A'}</strong></span>
                    <span>Submitted by: <strong className="text-slate-600 dark:text-slate-300">{t.createdBy?.name || 'Guest User'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {t.status === 'PENDING_APPROVAL' && (
                    <button
                      onClick={(e) => handleQuickApprove(t.id, e)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      Approve
                    </button>
                  )}

                  <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
