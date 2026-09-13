import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import StickyNotes from '@/components/StickyNotes';

export const metadata: Metadata = {
  title: 'TicketPulse Pro - Enterprise Support & Recommendation Hub',
  description: 'Multi-role ticket raising, real-time workflow, IT work hours logger, feature recommendation window, and super admin dashboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col transition-colors duration-200 selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-300">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
              <AuthGuard>{children}</AuthGuard>
            </main>
            <StickyNotes />
            <footer className="bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 inline-block shadow-xs shadow-indigo-500/50 animate-pulse"></span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">TicketPulse Pro Enterprise NextGen v3.0</span>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  Next-Gen Operations • Private Sticky Notes • Instant Ticket Dispatch
                </div>
              </div>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
