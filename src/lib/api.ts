import type {
  CustomerInterview,
  DeliverableFileType,
  FinancialAssumptions,
  Lead,
  LeadSource,
  LeadStage,
  Project,
  ProjectCharter,
  ProjectStatus,
  StudentProfile,
  User,
  UserRole,
  WorkspaceSnapshot,
} from '../types/models';

const TOKEN_STORAGE_KEY = 'dgu_industrybridge_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  getPublicSummary: () =>
    requestJson<{
      stats: { activeStudents: number; partnerBusinesses: number; projectsCompletedOrActive: number };
      testimonials: { id: string; businessName: string; testimonial: string; usefulness: number; onTime: boolean }[];
    }>('/api/public/summary'),

  bookDiscoveryCall: (payload: {
    businessName: string;
    contactName: string;
    phone: string;
    email: string;
    preferredSlot: string;
    topic: string;
  }) => requestJson('/api/public/discovery-booking', { method: 'POST', body: JSON.stringify(payload) }),

  signup: async (payload: {
    name: string;
    email: string;
    password: string;
    role: 'business' | 'student';
    businessName?: string;
    phone?: string;
    location?: string;
    industry?: string;
    enrollmentNumber?: string;
    programBatch?: string;
  }) => {
    const data = await requestJson<{ token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(data.token);
    return data.user;
  },

  login: async (email: string, password: string) => {
    const data = await requestJson<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    return data.user;
  },

  demoLogin: async (role: 'admin' | 'business' | 'business2' | 'student' | 'student2') => {
    const data = await requestJson<{ token: string; user: User }>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    setStoredToken(data.token);
    return data.user;
  },

  logout: async () => {
    try {
      await requestJson('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  me: () => requestJson<{ user: User }>('/api/auth/me'),

  getWorkspace: () => requestJson<WorkspaceSnapshot>('/api/workspace'),

  createProject: (payload: Record<string, unknown>) =>
    requestJson<{ project: Project }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMyStudentProfile: (payload: Partial<StudentProfile>) =>
    requestJson<{ student: StudentProfile }>('/api/students/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  assignTeam: (projectId: string, studentIds: string[], teamLeadId: string) =>
    requestJson<{ project: Project }>(`/api/projects/${projectId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ studentIds, teamLeadId }),
    }),

  respondAssignment: (projectId: string, response: 'Accepted' | 'Declined') =>
    requestJson<{ project: Project }>(`/api/projects/${projectId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    }),

  saveCharter: (projectId: string, payload: Partial<ProjectCharter>) =>
    requestJson<{ charter: ProjectCharter }>(`/api/projects/${projectId}/charter`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  approveCharter: (projectId: string) =>
    requestJson<{ charter: ProjectCharter; project: Project }>(
      `/api/projects/${projectId}/charter/approve`,
      { method: 'POST' }
    ),

  updateProjectStatus: (
    projectId: string,
    status: ProjectStatus,
    paymentRef?: string,
    paidAmount?: number
  ) =>
    requestJson<{ project: Project }>(`/api/projects/${projectId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, paymentRef, paidAmount }),
    }),

  submitDeliverable: (
    projectId: string,
    payload: {
      title: string;
      notes: string;
      fileType: DeliverableFileType;
      fileName?: string;
      fileDataUrl?: string;
      externalUrl?: string;
    }
  ) =>
    requestJson(`/api/projects/${projectId}/deliverables`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reviewDeliverable: (
    deliverableId: string,
    status: 'Approved' | 'Revision Requested',
    reviewComment: string
  ) =>
    requestJson(`/api/deliverables/${deliverableId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewComment }),
    }),

  submitFeedback: (
    projectId: string,
    payload: {
      usefulness: number;
      onTime: boolean;
      quality: number;
      wouldPayAgain: boolean;
      nps: number;
      comments: string;
      testimonial: string;
    }
  ) =>
    requestJson(`/api/projects/${projectId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  postMessage: (projectId: string, body: string) =>
    requestJson(`/api/projects/${projectId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  markNotificationRead: (id: string) =>
    requestJson(`/api/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    requestJson('/api/notifications/read-all', { method: 'POST' }),

  createLead: (payload: {
    businessName: string;
    contactName: string;
    phone: string;
    source: LeadSource;
    stage: LeadStage;
    notes: string;
  }) =>
    requestJson<{ lead: Lead }>('/api/admin/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateLead: (id: string, payload: { stage?: LeadStage; notes?: string }) =>
    requestJson<{ lead: Lead }>(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  createInterview: (payload: Omit<CustomerInterview, 'id' | 'createdAt'>) =>
    requestJson<{ interview: CustomerInterview }>('/api/admin/interviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateFinancialAssumptions: (payload: FinancialAssumptions) =>
    requestJson<{ financialAssumptions: FinancialAssumptions }>(
      '/api/admin/financial-assumptions',
      { method: 'PUT', body: JSON.stringify(payload) }
    ),
};

export type { UserRole };
