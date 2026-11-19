/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { AppShell } from './components/AppShell';
import { AuthPage } from './components/AuthPage';
import { BusinessDashboard } from './components/BusinessDashboard';
import { CharterPage } from './components/CharterPage';
import { FeedbackPage } from './components/FeedbackPage';
import { LandingPage } from './components/LandingPage';
import { ProjectDetailPage } from './components/ProjectDetailPage';
import { StudentDashboard } from './components/StudentDashboard';
import { api, getStoredToken } from './lib/api';
import type { User, WorkspaceSnapshot } from './types/models';

export default function App() {
  const [route, setRoute] = useState<string>(() => {
    const path = window.location.pathname + window.location.search;
    return path || '/';
  });
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [booting, setBooting] = useState(true);
  const [publicSummary, setPublicSummary] = useState<{
    stats: { activeStudents: number; partnerBusinesses: number; projectsCompletedOrActive: number };
    testimonials: { id: string; businessName: string; testimonial: string; usefulness: number; onTime: boolean }[];
  }>({
    stats: { activeStudents: 6, partnerBusinesses: 3, projectsCompletedOrActive: 4 },
    testimonials: [],
  });

  const navigate = useCallback((nextPath: string) => {
    window.history.pushState({}, '', nextPath);
    setRoute(nextPath);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onPop = () => {
      setRoute(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const loadWorkspace = useCallback(async () => {
    const snap = await api.getWorkspace();
    setWorkspace(snap);
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const pub = await api.getPublicSummary().catch(() => null);
        if (active && pub) setPublicSummary(pub);

        const token = getStoredToken();
        if (token) {
          const me = await api.me();
          if (active) {
            setUser(me.user);
            await loadWorkspace();
          }
        }
      } catch {
        // Invalid or expired token
      } finally {
        if (active) setBooting(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [loadWorkspace]);

  const [pathname, search] = route.split('?');
  const params = new URLSearchParams(search || '');

  async function handleAuthSuccess(loggedInUser: User) {
    setUser(loggedInUser);
    await loadWorkspace();
    if (loggedInUser.role === 'admin') {
      navigate('/admin');
    } else if (loggedInUser.role === 'business') {
      const intent = params.get('intent');
      navigate(intent === 'post' ? '/business?new=1' : '/business');
    } else {
      navigate('/student');
    }
  }

  async function handleLogout() {
    await api.logout();
    setUser(null);
    setWorkspace(null);
    navigate('/');
  }

  async function handleMarkNotifRead(id: string) {
    await api.markNotificationRead(id);
    await loadWorkspace();
  }

  async function handleMarkAllNotifsRead() {
    await api.markAllNotificationsRead();
    await loadWorkspace();
  }

  if (booting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-medium text-slate-600">Loading DGU IndustryBridge...</p>
      </div>
    );
  }

  if (pathname === '/' || pathname === '') {
    return (
      <LandingPage
        currentUser={user}
        publicStats={publicSummary.stats}
        testimonials={publicSummary.testimonials}
        onNavigate={navigate}
      />
    );
  }

  if (pathname === '/auth') {
    const initialRole = params.get('role') === 'student' ? 'student' : 'business';
    return (
      <AuthPage
        initialRole={initialRole}
        onAuthSuccess={handleAuthSuccess}
        onNavigate={navigate}
      />
    );
  }

  // Protected routes
  if (!user || !workspace) {
    return (
      <AuthPage
        initialRole="business"
        onAuthSuccess={handleAuthSuccess}
        onNavigate={navigate}
      />
    );
  }

  // Project Detail / Charter / Feedback sub-routes
  const charterMatch = pathname.match(/^\/projects\/([^/]+)\/charter$/);
  if (charterMatch) {
    const projectId = charterMatch[1];
    return (
      <AppShell
        user={user}
        notifications={workspace.notifications}
        currentPath={pathname}
        breadcrumb={`Projects / ${projectId} / Charter`}
        onNavigate={navigate}
        onLogout={handleLogout}
        onMarkNotifRead={handleMarkNotifRead}
        onMarkAllNotifsRead={handleMarkAllNotifsRead}
      >
        <CharterPage
          projectId={projectId}
          user={user}
          workspace={workspace}
          onRefresh={loadWorkspace}
          onNavigate={navigate}
        />
      </AppShell>
    );
  }

  const feedbackMatch = pathname.match(/^\/projects\/([^/]+)\/feedback$/);
  if (feedbackMatch) {
    const projectId = feedbackMatch[1];
    return (
      <AppShell
        user={user}
        notifications={workspace.notifications}
        currentPath={pathname}
        breadcrumb={`Projects / ${projectId} / Feedback`}
        onNavigate={navigate}
        onLogout={handleLogout}
        onMarkNotifRead={handleMarkNotifRead}
        onMarkAllNotifsRead={handleMarkAllNotifsRead}
      >
        <FeedbackPage
          projectId={projectId}
          user={user}
          workspace={workspace}
          onRefresh={loadWorkspace}
          onNavigate={navigate}
        />
      </AppShell>
    );
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    const projectId = projectMatch[1];
    return (
      <AppShell
        user={user}
        notifications={workspace.notifications}
        currentPath={pathname}
        breadcrumb={`Projects / ${projectId}`}
        onNavigate={navigate}
        onLogout={handleLogout}
        onMarkNotifRead={handleMarkNotifRead}
        onMarkAllNotifsRead={handleMarkAllNotifsRead}
      >
        <ProjectDetailPage
          projectId={projectId}
          user={user}
          workspace={workspace}
          onRefresh={loadWorkspace}
          onNavigate={navigate}
        />
      </AppShell>
    );
  }

  // Role-based route protection for Dashboards
  if (pathname === '/admin') {
    if (user.role !== 'admin') {
      const target = user.role === 'business' ? '/business' : '/student';
      return (
        <AppShell
          user={user}
          notifications={workspace.notifications}
          currentPath={pathname}
          breadcrumb="Access Restricted"
          onNavigate={navigate}
          onLogout={handleLogout}
          onMarkNotifRead={handleMarkNotifRead}
          onMarkAllNotifsRead={handleMarkAllNotifsRead}
        >
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h1 className="text-lg font-bold text-slate-900">Admin Access Only</h1>
            <p className="text-sm text-slate-600 mt-1">
              Your account role is {user.role}. Redirect to your workspace below.
            </p>
            <button
              type="button"
              onClick={() => navigate(target)}
              className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg"
            >
              Go to My Workspace
            </button>
          </div>
        </AppShell>
      );
    }

    return (
      <AppShell
        user={user}
        notifications={workspace.notifications}
        currentPath="/admin"
        breadcrumb="Admin / 30-Day Validation & Matching"
        onNavigate={navigate}
        onLogout={handleLogout}
        onMarkNotifRead={handleMarkNotifRead}
        onMarkAllNotifsRead={handleMarkAllNotifsRead}
      >
        <AdminDashboard workspace={workspace} onRefresh={loadWorkspace} onNavigate={navigate} />
      </AppShell>
    );
  }

  if (pathname === '/business' || (user.role === 'business' && pathname !== '/student')) {
    if (user.role === 'student') {
      return (
        <AppShell
          user={user}
          notifications={workspace.notifications}
          currentPath="/student"
          breadcrumb="Student Workspace"
          onNavigate={navigate}
          onLogout={handleLogout}
          onMarkNotifRead={handleMarkNotifRead}
          onMarkAllNotifsRead={handleMarkAllNotifsRead}
        >
          <StudentDashboard
            user={user}
            workspace={workspace}
            onRefresh={loadWorkspace}
            onNavigate={navigate}
          />
        </AppShell>
      );
    }

    return (
      <AppShell
        user={user}
        notifications={workspace.notifications}
        currentPath="/business"
        breadcrumb="Business Workspace"
        onNavigate={navigate}
        onLogout={handleLogout}
        onMarkNotifRead={handleMarkNotifRead}
        onMarkAllNotifsRead={handleMarkAllNotifsRead}
      >
        <BusinessDashboard
          user={user}
          workspace={workspace}
          defaultOpenNew={params.get('new') === '1'}
          onRefresh={loadWorkspace}
          onNavigate={navigate}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      user={user}
      notifications={workspace.notifications}
      currentPath="/student"
      breadcrumb="Student Workspace"
      onNavigate={navigate}
      onLogout={handleLogout}
      onMarkNotifRead={handleMarkNotifRead}
      onMarkAllNotifsRead={handleMarkAllNotifsRead}
    >
      <StudentDashboard
        user={user}
        workspace={workspace}
        onRefresh={loadWorkspace}
        onNavigate={navigate}
      />
    </AppShell>
  );
}
