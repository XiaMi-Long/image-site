import axios from 'axios';

const API_BASE = '/api';

const http = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

// Attach auth token
http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Normalize errors + handle 401
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    const msg = err.response?.data?.error || err.message || '请求失败';
    return Promise.reject(new Error(msg));
  },
);

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

export const imageApi = {
  list: (params: { page?: number; limit?: number; search?: string; albumId?: string; tag?: string; sortBy?: string; sortOrder?: string } = {}) =>
    http.get<ListResult>('/images', { params }).then((r) => r.data),
  get: (id: string) => http.get<ImageItem>(`/images/${id}`).then((r) => r.data),
  download: (id: string) => `${API_BASE}/images/${id}/download`,
  upload: (formData: FormData) =>
    http.post('/images', formData).then((r) => r.data),
  update: (id: string, data: Partial<Pick<ImageItem, 'title' | 'description' | 'albumId' | 'tags'>>) =>
    http.patch<ImageItem>(`/images/${id}`, data).then((r) => r.data),
  remove: (id: string) => http.delete<{ message: string }>(`/images/${id}`).then((r) => r.data),
  crop: (id: string, data: { x: number; y: number; width: number; height: number; rotation: number }) =>
    http.post<ImageItem>(`/images/${id}/crop`, data).then((r) => r.data),
};

export const albumApi = {
  list: () => http.get<{ data: AlbumItem[] }>('/albums').then((r) => r.data.data),
  get: (id: string) => http.get<AlbumItem>(`/albums/${id}`).then((r) => r.data),
  create: (data: { name: string; description?: string }) =>
    http.post<AlbumItem>('/albums', data).then((r) => r.data),
  update: (id: string, data: Partial<AlbumItem>) =>
    http.patch<AlbumItem>(`/albums/${id}`, data).then((r) => r.data),
  remove: (id: string) => http.delete<{ message: string }>(`/albums/${id}`).then((r) => r.data),
};

export const tagApi = {
  list: () => http.get<{ data: TagItem[] }>('/tags').then((r) => r.data.data),
};

export const authApi = {
  login: (username: string, password: string) =>
    http.post<{ token: string; username: string }>('/auth/login', { username, password }).then((r) => r.data),
  me: () => http.get<{ valid: boolean; username?: string }>('/auth/me').then((r) => r.data),
};
