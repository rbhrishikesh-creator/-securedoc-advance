import React, { useState } from 'react';
import { Search, ShieldAlert, CheckCircle2, User, Clock, Globe, FileText, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';

export const ForensicTraceCard: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);
  const { showToast } = useToast();

  const handleTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      setSearched(true);
      const res = await adminApi.traceForensicWatermark(query.trim());
      setResult(res);
      if (res.found && res.matches.length > 0) {
        showToast({
          type: 'success',
          title: 'Forensic Match Found',
          message: `Identified ${res.matches.length} matching preview sessions for watermark code.`,
        });
      }
    } catch (err: any) {
      setResult(null);
      showToast({
        type: 'error',
        title: 'Trace Search',
        message: err.message || 'No match found for this forensic tracking code.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #f43f5e, #f59e0b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <ShieldAlert size={22} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>
            Forensic Anti-Leak Attribution Engine
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Trace leaked document photos, screenshots, or prints back to the originating viewer & session
          </p>
        </div>
      </div>

      <form onSubmit={handleTrace} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search
            size={18}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="input-control"
            placeholder="Enter tracking code (e.g. SD-7A8F9C1E) or SHA-256 checksum..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 42 }}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSearching}
          style={{ minWidth: 160 }}
        >
          {isSearching ? 'Tracing Hash...' : 'Trace Leaked Code'} <ArrowRight size={16} />
        </button>
      </form>

      {/* Result Display */}
      {searched && (
        result?.found && result.matches.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                color: '#10b981',
              }}
            >
              <CheckCircle2 size={18} />
              <span><strong>Positive Match:</strong> Watermark was stamped on active custody preview.</span>
            </div>

            {result.matches.map((match: any, idx: number) => (
              <div
                key={match.auditId || idx}
                style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={16} color="#6366f1" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                      Viewer: {match.viewer?.name || 'Unknown'} ({match.viewer?.email || 'N/A'})
                    </span>
                    <span className="badge badge-indigo">{match.viewer?.role}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(match.timestamp).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Document: </span>
                    <strong>{match.details?.documentName || 'Confidential Doc'}</strong> (v{match.details?.version || 1})
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Viewer IP Address: </span>
                    <code style={{ color: '#06b6d4' }}>{match.ipAddress}</code>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Watermark Tracking Code: </span>
                    <code style={{ color: '#f59e0b' }}>{match.details?.trackingCode || 'N/A'}</code>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Custody SHA-256 Checksum: </span>
                    <span style={{ fontFamily: 'monospace', color: '#a5b4fc' }}>
                      {match.details?.custodyChecksum?.substring(0, 16)}...
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                  User Agent: {match.userAgent}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: 13,
            }}
          >
            <AlertCircle size={24} color="#f43f5e" style={{ margin: '0 auto 8px' }} />
            <div>No matching preview events found for code "<strong>{query}</strong>".</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Ensure the tracking code starts with "SD-" or matches the 64-character SHA-256 checksum.
            </p>
          </div>
        )
      )}
    </div>
  );
};
