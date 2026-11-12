import {
  UserAccount,
  OffenderCase,
  ClinicalNote,
  ChangeHistoryEntry,
  UploadedDocument,
  AuditEvent,
  VerificationResult,
  InstitutionConfig,
  SystemStatus,
} from '../types';

const TOKEN_KEY = 'rehabpath360_auth_token';

export const AuthService = {
  getToken: (): string | null => {
    localStorage.removeItem(TOKEN_KEY);
    return sessionStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string) => {
    sessionStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = AuthService.getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const Api = {
  // System & Institution
  getSystemStatus: () =>
    request<SystemStatus>('/api/system/status'),

  getDatabaseStatus: () =>
    request<{
      active_engine: string;
      storage_type: string;
      active_database_file: string;
      database_path: string;
      migrations: { id: string; status: string; description: string }[];
      record_counts: Record<string, number>;
      tenant_isolation_active: boolean;
      optimistic_concurrency: string;
      backup_supported: boolean;
      external_pg_configured: boolean;
    }>('/api/system/database/status'),

  switchSystemMode: (mode: 'demo' | 'deployment', setup_token?: string) =>
    request<{ success: boolean; mode: 'demo' | 'deployment'; database_file: string }>('/api/system/mode', { method: 'POST', body: JSON.stringify({ mode, ...(setup_token ? {setup_token} : {}) }) }),

  bootstrapAdmin: (data: {
    institution_name: string;
    institution_code: string;
    admin_email: string;
    admin_password: string;
    admin_name: string;
    admin_badge?: string;
    setup_token?: string;
  }) =>
    request<{
      success: boolean;
      message: string;
      token: string;
      user: UserAccount;
      institution: InstitutionConfig;
    }>('/api/setup/bootstrap-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInstitution: () =>
    request<{ institution: InstitutionConfig }>('/api/institution'),

  updateInstitution: (data: Partial<InstitutionConfig>) =>
    request<{ success: boolean; institution: InstitutionConfig }>('/api/institution', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: UserAccount; institution: InstitutionConfig }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getCurrentUser: () =>
    request<{ user: UserAccount; institution?: InstitutionConfig }>('/api/auth/me'),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  provisionStaff: (staffData: any) =>
    request<{ success: boolean; user: any }>('/api/auth/provision-user', {
      method: 'POST',
      body: JSON.stringify(staffData),
    }),

  getStaffList: () =>
    request<{ staff: any[] }>('/api/auth/staff'),

  // Cases
  getCases: (params?: { search?: string; severity?: number; decision?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.severity) query.set('severity', params.severity.toString());
    if (params?.decision) query.set('decision', params.decision);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ cases: OffenderCase[] }>(`/api/cases${qs}`);
  },

  getCaseById: (id: string) =>
    request<{ case: OffenderCase; change_history: ChangeHistoryEntry[] }>(`/api/cases/${id}`),

  createCase: (caseData: Partial<OffenderCase>) =>
    request<{ success: boolean; case: OffenderCase; message: string }>('/api/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    }),

  updateCase: (id: string, updates: Partial<OffenderCase>) =>
    request<{ success: boolean; case: OffenderCase; message: string }>(`/api/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  decidePlacement: (
    id: string,
    decision: 'approved' | 'modified' | 'overridden' | 'rejected',
    pathway_position: number,
    reason: string
  ) =>
    request<{ success: boolean; case: OffenderCase }>(`/api/cases/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, pathway_position, reason }),
    }),

  advanceCase: (id: string) =>
    request<{ success: boolean; case: OffenderCase }>(`/api/cases/${id}/advance`, {
      method: 'POST',
    }),

  // Autosave Drafts
  saveDraft: (caseId: string, draft: Partial<OffenderCase>) =>
    request<{ success: boolean; saved_at: string }>(`/api/cases/${caseId}/draft`, {
      method: 'POST',
      body: JSON.stringify({ draft }),
    }),

  getDraft: (caseId: string) =>
    request<{ draft: Partial<OffenderCase> | null; updated_at: string | null }>(`/api/cases/${caseId}/draft`),

  clearDraft: (caseId: string) =>
    request<{ success: boolean }>(`/api/cases/${caseId}/draft`, { method: 'DELETE' }),

  // Clinical Notes (Restricted)
  getClinicalNotes: (caseId: string) =>
    request<{ notes: ClinicalNote[] }>(`/api/cases/${caseId}/clinical-notes`),

  addClinicalNote: (
    caseId: string,
    noteData: Omit<
      ClinicalNote,
      'id' | 'institution_id' | 'case_id' | 'author_id' | 'author_name' | 'author_role' | 'created_at'
    >
  ) =>
    request<{ success: boolean; note: ClinicalNote }>(`/api/cases/${caseId}/clinical-notes`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    }),

  // Documents & AI Verification
  uploadDocument: (caseId: string | undefined, file: File) => {
    const formData = new FormData();
    if (caseId) {
      formData.append('case_id', caseId);
    }
    formData.append('file', file);
    return request<{
      success: boolean;
      document: UploadedDocument;
      verification: VerificationResult;
      detected_case_id?: string | null;
      detection_reason?: string | null;
      sheets?: string[];
      tablePreview?: any[];
    }>('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  getDocuments: (caseId?: string) =>
    request<{ documents: UploadedDocument[] }>(
      caseId ? `/api/documents?case_id=${encodeURIComponent(caseId)}` : '/api/documents'
    ),

  assignDocument: (documentId: string, target_case_id: string) =>
    request<{
      success: boolean;
      document: UploadedDocument;
      verification: VerificationResult;
      sheets?: string[];
      tablePreview?: any[];
    }>(`/api/documents/${documentId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ target_case_id }),
    }),

  rejectDocument: (documentId: string, reason?: string) =>
    request<{ success: boolean; document: UploadedDocument }>(`/api/documents/${documentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  commitVerifiedFields: (
    documentId: string,
    accepted_fields: { fieldName: string; finalValue: any }[]
  ) =>
    request<{ success: boolean; case: OffenderCase; message: string }>(`/api/documents/${documentId}/commit`, {
      method: 'POST',
      body: JSON.stringify({ accepted_fields }),
    }),

  // Audit Events
  getAuditEvents: () =>
    request<{ events: AuditEvent[] }>('/api/audit-events'),
};
