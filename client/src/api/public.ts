import { request, API_BASE } from './client';
import { PublicShareInfo } from '../types';

export const publicApi = {
  getShareInfo: (token: string) =>
    request<PublicShareInfo>(`/public/share/${token}`),

  accessShare: (token: string, password?: string) =>
    request<{
      content: string;
      isText: boolean;
      mimeType: string;
      documentName: string;
      watermark: {
        viewerEmail: string;
        viewerIp: string;
        timestamp: string;
        custodyChecksum: string;
      };
    }>(`/public/share/${token}/access`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  downloadPublicFile: async (token: string, password?: string, filename: string = 'document') => {
    const res = await fetch(`${API_BASE}/public/share/${token}/access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, download: true }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(err.message || 'Download failed');
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};
