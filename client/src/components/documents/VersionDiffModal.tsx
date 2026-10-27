import React, { useState, useEffect } from 'react';
import { GitCompare, ArrowRight, Check, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { documentsApi } from '../../api/documents';
import { DocumentItem, VersionDiffData } from '../../types';
import { useToast } from '../../context/ToastContext';

interface VersionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
}

export const VersionDiffModal: React.FC<VersionDiffModalProps> = ({
  isOpen,
  onClose,
  document: doc,
}) => {
  const [v1, setV1] = useState<number>(1);
  const [v2, setV2] = useState<number>(1);
  const [diffData, setDiffData] = useState<VersionDiffData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && doc) {
      const current = doc.currentVersion;
      const prev = Math.max(1, current - 1);
      setV1(prev);
      setV2(current);
      loadDiff(prev, current);
    } else {
      setDiffData(null);
    }
  }, [isOpen, doc]);

  const loadDiff = async (versionA: number, versionB: number) => {
    if (!doc) return;
    try {
      setIsLoading(true);
      const res = await documentsApi.diff(doc._id, versionA, versionB);
      setDiffData(res);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Diff Engine Error',
        message: err.message || 'Error comparing document versions.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    loadDiff(v1, v2);
  };

  if (!doc) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Interactive Version Diff: "${doc.name}"`}
      maxWidth={880}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Version selectors */}
        <form
          onSubmit={handleCompare}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-tertiary)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Compare Baseline:</span>
            <select
              className="input-control"
              value={v1}
              onChange={(e) => setV1(parseInt(e.target.value, 10))}
              style={{ width: 100, padding: '6px 10px' }}
            >
              {Array.from({ length: doc.currentVersion }, (_, i) => i + 1).map((v) => (
                <option key={v} value={v}>
                  v{v}
                </option>
              ))}
            </select>

            <ArrowRight size={16} color="var(--text-muted)" />

            <span style={{ fontSize: 13, fontWeight: 600 }}>Compare Target:</span>
            <select
              className="input-control"
              value={v2}
              onChange={(e) => setV2(parseInt(e.target.value, 10))}
              style={{ width: 100, padding: '6px 10px' }}
            >
              {Array.from({ length: doc.currentVersion }, (_, i) => i + 1).map((v) => (
                <option key={v} value={v}>
                  v{v}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-sm btn-primary" disabled={isLoading}>
            <GitCompare size={14} /> Compute Visual Diff
          </button>
        </form>

        {/* Diff Result Viewport */}
        <div
          style={{
            background: '#070b14',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            maxHeight: 460,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: 13,
            padding: '16px',
            lineHeight: 1.6,
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Decrypting and analyzing diff vectors...
            </div>
          ) : !diffData ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Select versions and click Compute Visual Diff.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Simple unified line diff representation */}
              {diffData.version2.lines.map((line, idx) => {
                const isAdded = !diffData.version1.lines.includes(line);
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: isAdded ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      color: isAdded ? '#34d399' : '#cbd5e1',
                      borderLeft: isAdded ? '3px solid #10b981' : '3px solid transparent',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', userSelect: 'none', width: 32 }}>
                      {idx + 1}
                    </span>
                    <span style={{ userSelect: 'none', fontWeight: 700, width: 16 }}>
                      {isAdded ? '+' : ' '}
                    </span>
                    <span style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{line || ' '}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Diff
          </button>
        </div>
      </div>
    </Modal>
  );
};
