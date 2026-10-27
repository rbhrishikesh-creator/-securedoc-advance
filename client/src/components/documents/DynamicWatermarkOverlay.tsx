import React from 'react';
import { Shield, Lock } from 'lucide-react';

export type WatermarkMode = 'standard' | 'strict' | 'steganographic';

interface DynamicWatermarkOverlayProps {
  viewerEmail: string;
  viewerIp: string;
  timestamp: string;
  checksum: string;
  trackingCode?: string;
  opacity?: number;
  mode?: WatermarkMode;
}

export const DynamicWatermarkOverlay: React.FC<DynamicWatermarkOverlayProps> = ({
  viewerEmail,
  viewerIp,
  timestamp,
  checksum,
  trackingCode,
  opacity = 0.22,
  mode = 'standard',
}) => {
  const shortChecksum = checksum ? checksum.substring(0, 16) : 'CONFIDENTIAL';
  const code = trackingCode || `SD-${shortChecksum.substring(0, 8).toUpperCase()}`;
  const formattedTime = new Date(timestamp).toLocaleString();

  // Grid density based on mode
  const tileCount = mode === 'strict' ? 32 : mode === 'steganographic' ? 40 : 18;

  return (
    <div
      className="watermark-overlay-container"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 20,
        userSelect: 'none',
      }}
    >
      {/* Dynamic Diagonal Lattice */}
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          width: '140%',
          height: '140%',
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'space-around',
          justifyContent: 'space-around',
          opacity: opacity,
          transform: mode === 'strict' ? 'rotate(-28deg) scale(1.1)' : 'rotate(-24deg) scale(1.15)',
          transition: 'opacity 0.2s ease',
        }}
      >
        {Array.from({ length: tileCount }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: mode === 'strict' ? '20px 30px' : '30px 42px',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: 1.35,
              fontSize: mode === 'steganographic' ? 10 : 12,
              fontWeight: 800,
              color: '#ffffff',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.85)) drop-shadow(0 0 1px rgba(0,0,0,0.95))',
              textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)',
            }}
          >
            <div style={{ color: mode === 'strict' ? '#f43f5e' : '#818cf8', fontSize: 10, letterSpacing: '0.12em' }}>
              🔒 SECUREDOC ADVANCED CUSTODY
            </div>
            <div style={{ fontSize: 13, color: '#ffffff' }}>{viewerEmail}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              IP: {viewerIp} • {formattedTime}
            </div>
            <div style={{ fontSize: 10, color: '#38bdf8', fontFamily: 'monospace' }}>
              TRACE: {code} • SHA: {shortChecksum}
            </div>
          </div>
        ))}
      </div>

      {/* Anti-Crop Perimeter Defense Border (for strict custody) */}
      {(mode === 'strict' || mode === 'standard') && (
        <>
          {/* Top Border String */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 18,
              background: 'rgba(15, 23, 42, 0.75)',
              borderBottom: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              fontSize: 9,
              fontFamily: 'monospace',
              color: '#a5b4fc',
              letterSpacing: '0.05em',
              opacity: Math.min(opacity * 2.2, 0.85),
            }}
          >
            <span>CONFIDENTIAL FORENSIC VIEW • {viewerEmail}</span>
            <span>CODE: {code}</span>
            <span>SHA-256: {shortChecksum}</span>
          </div>

          {/* Bottom Border String */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 18,
              background: 'rgba(15, 23, 42, 0.75)',
              borderTop: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              fontSize: 9,
              fontFamily: 'monospace',
              color: '#a5b4fc',
              letterSpacing: '0.05em',
              opacity: Math.min(opacity * 2.2, 0.85),
            }}
          >
            <span>IP: {viewerIp} • {formattedTime}</span>
            <span>UNAUTHORIZED CAPTURE / LEAK TRACEABLE</span>
            <span>AES-256-GCM VERIFIED</span>
          </div>
        </>
      )}

      {/* Print stylesheet to enforce black watermark on hardcopy prints */}
      <style>{`
        @media print {
          .watermark-overlay-container {
            opacity: 0.85 !important;
            filter: contrast(200%) !important;
          }
          .watermark-overlay-container * {
            color: #000000 !important;
          }
        }
      `}</style>
    </div>
  );
};
