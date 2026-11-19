import { useState, type ReactNode } from 'react';
import {
  Bell,
  Briefcase,
  Check,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { Notification, User } from '../types/models';

interface AppShellProps {
  user: User;
  notifications: Notification[];
  currentPath: string;
  breadcrumb: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onMarkNotifRead: (id: string) => void;
  onMarkAllNotifsRead: () => void;
  children: ReactNode;
}

export function AppShell({
  user,
  notifications,
  currentPath,
  breadcrumb,
  onNavigate,
  onLogout,
  onMarkNotifRead,
  onMarkAllNotifsRead,
  children,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems =
    user.role === 'admin'
      ? [
          { label: 'Admin Console', path: '/admin', Icon: ShieldCheck },
          { label: 'Public Home', path: '/', Icon: LayoutDashboard },
        ]
      : user.role === 'business'
      ? [
          { label: 'Business Workspace', path: '/business', Icon: Briefcase },
          { label: 'Public Home', path: '/', Icon: LayoutDashboard },
        ]
      : [
          { label: 'Student Workspace', path: '/student', Icon: GraduationCap },
          { label: 'Public Home', path: '/', Icon: LayoutDashboard },
        ];

  const roleLabel =
    user.role === 'admin'
      ? 'Admin (Founder)'
      : user.role === 'business'
      ? 'Business Partner'
      : 'DGU Student';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0F2D52] text-white border-r border-slate-800">
        <div className="px-6 py-5 border-b border-white/10">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-left text-lg font-bold tracking-tight text-white hover:text-teal-200 transition-colors whitespace-nowrap"
          >
            DGU IndustryBridge
          </button>
          <p className="text-xs text-slate-300 mt-1">{roleLabel}</p>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Workspace navigation">
          {navItems.map((item) => {
            const active = currentPath === item.path;
            const Icon = item.Icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-300 truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 bg-white/10 hover:bg-white/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Context Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle workspace menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="text-sm font-medium text-slate-500 truncate">{breadcrumb}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <Bell className="w-4 h-4 text-[#0F2D52]" aria-hidden="true" />
              <span className="hidden sm:inline">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-teal-600 text-white rounded">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">
                    In-App Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onMarkAllNotifsRead()}
                      className="text-xs font-medium text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          onMarkNotifRead(n.id);
                          setNotifOpen(false);
                          if (n.link) onNavigate(n.link);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                          n.read ? 'bg-white' : 'bg-teal-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                          {!n.read && (
                            <span className="text-[11px] font-medium text-teal-700 shrink-0">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.body}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0F2D52] text-white px-4 py-4 space-y-2 border-b border-slate-800">
            <div className="pb-2 border-b border-white/10">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-slate-300">{roleLabel} · {user.email}</p>
            </div>
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  onNavigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={onLogout}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-200 hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        )}

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
