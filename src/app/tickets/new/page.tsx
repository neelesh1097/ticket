'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ticketApi } from '@/services/api/ticket.api';
import { configApi } from '@/services/api/config.api';
import {
  Ticket as TicketIcon,
  UploadCloud,
  FileText,
  X,
  ArrowLeft,
  Sparkles,
  Zap,
  ShieldCheck,
} from 'lucide-react';

export default function NewTicketPage() {
  const router = useRouter();
  const { currentUser, getAuthHeaders } = useAuth();

  const [title, setTitle] = useState('');
  const [websiteName, setWebsiteName] = useState('');
  const [module, setModule] = useState('');
  const [category, setCategory] = useState('Software Bug');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [websites, setWebsites] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    configApi.getOptions()
      .then((data) => {
        if (data.websites && data.websites.length > 0) {
          setWebsites(data.websites);
          setWebsiteName(data.websites[0].name);
        }
        if (data.modules && data.modules.length > 0) {
          setModules(data.modules);
        }
      })
      .catch((err) => console.error('Failed to load target options:', err));
  }, []);

  const selectedWebsiteObj = websites.find((w: any) => w.name === websiteName);
  const filteredModules = selectedWebsiteObj
    ? modules.filter((m: any) => !m.websiteId || m.websiteId === selectedWebsiteObj.id)
    : modules;

  useEffect(() => {
    if (filteredModules.length > 0) {
      if (!filteredModules.some((m: any) => m.name === module)) {
        setModule(filteredModules[0].name);
      }
    }
  }, [websiteName, websites, modules]);

  // Attachment state
  const [attachments, setAttachments] = useState<
    { fileName: string; fileUrl: string; fileType: string; fileSize: number }[]
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || attachments.length >= 5) {
      setError('Attachments must be 5 MB or smaller, with a maximum of 5 files.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'].includes(file.type)) {
      setError('Unsupported attachment type.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachments((prev) => [
        ...prev,
        {
          fileName: file.name,
          fileUrl: event.target?.result as string,
          fileType: file.type || 'image/png',
          fileSize: file.size,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data = await ticketApi.create({
        title,
        description,
        websiteName,
        module,
        category,
        priority,
        createdById: currentUser?.id || '',
        attachments,
      });

      router.push(`/tickets/${data.ticket.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating ticket.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Tickets Desk</span>
      </button>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-2 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-white/20 text-white border border-white/30 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-300" />
              Direct Support Dispatch
            </span>
            <span className="text-xs text-indigo-100 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              Open to All Users • No Manager Approval Required
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Raise a New Support Ticket</h1>
          <p className="text-xs text-indigo-100/90 max-w-xl">
            Submit your issue directly into the active operations queue. Provide website target, module name, and screenshots for rapid technical investigation.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 transition-colors">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Ticket Title / Brief Summary <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Stripe checkout 504 gateway timeout error during flash sale"
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Select Project / URL <span className="text-rose-500">*</span>
              </label>
              <select
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 font-bold text-slate-800 dark:text-slate-100 focus:outline-none transition-all"
              >
                {websites.map((w: any) => (
                  <option key={w.id} value={w.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {w.name} {w.url ? `(${w.url})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Select project target</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Select Module <span className="text-rose-500">*</span>
              </label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 font-bold text-slate-800 dark:text-slate-100 focus:outline-none transition-all"
              >
                {filteredModules.map((m: any) => (
                  <option key={m.id} value={m.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Target module component</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Ticket Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none transition-all"
              >
                <option value="Software Bug" className="bg-white dark:bg-slate-900">Software Bug</option>
                <option value="IT Request" className="bg-white dark:bg-slate-900">IT Support Request</option>
                <option value="Infrastructure" className="bg-white dark:bg-slate-900">Infrastructure Maintenance</option>
                <option value="Feature Access" className="bg-white dark:bg-slate-900">Feature Access / Permission</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Urgency / Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none transition-all"
              >
                <option value="LOW" className="bg-white dark:bg-slate-900">Low - General query</option>
                <option value="MEDIUM" className="bg-white dark:bg-slate-900">Medium - Normal operational request</option>
                <option value="HIGH" className="bg-white dark:bg-slate-900">High - Important feature blocking</option>
                <option value="URGENT" className="bg-white dark:bg-slate-900">Urgent - System outage / Critical bug</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description & Steps to Reproduce <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Upload Diagnostic Attachments & Screenshots
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 hover:border-indigo-500/50 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept="image/*,.pdf,.doc,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Click to browse or drag & drop diagnostic screenshot
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Supports PNG, JPG, WEBP, PDF up to 5MB</p>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Attached Files ({attachments.length}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {att.fileType.startsWith('image/') ? (
                          <img src={att.fileUrl} alt={att.fileName} className="w-8 h-8 rounded object-cover shrink-0" />
                        ) : (
                          <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        )}
                        <div className="truncate text-left">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{att.fileName}</p>
                          <p className="text-[10px] text-slate-400">{(att.fileSize / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-center transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Dispatching Ticket...</span>
            ) : (
              <>
                <TicketIcon className="w-4 h-4" />
                <span>Raise Ticket Instantly</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
