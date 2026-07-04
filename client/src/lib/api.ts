const API_BASE = '/api';

export interface ImageItem {
  id: string;
  title: string;
  description: string;
  fileName: string;
  displayUrl: string;
  originalUrl: string;
  downloadUrl: string;
  size: number;
  displaySize: number;
  width: number | null;
  height: number | null;
  albumId: string | null;
  tags: string[];
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ListResult {
  data: ImageItem[];
  pagination: Pagination;
}

export interface AlbumItem {
  id: string;
  name: string;
  description: string;
  coverImageId: string | null;
  count?: number;
  createdAt: string;
}

export interface TagItem {
  name: string;
  count: number;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('token')
        ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
        : {}),
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const imageApi = {
  list: (params: { page?: number; limit?: number; search?: string; albumId?: string; tag?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.search) q.set('search', params.search);
    if (params.albumId) q.set('albumId', params.albumId);
    if (params.tag) q.set('tag', params.tag);
    return request<ListResult>(`/images?${q.toString()}`);
  },
  get: (id: string) => request<ImageItem>(`/images/${id}`),
  download: (id: string) => `${API_BASE}/images/${id}/download`,
  upload: (formData: FormData) => {
    return fetch(`${API_BASE}/images`, {
      method: 'POST',
      headers: {
        ...(localStorage.getItem('token')
          ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
          : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '上传失败' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    });
  },
  update: (id: string, data: Partial<Pick<ImageItem, 'title' | 'description' | 'albumId' | 'tags'>>) =>
    request<ImageItem>(`/images/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ message: string }>(`/images/${id}`, { method: 'DELETE' }),
};

export const albumApi = {
  list: () => request<{ data: AlbumItem[] }>(`/albums`).then((r) => r.data),
  get: (id: string) => request<AlbumItem>(`/albums/${id}`),
  create: (data: { name: string; description?: string }) =>
    request<AlbumItem>(`/albums`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<AlbumItem>) =>
    request<AlbumItem>(`/albums/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ message: string }>(`/albums/${id}`, { method: 'DELETE' }),
};

export const tagApi = {
  list: () => request<{ data: TagItem[] }>(`/tags`).then((r) => r.data),
};

export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ valid: boolean; username?: string }>(`/auth/me`),
};
