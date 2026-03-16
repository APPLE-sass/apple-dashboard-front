import type {
  ApiResponse,
  AuthTokens,
  AuthResponse,
  PuntoDeVenta,
  PuntoDeVentaInput,
  Accesorio,
  AccesorioInput,
  AccesorioFilters,
  PaginatedAccesorios,
  SubAccesorio,
  SubAccesorioInput,
  SubAccesorioFilters,
  PaginatedSubAccesorios,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Token storage
export const getAccessToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

export const getRefreshToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

export const saveTokens = (tokens: AuthTokens) => {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// All responses are { success, data: T } — unwrap .data
function unwrap<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'data' in (json as object)) {
    return (json as { data: T }).data;
  }
  return json as T;
}

  async function tryRefreshToken(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    console.log('🔄 Intentando refresh...');
    console.log('🔑 refreshToken existe:', !!refreshToken);
    
    if (!refreshToken) return false;
    
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      console.log('📡 Status del refresh:', response.status);
      
      const json = await response.json();
      console.log('📦 Body del refresh:', json);
      
      if (!response.ok) return false;
      
      const tokens = unwrap<AuthTokens>(json);
      saveTokens(tokens);
      console.log('✅ Refresh exitoso, tokens guardados');
      return true;
    } catch (e) {
      console.error('❌ Excepción en refresh:', e);
      return false;
    }
  }

// Main fetch wrapper — auto-refreshes on 401
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const accessToken = getAccessToken();

  const makeRequest = (token: string | null) =>
    fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

  let response = await makeRequest(accessToken);

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      response = await makeRequest(getAccessToken());
    } else {
      clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Sesión expirada');
    }
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return undefined as T;
  }

  if (!response.ok) {
    const msg =
      (json as { message?: string })?.message ||
      (json as { error?: string })?.error ||
      `Error ${response.status}`;
    throw new Error(msg);
  }

  return unwrap<T>(json);
}

// Build query string from a filters object
function buildQuery(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString() ? `?${params.toString()}` : '';
}

// ─── Auth ────────────────────────────────────────────────────────────────────

async function authFetch(endpoint: string, body: object): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let json: unknown;
  try { json = await response.json(); } catch { throw new Error(`Error ${response.status}`); }

  if (!response.ok) {
    const msg =
      (json as { message?: string })?.message ||
      (json as { error?: string })?.error ||
      `Error ${response.status}`;
    throw new Error(msg);
  }

  return unwrap<AuthResponse>(json);
}

export const authApi = {
  login: async (email: string, password: string) => {
    const data = await authFetch('/auth/login', { email, password });
    saveTokens(data);
    return data;
  },

  register: async (email: string, nombre: string, password: string) => {
    const data = await authFetch('/auth/register', { email, nombre, password });
    saveTokens(data);
    return data;
  },

  logout: async () => {
    try { await apiFetch('/auth/logout', { method: 'POST' }); } finally { clearTokens(); }
  },
};


// ─── Puntos de Venta ─────────────────────────────────────────────────────────

export const pdvApi = {
  getAll: () => apiFetch<PuntoDeVenta[]>('/pdv'),

  getOne: (id: string) => apiFetch<PuntoDeVenta>(`/pdv/${id}`),

  create: (data: PuntoDeVentaInput) =>
    apiFetch<PuntoDeVenta>('/pdv', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<PuntoDeVentaInput>) =>
    apiFetch<PuntoDeVenta>(`/pdv/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/pdv/${id}`, { method: 'DELETE' }),
};

// ─── Accesorios de marca ─────────────────────────────────────────────────────

export const accesoriosApi = {
  getAll: (filters: AccesorioFilters = {}) =>
    apiFetch<PaginatedAccesorios>(`/accesorios${buildQuery(filters as Record<string, unknown>)}`),

  getOne: (id: string) => apiFetch<Accesorio>(`/accesorios/${id}`),

  create: (data: AccesorioInput) =>
    apiFetch<Accesorio>('/accesorios', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<AccesorioInput>) =>
    apiFetch<Accesorio>(`/accesorios/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/accesorios/${id}`, { method: 'DELETE' }),
};

// ─── Sub-accesorios genéricos ─────────────────────────────────────────────────

export const subAccesoriosApi = {
  getAll: (filters: SubAccesorioFilters = {}) =>
    apiFetch<PaginatedSubAccesorios>(`/sub-accesorios${buildQuery(filters as Record<string, unknown>)}`),

  getOne: (id: string) => apiFetch<SubAccesorio>(`/sub-accesorios/${id}`),

  create: (data: SubAccesorioInput) =>
    apiFetch<SubAccesorio>('/sub-accesorios', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<SubAccesorioInput>) =>
    apiFetch<SubAccesorio>(`/sub-accesorios/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/sub-accesorios/${id}`, { method: 'DELETE' }),
};
