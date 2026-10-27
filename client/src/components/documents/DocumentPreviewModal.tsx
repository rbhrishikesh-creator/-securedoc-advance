import React, { useState, useEffect } from 'react';
import { Eye, Shield, Lock, AlertTriangle, Download, RefreshCw, Flame, Sliders, Check, Copy, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { documentsApi } from '../../api/documents';
import { DocumentItem, DocumentPreviewData } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { DynamicWatermarkOverlay, WatermarkMode } from './DynamicWatermarkOverlay';
import { DocumentAiModal } from './DocumentAiModal';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
}

interface PdfCanvasViewerProps {
  base64: string;
  documentName: string;
}

const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({ base64, documentName }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.15);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [useFallback, setUseFallback] = useState<boolean>(false);

  // Convert base64 to byte array
  const pdfBytes = React.useMemo(() => {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch {
      return null;
    }
  }, [base64]);

  // Object blob URL fallback
  const blobUrl = React.useMemo(() => {
    if (!pdfBytes) return null;
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }, [pdfBytes]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // Load PDF with pdfjsLib (lazy load script if needed)
  useEffect(() => {
    if (!pdfBytes) return;

    const loadPdfDoc = (lib: any) => {
      try {
        const loadingTask = lib.getDocument({ data: pdfBytes });
        loadingTask.promise
          .then((doc: any) => {
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setCurrentPage(1);
            setUseFallback(false);
          })
          .catch((err: any) => {
            console.warn('PDF.js loading failed, using native embed fallback:', err);
            setUseFallback(true);
          });
      } catch {
        setUseFallback(true);
      }
    };

    const existingLib = (window as any).pdfjsLib || (window as any)['pdfjs-dist/build/pdf'];
    if (existingLib) {
      loadPdfDoc(existingLib);
    } else {
      // Lazy-load script asynchronously
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const lib = (window as any).pdfjsLib || (window as any)['pdfjs-dist/build/pdf'];
        if (lib) {
          lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          loadPdfDoc(lib);
        } else {
          setUseFallback(true);
        }
      };
      script.onerror = () => {
        setUseFallback(true);
      };
      document.head.appendChild(script);
    }
  }, [pdfBytes]);

  // Render page to canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || useFallback) return;
    pdfDoc
      .getPage(currentPage)
      .then((page: any) => {
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        page.render(renderContext);
      })
      .catch(() => {
        setUseFallback(true);
      });
  }, [pdfDoc, currentPage, scale, useFallback]);

  if (useFallback && blobUrl) {
    return (
      <div
        style={{
          width: '100%',
          height: 480,
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <object
          data={`${blobUrl}#toolbar=0&navpanes=0`}
          type="application/pdf"
          style={{ width: '100%', height: '100%', border: 'none' }}
        >
          <iframe
            src={`${blobUrl}#toolbar=0&navpanes=0`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={documentName}
          />
        </object>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        position: 'relative',
        zIndex: 1,
        width: '100%',
      }}
    >
      {numPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(15, 23, 42, 0.85)',
            padding: '4px 14px',
            borderRadius: 20,
            border: '1px solid var(--border-color)',
            fontSize: 12,
            color: '#e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '2px 6px',
              opacity: currentPage <= 1 ? 0.4 : 1,
            }}
          >
            ◀ Prev
          </button>
          <span>
            Page {currentPage} of {numPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '2px 6px',
              opacity: currentPage >= numPages ? 0.4 : 1,
            }}
          >
            Next ▶
          </button>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.7, s - 0.15))}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 6px' }}
          >
            − Zoom
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 6px' }}
          >
            + Zoom
          </button>
        </div>
      )}

      <div
        style={{
          maxWidth: '100%',
          overflowX: 'auto',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto', background: '#ffffff' }} />
      </div>
    </div>
  );
};

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document: doc,
}) => {
  const [data, setData] = useState<DocumentPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.24);
  const [watermarkMode, setWatermarkMode] = useState<WatermarkMode>('standard');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isViewerOnly = !isAdmin;

  useEffect(() => {
    if (isOpen && doc) {
      loadPreview();
    } else {
      setData(null);
    }
  }, [isOpen, doc]);

  const loadPreview = async () => {
    if (!doc) return;
    try {
      setIsLoading(true);
      const res = await documentsApi.preview(doc._id);
      setData(res);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Preview Failed',
        message: err.message || 'Error decrypting document for in-browser preview.',
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTrackingCode = () => {
    if (!data?.watermark.trackingCode) return;
    navigator.clipboard.writeText(data.watermark.trackingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!doc) return null;

  const isImage = data?.mimeType?.startsWith('image/') || doc?.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/);
  const isPdf =
    data?.mimeType === 'application/pdf' ||
    doc?.name?.toLowerCase().endsWith('.pdf') ||
    (data as any)?.originalName?.toLowerCase().endsWith('.pdf');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Decrypted View: "${doc.name}" (v${doc.currentVersion})`}
      maxWidth={880}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Anti-leak watermark dynamic toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color="#6366f1" />
            <span>
              <strong>Dynamic Anti-Leak Watermark:</strong> Attributed to <code>{data?.watermark.viewerEmail || 'User'}</code>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Watermark Mode Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mode:</span>
              <select
                value={watermarkMode}
                onChange={(e) => setWatermarkMode(e.target.value as WatermarkMode)}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                <option value="standard">Standard Grid</option>
                <option value="strict">Strict Custody</option>
                <option value="steganographic">Microdot Moiré</option>
              </select>
            </div>

            {/* Opacity Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Intensity:</span>
              <input
                type="range"
                min="0.10"
                max="0.55"
                step="0.02"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                style={{ width: 75, cursor: 'pointer' }}
                title="Adjust watermark opacity"
              />
            </div>
          </div>
        </div>

        {/* Burn-on-read indicator */}
        {doc.isBurnAfterRead && (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Flame size={16} />
            <span>
              <strong>Ephemeral Custody:</strong> This document is flagged for automatic cryptographic shredding after download.
            </span>
          </div>
        )}

        {/* Main Document Content Viewport with Dynamic Anti-Leak Watermark */}
        <div
          style={{
            position: 'relative',
            background: '#070b14',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            minHeight: 380,
            maxHeight: 520,
            overflowY: 'auto',
            padding: isImage ? '16px' : '28px',
            fontFamily: data?.isText ? 'monospace' : 'inherit',
            fontSize: 13,
            lineHeight: 1.6,
            color: '#e2e8f0',
            whiteSpace: data?.isText ? 'pre-wrap' : 'normal',
            userSelect: 'none', // Prevents unauthorized copy-pasting
          }}
        >
          {/* Dynamic Watermark Overlay */}
          {data && (
            <DynamicWatermarkOverlay
              viewerEmail={data.watermark.viewerEmail}
              viewerIp={data.watermark.viewerIp}
              timestamp={data.watermark.timestamp}
              checksum={data.watermark.custodyChecksum}
              trackingCode={data.watermark.trackingCode}
              opacity={watermarkOpacity}
              mode={watermarkMode}
            />
          )}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px' }} />
              Decrypting AES-256-GCM ciphertext stream...
            </div>
          ) : data ? (
            data.isText ? (
              <div style={{ position: 'relative', zIndex: 1 }}>{data.content}</div>
            ) : isImage ? (
              <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <img
                  src={`data:${data.mimeType};base64,${data.content}`}
                  alt={doc.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 460,
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  }}
                />
              </div>
            ) : isPdf ? (
              <PdfCanvasViewer base64={data.content} documentName={doc.name} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Binary / Encrypted Payload Decrypted
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                  Format: {data.mimeType} ({(doc.sizeBytes / 1024).toFixed(1)} KB)
                </p>
                {!isViewerOnly ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => documentsApi.download(doc._id, doc.currentVersion, doc.name)}
                  >
                    <Download size={16} /> Save Decrypted File
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      fontSize: 13,
                    }}
                  >
                    <Lock size={14} /> Download restricted by document owner (View Only)
                  </div>
                )}
              </div>
            )
          ) : null}
        </div>

        {/* Footer with Forensic Trace Code & Cryptographic Verification */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ fontFamily: 'monospace' }}>AES-256-GCM Verified</span>
            {data?.watermark.trackingCode && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(99, 102, 241, 0.1)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  fontFamily: 'monospace',
                  color: '#38bdf8',
                }}
              >
                <span>TRACE: {data.watermark.trackingCode}</span>
                <button
                  onClick={handleCopyTrackingCode}
                  style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 0 }}
                  title="Copy forensic tracking code"
                >
                  {copiedCode ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAiModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                color: '#818cf8',
                fontWeight: 600,
              }}
            >
              <Sparkles size={15} /> AI Intelligence & Ask AI
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close Preview
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Document AI Modal */}
      {isAiModalOpen && (
        <DocumentAiModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          document={doc}
        />
      )}
    </Modal>
  );
};
