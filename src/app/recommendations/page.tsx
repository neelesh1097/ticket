'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { recommendationApi } from '@/services/api/recommendation.api';
import { teamApi } from '@/services/api/team.api';
import { configApi } from '@/services/api/config.api';
import {
  Lightbulb,
  UploadCloud,
  ThumbsUp,
  Globe,
  Layers,
  PlusCircle,
  CheckCircle2,
  X,
  Image as ImageIcon,
  Building,
  UserCheck,
  Ticket as TicketIcon,
} from 'lucide-react';

export default function RecommendationsPage() {
  const { currentUser, getAuthHeaders } = useAuth();
  const currentRole = currentUser?.role || 'GUEST_USER';

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [websites, setWebsites] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [itUsers, setItUsers] = useState<any[]>([]);
  const [convertedTicketMsg, setConvertedTicketMsg] = useState<string>('');

  // Form State
  const [title, setTitle] = useState('');
  const [websiteName, setWebsiteName] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const fetchConfigOptions = async () => {
    try {
      const data = await configApi.getOptions();
      if (data.websites && data.websites.length > 0) {
        setWebsites(data.websites);
        setWebsiteName(data.websites[0].name);
      }
      if (data.modules && data.modules.length > 0) {
        setModules(data.modules);
      }
    } catch (e) {
      console.error('Failed to fetch config options:', e);
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const data = await recommendationApi.getAll();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigOptions();
    fetchRecommendations();

    teamApi.getTeams()
      .then((d) => d.teams && setTeams(d.teams))
      .catch((e) => console.error('Failed to fetch teams:', e));

    if (currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN' || currentRole === 'IT_SOFTWARE') {
      teamApi.getUsers()
        .then((d) => {
          if (d.users) {
            const list = d.users.filter((u: any) => u.role === 'IT_SOFTWARE' || u.role === 'MANAGER' || u.role === 'SUPER_ADMIN');
            setItUsers(list.length > 0 ? list : d.users);
          }
        })
        .catch((e) => console.error('Failed to fetch users:', e));
    }
  }, [currentUser]);

  const handleAssignTeam = async (recId: string, teamId: string) => {
    try {
      await recommendationApi.assign(recId, { teamId: teamId || null });
      fetchRecommendations();
    } catch (e) {
      console.error('Assign team failed:', e);
    }
  };

  const handleAssignSpecialist = async (recId: string, userId: string) => {
    try {
      let targetTeamId = undefined;
      if (userId) {
        const found = itUsers.find((u) => u.id === userId);
        if (found?.teamId) targetTeamId = found.teamId;
      }
      await recommendationApi.assign(recId, { assignedToId: userId || null, teamId: targetTeamId });
      fetchRecommendations();
    } catch (e) {
      console.error('Assign specialist failed:', e);
    }
  };

  const handleConvertToTicket = async (recId: string, teamId?: string, assignedToId?: string) => {
    try {
      const data = await recommendationApi.convertToTicket(recId, teamId, assignedToId);
      if (data.ticket) {
        setConvertedTicketMsg(`Suggestion converted to Ticket ${data.ticket.ticketNumber}!`);
        setTimeout(() => setConvertedTicketMsg(''), 5000);
        fetchRecommendations();
      } else {
        alert(data.message || 'Failed to convert suggestion to ticket.');
      }
    } catch (e: any) {
      console.error('Convert to ticket failed:', e);
      alert('Convert to ticket error: ' + (e.message || 'Failed to convert'));
    }
  };

  const itSpecialists = itUsers;

  useEffect(() => {
    fetchRecommendations();
    fetchConfigOptions();
  }, [currentUser]);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const displayWebsites = websites.length > 0 ? websites : [
    { id: 'w-1', name: 'Betel PV', url: 'betelpv.orglead.com' },
    { id: 'w-2', name: 'Betel Meet', url: 'betelmeet.orglead.com' },
    { id: 'w-3', name: 'Platform Global Hub', url: 'hub.platformglobal.org' }
  ];

  const selectedRecWebsiteObj = displayWebsites.find((w: any) => w.name === websiteName);
  const rawModules = modules.length > 0 ? modules : [
    { id: 'm-1', name: 'Billing & Invoicing' },
    { id: 'm-2', name: 'Auth & SSO' },
    { id: 'm-3', name: 'Infrastructure & Server Operations' }
  ];

  const displayModules = selectedRecWebsiteObj
    ? rawModules.filter((m: any) => !m.websiteId || m.websiteId === selectedRecWebsiteObj.id)
    : rawModules;

  useEffect(() => {
    if (displayModules.length > 0) {
      if (!displayModules.some((m: any) => m.name === moduleName)) {
        setModuleName(displayModules[0].name);
      }
    }
  }, [websiteName, websites, modules]);

  const handleSubmitRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const finalWebsite = websiteName || (displayWebsites.length > 0 ? displayWebsites[0].name : 'Betel PV');
    const finalModule = moduleName || (displayModules.length > 0 ? displayModules[0].name : 'Billing & Invoicing');

    setIsSubmitting(true);
    try {
      const data = await recommendationApi.create({
        title: title.trim(),
        description: description.trim(),
        websiteName: finalWebsite,
        moduleName: finalModule,
        screenshotUrl: screenshotUrl || undefined,
        authorId: currentUser?.id || '',
      });

      if (data.success || data.recommendation) {
        setTitle('');
        setDescription('');
        setScreenshotUrl('');
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);
        fetchRecommendations();
      } else {
        alert(data.message || 'Failed to submit recommendation.');
      }
    } catch (err) {
      console.error('Failed to submit suggestion:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (recId: string) => {
    if (!currentUser?.id) return;

    // Optimistic UI update for instant feedback
    setRecommendations((prevRecs) =>
      prevRecs.map((rec) => {
        if (rec.id !== recId) return rec;
        const currentVotes = Array.isArray(rec.votes) ? rec.votes : [];
        const hasVoted = currentVotes.some((v: any) => v.userId === currentUser.id);
        const newVotes = hasVoted
          ? currentVotes.filter((v: any) => v.userId !== currentUser.id)
          : [...currentVotes, { userId: currentUser.id, recommendationId: recId }];
        const newUpvotes = hasVoted ? Math.max(0, rec.upvotes - 1) : rec.upvotes + 1;
        return { ...rec, upvotes: newUpvotes, votes: newVotes };
      })
    );

    try {
      const data = await recommendationApi.toggleUpvote(recId);
      if (data.recommendation) {
        setRecommendations((prevRecs) =>
          prevRecs.map((r) => (r.id === recId ? data.recommendation : r))
        );
      }
    } catch (err) {
      console.error('Failed to upvote recommendation:', err);
      fetchRecommendations();
    }
  };

  const handleUpdateStatus = async (recId: string, status: string) => {
    try {
      await recommendationApi.updateStatus(recId, status);
      fetchRecommendations();
    } catch (err) {
      console.error('Failed to update recommendation status:', err);
    }
  };

  const filtered = recommendations.filter((r) => activeTab === 'ALL' || r.status === activeTab);

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-linear-to-r from-indigo-600 to-cyan-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-bounce text-xs font-bold shadow-indigo-500/30">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>Feature suggestion submitted successfully!</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-indigo-600 via-indigo-700 to-cyan-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-2 border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2">
          <span className="bg-white/15 backdrop-blur-md text-cyan-200 text-[10px] uppercase font-black px-3 py-1 rounded-full border border-white/20 tracking-wider">
            Feature Suggestion Portal
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Customer Feature & Improvement Suggestions</h1>
        <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl font-medium">
          Submit feature ideas with mockup screenshots, vote on popular community recommendations, and track development status in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Submit Suggestion Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>Submit New Recommendation</span>
            </h2>

            <form onSubmit={handleSubmitRecommendation} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Website / Platform</label>
                <select
                  value={websiteName}
                  onChange={(e) => setWebsiteName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none font-bold text-slate-800 dark:text-slate-100 transition-all"
                >
                  {displayWebsites.map((w: any) => (
                    <option key={w.id} value={w.name}>
                      {w.name} {w.url ? `(${w.url})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Module / Page</label>
                <select
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none font-bold text-slate-800 dark:text-slate-100 transition-all"
                >
                  {displayModules.map((m: any) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Feature Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dark Mode Toggle & High-Contrast Support"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Feature Description & Value</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain how this feature improves user workflow..."
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mockup / Screenshot Preview</label>
                <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/60 text-center relative cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="w-6 h-6 text-indigo-600 dark:text-cyan-400 mx-auto mb-1" />
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Upload mockup screenshot</p>
                </div>

                {screenshotUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-32">
                    <img src={screenshotUrl} alt="Preview" className="w-full h-32 object-cover" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Feature Suggestion</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Recommendations Stream & Voting */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Tabs */}
          <div className="flex bg-white dark:bg-[#0f172a] p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm gap-1 max-w-full overflow-x-auto no-scrollbar">
            {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'PLANNED', 'IN_DEVELOPMENT', 'IMPLEMENTED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === tab
                    ? 'bg-linear-to-r from-indigo-600 to-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          {convertedTicketMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{convertedTicketMsg}</span>
            </div>
          )}

          {/* Recommendations Stream */}
          {loading ? (
            <div className="p-12 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs font-semibold">
              Loading feature suggestions from database...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Lightbulb className="w-10 h-10 text-indigo-400 dark:text-indigo-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No suggestions in this status</h3>
              <p className="text-xs text-slate-400">Be the first to submit a suggestion!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-indigo-400/50 dark:hover:border-indigo-500/50 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                          {rec.status.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          {rec.websiteName} • {rec.moduleName}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{rec.title}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                      {(() => {
                        const hasUserVoted = Array.isArray(rec.votes)
                          ? rec.votes.some((v: any) => v.userId === currentUser?.id)
                          : (rec.votedUserIds && Array.isArray(rec.votedUserIds) ? rec.votedUserIds.includes(currentUser?.id) : rec.userVoted);

                        return (
                          <button
                            onClick={() => handleUpvote(rec.id)}
                            title={hasUserVoted ? "Click to remove your upvote" : "Click to upvote this suggestion"}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                              hasUserVoted
                                ? 'bg-linear-to-r from-indigo-600 to-cyan-600 text-white border border-indigo-500 shadow-indigo-500/20'
                                : 'border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300'
                            }`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${hasUserVoted ? 'fill-white' : ''}`} />
                            <span>{hasUserVoted ? `Upvoted (${rec.upvotes})` : `Upvote (${rec.upvotes})`}</span>
                          </button>
                        );
                      })()}

                      {(currentRole === 'SUPER_ADMIN' || currentRole === 'MANAGER') && (
                        <select
                          value={rec.status}
                          onChange={(e) => handleUpdateStatus(rec.id, e.target.value)}
                          className="px-2.5 py-1 text-[11px] font-bold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        >
                          <option value="SUBMITTED">Submitted</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="PLANNED">Planned</option>
                          <option value="IN_DEVELOPMENT">In Development</option>
                          <option value="IMPLEMENTED">Implemented</option>
                          <option value="DECLINED">Declined</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{rec.description}</p>

                  {rec.screenshotUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 max-h-48">
                      <img src={rec.screenshotUrl} alt={rec.title} className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}

                  {/* Team & Specialist Assignment Bar for Manager/Super Admin */}
                  {(currentRole === 'SUPER_ADMIN' || currentRole === 'MANAGER') && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 min-w-0">
                      <div className="flex items-center gap-1.5 w-full sm:w-auto min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1 shrink-0">
                          <Building className="w-3 h-3 text-indigo-600 dark:text-cyan-400" />
                          <span>Team:</span>
                        </span>
                        <select
                          value={rec.teamId || ''}
                          onChange={(e) => handleAssignTeam(rec.id, e.target.value)}
                          className="flex-1 sm:flex-initial min-w-0 px-2 py-1 text-[11px] font-bold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 truncate"
                        >
                          <option value="">-- Assign Team --</option>
                          {teams.map((t: any) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1 shrink-0">
                          <UserCheck className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                          <span>Specialist:</span>
                        </span>
                        <select
                          value={rec.assignedToId || ''}
                          onChange={(e) => handleAssignSpecialist(rec.id, e.target.value)}
                          className="flex-1 sm:flex-initial min-w-0 px-2 py-1 text-[11px] font-bold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 truncate"
                        >
                          <option value="">-- Unassigned --</option>
                          {itSpecialists
                            .filter((u: any) => !rec.teamId || u.teamId === rec.teamId || u.teams?.some((t: any) => t.id === rec.teamId))
                            .map((u: any) => {
                              const userTeam = teams.find((t: any) => t.id === u.teamId || t.members?.some((m: any) => m.id === u.id));
                              return (
                                <option key={u.id} value={u.id}>
                                  {u.name} {userTeam ? `(${userTeam.name})` : ''}
                                </option>
                              );
                            })}
                        </select>
                      </div>

                      {rec.isConverted || rec.status === 'IMPLEMENTED' ? (
                        <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 w-full sm:w-auto sm:ml-auto">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Converted to Ticket {rec.convertedTicketNumber ? `(#${rec.convertedTicketNumber})` : ''}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConvertToTicket(rec.id, rec.teamId, rec.assignedToId)}
                          className="px-3 py-1.5 bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all w-full sm:w-auto sm:ml-auto active:scale-95"
                        >
                          <TicketIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>Convert to Active Ticket</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span>Suggested by: <strong className="text-slate-700 dark:text-slate-300">{rec.author?.name || 'Guest User'}</strong></span>
                      {(rec.team || (rec.teamId && teams.find((t: any) => t.id === rec.teamId))) && (
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full font-bold border border-indigo-200 dark:border-indigo-800/60 text-[10px]">
                          Team: {rec.team?.name || teams.find((t: any) => t.id === rec.teamId)?.name}
                        </span>
                      )}
                      {(rec.assignedTo || (rec.assignedToId && itUsers.find((u: any) => u.id === rec.assignedToId))) && (
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full font-bold border border-emerald-200 dark:border-emerald-800/60 text-[10px]">
                          Assigned: {rec.assignedTo?.name || itUsers.find((u: any) => u.id === rec.assignedToId)?.name}
                        </span>
                      )}
                    </div>
                    <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
