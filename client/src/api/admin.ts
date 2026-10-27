import { request } from './client';
import { AdminStats, User, AuditLogItem } from '../types';

export const adminApi = {
  getStats: () => request<{ stats: AdminStats }>('/admin/stats'),

  listUsers: () => request<{ users: User[] }>('/admin/users'),

  toggleUserStatus: (userId: string, status: 'active' | 'disabled') =>
    request<{ message: string; user: User }>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  changeUserRole: (userId: string, role: 'admin' | 'user') =>
    request<{ message: string; user: User }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  getAuditLogs: (params: { action?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.action) query.set('action', params.action);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    const qs = query.toString();
    return request<{ logs: AuditLogItem[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>(
      `/admin/audit-logs${qs ? `?${qs}` : ''}`
    );
  },

  traceForensicWatermark: (query: string) =>
    request<{
      found: boolean;
      matches: Array<{
        auditId: string;
        timestamp: string;
        ipAddress: string;
        userAgent: string;
        viewer: { _id: string; name: string; email: string; role: string; status?: string };
        documentId: string;
        details: any;
      }>;
    }>('/admin/forensic-trace', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
};
