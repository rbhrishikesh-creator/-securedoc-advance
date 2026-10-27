import { request } from './client';
import { DocumentItem, DocumentVersion, DocumentPreviewData, VersionDiffData } from '../types';

export const documentsApi = {
  list: (params: { folderId?: string; search?: string; type?: string; sharedOnly?: boolean; isStarred?: boolean; tag?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.folderId) query.set('folderId', params.folderId);
    if (params.search) query.set('search', params.search);
    if (params.type) query.set('type', params.type);
    if (params.sharedOnly) query.set('sharedOnly', 'true');
    if (params.isStarred) query.set('isStarred', 'true');
    if (params.tag) query.set('tag', params.tag);
    const qs = query.toString();
    return request<{ documents: DocumentItem[] }>(`/documents${qs ? `?${qs}` : ''}`);
  },

  getDetails: (id: string) =>
    request<{ document: DocumentItem; versions: DocumentVersion[] }>(`/documents/${id}`),

  preview: (id: string, version?: number) =>
    request<DocumentPreviewData>(`/documents/${id}/preview${version ? `?version=${version}` : ''}`),

  diff: (id: string, v1: number, v2: number) =>
    request<VersionDiffData>(`/documents/${id}/diff?v1=${v1}&v2=${v2}`),

  upload: (formData: FormData) =>
    request<{ message: string; document: DocumentItem; version: DocumentVersion }>('/documents', {
      method: 'POST',
      body: formData,
    }),

  uploadNewVersion: (id: string, formData: FormData) =>
    request<{ message: string; document: DocumentItem; version: DocumentVersion }>(`/documents/${id}/versions`, {
      method: 'POST',
      body: formData,
    }),

  restoreVersion: (id: string, targetVersion: number) =>
    request<{ message: string; document: DocumentItem; version: DocumentVersion }>(`/documents/${id}/restore-version`, {
      method: 'POST',
      body: JSON.stringify({ targetVersion }),
    }),

  rename: (id: string, name: string) =>
    request<{ message: string; document: DocumentItem }>(`/documents/${id}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  toggleStar: (id: string) =>
    request<{ message: string; isStarred: boolean; document: DocumentItem }>(`/documents/${id}/star`, {
      method: 'PATCH',
    }),

  updateTags: (id: string, tags: string[]) =>
    request<{ message: string; tags: string[]; document: DocumentItem }>(`/documents/${id}/tags`, {
      method: 'PATCH',
      body: JSON.stringify({ tags }),
    }),

  lock: (id: string) =>
    request<{ message: string; document: DocumentItem }>(`/documents/${id}/lock`, {
      method: 'POST',
    }),

  unlock: (id: string) =>
    request<{ message: string; document: DocumentItem }>(`/documents/${id}/unlock`, {
      method: 'POST',
    }),

  createGuestLink: (
    id: string,
    data: { expiresInHours?: number; password?: string; maxViews?: number; allowDownload?: boolean }
  ) =>
    request<{
      message: string;
      link: {
        id: string;
        token: string;
        expiresAt: string;
        maxViews?: number | null;
        hasPassword: boolean;
        allowDownload: boolean;
        viewCount: number;
      };
    }>(`/documents/${id}/guest-links`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getGuestLinks: (id: string) =>
    request<{
      links: Array<{
        id: string;
        token: string;
        expiresAt: string;
        maxViews?: number | null;
        viewCount: number;
        hasPassword: boolean;
        allowDownload: boolean;
        isExpired: boolean;
        createdAt: string;
      }>;
    }>(`/documents/${id}/guest-links`),

  revokeGuestLink: (id: string, linkId: string) =>
    request<{ message: string }>(`/documents/${id}/guest-links/${linkId}`, {
      method: 'DELETE',
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    }),

  download: async (id: string, version?: number, filename: string = 'document') => {
    const url = `/documents/${id}/download${version ? `?version=${version}` : ''}`;
    const blob = await request<Blob>(url);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  share: (id: string, email: string, role: 'viewer' | 'editor' | 'owner') =>
    request<{ message: string }>(`/documents/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),

  revokeShare: (id: string, userId: string) =>
    request<{ message: string }>(`/documents/${id}/share/${userId}`, {
      method: 'DELETE',
    }),
};
