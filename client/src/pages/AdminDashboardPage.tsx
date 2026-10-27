import React, { useState, useEffect } from 'react';
import {
  Users,
  HardDrive,
  Files,
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  Activity,
  RefreshCw,
  Search,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import { AdminStats, User, AuditLogItem } from '../types';
import { useToast } from '../context/ToastContext';
import { ForensicTraceCard } from '../components/admin/ForensicTraceCard';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'forensics'>('users');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, usersRes, logsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.listUsers(),
        adminApi.getAuditLogs({ limit: 100 }),
      ]);
      setStats(statsRes.stats);
      setUsers(usersRes.users);
      setAuditLogs(logsRes.logs);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Admin Access Error',
        message: err.message || 'Failed to load administrative telemetry.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const actionLabel = nextStatus === 'disabled' ? 'suspend' : 'reinstate';

    if (!window.confirm(`Are you sure you want to ${actionLabel} this user account?`)) return;

    try {
      await adminApi.toggleUserStatus(userId, nextStatus as any);
      showToast({
        type: 'info',
        title: 'Status Updated',
        message: `User account set to ${nextStatus}.`,
      });
      loadAdminData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message,
      });
    }
  };

  const handleChangeUserRole = async (userId: string, nextRole: 'admin' | 'user') => {
    try {
      await adminApi.changeUserRole(userId, nextRole);
      showToast({
        type: 'success',
        title: 'Role Updated',
        message: `User permissions set to ${nextRole === 'admin' ? 'Administrator' : 'Viewer (View-Only)'}.`,
      });
      loadAdminData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message,
      });
    }
  };

  const exportAuditCsv = () => {
    if (!auditLogs.length) return;
    const headers = ['Timestamp', 'Action', 'TargetType', 'TargetId', 'ActorEmail', 'Details', 'IPAddress'];
    const rows = auditLogs.map((log) => [
      new Date(log.createdAt).toISOString(),
      log.action,
      log.targetType,
      log.targetId || '',
      log.userId ? log.userId.email : 'System',
      `"${JSON.stringify(log.details).replace(/"/g, '""')}"`,
      log.ipAddress,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `securedoc_audit_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'Audit Exported', message: 'Downloaded compliance CSV report.' });
  };

  const exportAuditJson = () => {
    if (!auditLogs.length) return;
    const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `securedoc_audit_export_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'Audit Exported', message: 'Downloaded compliance JSON log.' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Admin Telemetry & Compliance</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            System-wide custody statistics, account controls, and audit trails
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportAuditCsv} className="btn btn-secondary btn-sm" title="Export CSV for SOC2/ISO audit">
            <FileSpreadsheet size={15} /> Export CSV
          </button>
          <button onClick={exportAuditJson} className="btn btn-secondary btn-sm" title="Export JSON audit log">
            <Download size={15} /> Export JSON
          </button>
          <button onClick={loadAdminData} className="btn btn-secondary btn-sm">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Total Users</span>
              <Users size={18} color="var(--primary)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{stats.totalUsers}</div>
            <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>
              {stats.verifiedUsers} verified ({stats.unverifiedUsers} pending)
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Total Documents</span>
              <Files size={18} color="#06b6d4" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{stats.totalDocs}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Across {stats.totalVersions} version snapshots
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Encrypted Storage</span>
              <HardDrive size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>
              {(stats.totalStorageBytes / (1024 * 1024)).toFixed(2)} MB
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Zero-plaintext AES-GCM payloads
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Security Events</span>
              <ShieldAlert size={18} color="#f43f5e" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{stats.failedLoginCount}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Failed login alerts monitored
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Users size={15} /> Registered Accounts ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Activity size={15} /> Security Audit Stream ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('forensics')}
          className={`btn btn-sm ${activeTab === 'forensics' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <ShieldAlert size={15} /> Forensic Leak Tracer
        </button>
      </div>

      {/* Tab 1: User Management & Website Access Control */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                🌐 Website Access & User Custody Manager
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                View all individuals who have accessed this document portal and instantly grant or revoke their access to the website.
              </div>
            </div>
            <span className="badge badge-indigo" style={{ fontSize: 12 }}>
              {users.filter((u) => u.status === 'active').length} Active / {users.filter((u) => u.status === 'disabled').length} Disabled
            </span>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>User Details</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Role</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Last Website Access & IP</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Website Access</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>
                    Access Control
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const uId = u._id || u.id || '';
                  const isUserActive = u.status === 'active';
                  const accessedTime = u.lastAccessedAt ? new Date(u.lastAccessedAt).toLocaleString() : 'Recent Session';

                  return (
                    <tr key={uId} style={{ borderBottom: '1px solid var(--border-color)', opacity: isUserActive ? 1 : 0.65 }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                        {u.isVerified ? (
                          <span style={{ fontSize: 10, color: '#10b981', display: 'inline-block', marginTop: 2 }}>
                            ✓ Email Verified
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: '#f59e0b', display: 'inline-block', marginTop: 2 }}>
                            ⚠ Unverified
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        {u.email === 'rbhrishikesh@gmail.com' ? (
                          <span className="badge badge-indigo" style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
                            ⚡ MASTER ADMIN
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeUserRole(uId, e.target.value as 'admin' | 'user')}
                            style={{
                              background: u.role === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: u.role === 'admin' ? '#818cf8' : '#10b981',
                              border: `1px solid ${u.role === 'admin' ? 'rgba(99, 102, 241, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '5px 8px',
                              cursor: 'pointer',
                            }}
                            title="Click to toggle user role between Admin and View-Only Viewer"
                          >
                            <option value="user" style={{ background: '#1e293b', color: '#10b981' }}>
                              👁️ VIEWER (VIEW ONLY)
                            </option>
                            <option value="admin" style={{ background: '#1e293b', color: '#818cf8' }}>
                              ⚡ ADMIN (ALL ACCESS)
                            </option>
                          </select>
                        )}
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{accessedTime}</div>
                        <div style={{ fontSize: 11, color: '#38bdf8', fontFamily: 'monospace', marginTop: 2 }}>
                          IP: {u.lastIp || '127.0.0.1'}
                        </div>
                        {u.lastAction && (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                            Action: {u.lastAction}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        {isUserActive ? (
                          <span
                            className="badge badge-emerald"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px' }}
                          >
                            <UserCheck size={13} /> Access Enabled
                          </span>
                        ) : (
                          <span
                            className="badge badge-rose"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px' }}
                          >
                            <UserX size={13} /> Access Disabled
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleUserStatus(uId, u.status)}
                          className={`btn btn-sm ${isUserActive ? 'btn-danger' : 'btn-primary'}`}
                          style={{
                            padding: '6px 14px',
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                          title={isUserActive ? 'Revoke website access for this user' : 'Restore website access'}
                        >
                          {isUserActive ? (
                            <>
                              <UserX size={14} /> Disable Access
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} /> Enable Access
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Security Audit Logs */}
      {activeTab === 'audit' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-secondary)' }}>Timestamp</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-secondary)' }}>Action</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-secondary)' }}>Actor</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Type</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-secondary)' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => {
                const actorEmail = log.userId ? log.userId.email : 'System';

                return (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 18px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span className="badge badge-indigo" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>{actorEmail}</td>
                    <td style={{ padding: '12px 18px', textTransform: 'uppercase', fontSize: 11 }}>
                      {log.targetType}
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11 }}>
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Forensic Anti-Leak Tracer */}
      {activeTab === 'forensics' && <ForensicTraceCard />}
    </div>
  );
};
