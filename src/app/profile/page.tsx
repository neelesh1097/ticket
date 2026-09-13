'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  ShieldCheck,
  KeyRound,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  Mail,
  Briefcase,
  UserCheck,
  Upload,
  Image as ImageIcon,
  Camera,
  Trash2,
} from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, isAuthenticated, getAuthHeaders, updateUserSession } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'account'>('profile');

  // Profile Form State
  const [name, setName] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setJobTitle(currentUser.jobTitle || '');
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
        setProfileError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-6">
        <div className="bg-white dark:bg-[#0f172a] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-lg shadow-indigo-500/30">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Authentication Required</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Please sign in to view and edit your profile, account preferences, and security settings.
          </p>
          <Link
            href="/login"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white font-bold text-xs shadow-md transition-all block"
          >
            Sign In to Account
          </Link>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setSavingProfile(true);

    try {
      const res = await fetch('/api/v1/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name, jobTitle, avatar }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      updateUserSession({ name, jobTitle, avatar });
      setProfileSuccess('Profile updated successfully!');
    } catch (err: any) {
      setProfileError(err.message || 'Profile update failed.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password.');
      }

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Password change failed.');
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'MANAGER':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'IT_SOFTWARE':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      default:
        return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Banner & User Profile Header Card */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="flex items-center gap-5">
          <div className="relative">
            <img
              src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || currentUser.name)}&background=6366f1&color=fff`}
              alt={currentUser.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ring-4 ring-white/20 object-cover shadow-xl"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-slate-900 shadow-md">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getRoleBadgeStyle(currentUser.role)}`}>
                <ShieldCheck className="w-3 h-3 inline mr-1" />
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{currentUser.name}</h1>
            <p className="text-xs text-cyan-200 font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-300" />
              <span>{currentUser.email}</span>
            </p>
            <p className="text-xs text-indigo-200 font-semibold flex items-center gap-1.5 pt-0.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-300" />
              <span>{currentUser.jobTitle || 'Portal Member'}</span>
            </p>
          </div>
        </div>

        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 text-center shrink-0 space-y-1">
          <p className="text-xs font-bold text-slate-200">Account Security</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active Session
          </span>
        </div>
      </div>

      {/* Profile Settings Content Card */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${activeTab === 'profile'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
              }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Information</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${activeTab === 'security'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
              }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Password & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${activeTab === 'account'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
              }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Account Details</span>
          </button>
        </div>

        {/* Tab 1: Profile Information */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Personal & Professional Information</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your display name, company job title, and customize your avatar.
              </p>
            </div>

            {profileSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Job Title / Organization Designation
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. Client Operations Specialist"
                />
              </div>
            </div>

            {/* Avatar Photo Section */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Profile Photo & Avatar</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <img
                  src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff`}
                  alt="Avatar Preview"
                  className="w-16 h-16 rounded-2xl ring-2 ring-indigo-500/40 object-cover shadow-md shrink-0"
                />

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label
                      htmlFor="profile-photo-upload"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo from Computer</span>
                    </label>
                    <input
                      id="profile-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-red-300 text-slate-600 dark:text-slate-400 hover:text-red-600 text-xs font-bold flex items-center gap-1.5 transition-colors bg-white dark:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Supported image formats: <span className="font-bold text-slate-700 dark:text-slate-300">PNG, JPG, WEBP, GIF, SVG</span> (Max file size: 5MB).
                  </p>
                </div>
              </div>

              {/* Quick Avatar Presets */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">Quick Avatar Presets</label>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {[
                    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
                    `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150`,
                    `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150`,
                    `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150`,
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff`,
                  ].map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(presetUrl)}
                      className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        avatar === presetUrl ? 'border-indigo-600 ring-2 ring-indigo-500/40 scale-105' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <img src={presetUrl} alt="Preset Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Password & Security */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Change Account Password</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ensure your account is using a strong password to protect your access level.
              </p>
            </div>

            {passwordSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-start">
              <button
                type="submit"
                disabled={changingPassword}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Account Details */}
        {activeTab === 'account' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Account Specifications & Governance</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                System identification, permissions, and platform role details.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">Email Address</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{currentUser.email}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">Assigned System Role</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{currentUser.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
