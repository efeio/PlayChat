function resolveApiUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return '';
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:3001`;
}

const API_URL = resolveApiUrl();

interface FetchOptions extends RequestInit {
  token?: string;
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, token?: string, signal?: AbortSignal) =>
    request<T>(endpoint, { method: 'GET', token, signal }),

  post: <T>(endpoint: string, body: unknown, token?: string, signal?: AbortSignal) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      token,
      signal,
    }),

  put: <T>(endpoint: string, body?: unknown, token?: string, signal?: AbortSignal) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      token,
      signal,
    }),
};
