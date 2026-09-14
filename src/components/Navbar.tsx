'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Ticket,
  Lightbulb,
  LayoutDashboard,
  Crown,
  PlusCircle,
  Users,
  ShieldCheck,
  LogOut,
  LogIn,
  Menu,
  X,
  Bell,
  CheckCheck,
  MessageSquare,
  AlertCircle,
  Clock,
  UserCheck,
  Sun,
  Moon,
              User,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, isAuthenticated, logout, getAuthHeaders } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);

  // Close mobile drawer on route change or ESC
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch('/api/v1/notifications', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentUser]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      fetchNotifications();
    } catch (e) {
      console.error('Mark all read failed:', e);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      await fetch(`/api/v1/notifications/${notif.id}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      fetchNotifications();
    } catch (e) {
      console.error('Mark read failed:', e);
    }
    setNotifOpen(false);
  };

  const navLinks: { href: string; label: string; icon: any }[] = [];

  if (isAuthenticated && currentUser) {
    navLinks.push(
      { href: '/', label: 'Overview', icon: LayoutDashboard },
      { href: '/tickets', label: 'Tickets', icon: Ticket },
      { href: '/recommendations', label: 'Suggestions', icon: Lightbulb }
    );

    if (currentUser.role === 'IT_SOFTWARE') {
      navLinks.push({ href: '/team', label: 'Work Desk', icon: Users });
    } else if (currentUser.role === 'MANAGER' || currentUser.role === 'SUPER_ADMIN') {
      navLinks.push({ href: '/team', label: 'Teams', icon: Users });
    }

    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'MANAGER') {
      navLinks.push({ href: '/admin', label: 'Admin', icon: Crown });
    }
  }

  return (
    <header className="bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-6">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md shadow-indigo-500/25 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
              <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                TicketPulse
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 dark:from-indigo-500/20 dark:to-cyan-500/20 text-indigo-600 dark:text-cyan-400 border border-indigo-200/50 dark:border-cyan-500/30">
                NextGen
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) - Authenticated Only */}
          {isAuthenticated && currentUser && navLinks.length > 0 && (
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Dark/Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-all duration-200 hover:scale-105 active:scale-95 group relative shrink-0"
              title={isDark ? 'Switch to Default Light Theme' : 'Switch to Next-Gen Dark Theme'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {isAuthenticated && currentUser && (
              <>
                <Link
                  href="/recommendations"
                  className="hidden xl:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-indigo-200/70 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 text-[11px] font-bold transition-all"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Suggest Feature</span>
                </Link>

                <Link
                  href="/tickets/new"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white text-[11px] font-extrabold shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Raise Ticket</span>
                </Link>
              </>
            )}

            {/* Notification Bell Dropdown */}
            {isAuthenticated && currentUser && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">Notifications & Alerts</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full">
                            {unreadCount} Unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            href={n.link || '/'}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors block text-xs ${
                              !n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-bold' : ''
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {n.type === 'COMMENT' && <MessageSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
                              {n.type === 'NEED_INFO' && <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                              {n.type === 'STATUS_CHANGE' && <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                              {n.type === 'ASSIGNMENT' && <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                            </div>
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <p className="font-extrabold text-slate-900 dark:text-white truncate">{n.title}</p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">{n.message}</p>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Desktop / Tablet Profile Avatar & Auth Actions */}
            {isAuthenticated && currentUser ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 sm:pl-2.5 border-l border-slate-200 dark:border-slate-800">
                <Link
                  href="/profile"
                  title="View & Edit Profile"
                  className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-2.5 py-1 transition-all group"
                >
                  <img
                    src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=6366f1&color=fff`}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full ring-2 ring-indigo-500/40 object-cover shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="text-left hidden md:block">
                    <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight max-w-[100px] truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {currentUser.name}
                    </p>
                    <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 uppercase tracking-wider">
                      <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                      <span>{currentUser.role.replace('_', ' ')}</span>
                    </p>
                  </div>
                </Link>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Menu Hamburger Button - ALWAYS VISIBLE on <lg screens */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all duration-200 shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-indigo-600 dark:text-cyan-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Overlay & Content */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200/80 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
            {/* User Profile Card (if authenticated) */}
            {isAuthenticated && currentUser ? (
              <div className="bg-slate-50/90 dark:bg-slate-800/80 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 min-w-0 flex-1 group"
                >
                  <img
                    src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=6366f1&color=fff`}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full ring-2 ring-indigo-500/50 object-cover shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="truncate">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-indigo-600 dark:text-cyan-400 tracking-wider mt-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>{currentUser.role.replace('_', ' ')}</span>
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-cyan-400 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                    title="Profile & Settings"
                  >
                    <User className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="p-2 text-rose-500 hover:text-rose-700 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/90 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Welcome to TicketPulse NextGen</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Sign in to track issues, raise tickets, and collaborate.</p>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Your Account</span>
                </Link>
              </div>
            )}

            {/* Mobile Navigation Links */}
            {isAuthenticated && currentUser && (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 px-2 tracking-wider">
                  Menu Navigation
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      pathname === '/profile'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Profile & Preferences</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Action Buttons on Mobile */}
            {isAuthenticated && currentUser && (
              <div className="pt-2 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/tickets/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Raise Support Ticket</span>
                </Link>
                <Link
                  href="/recommendations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Suggest Portal Feature</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
