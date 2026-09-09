import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Notification({ notifications = [], onCloseNotification }) {
  if (!notifications.length) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '24px',
      zIndex: 5000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '380px',
      width: '100%',
      pointerEvents: 'none',
    }}>
      {notifications.map(n => {
        const isError = n.type === 'error';
        const isSuccess = n.type === 'success';

        const icon = isError
          ? <AlertCircle size={17} color="#DC2626" />
          : (isSuccess ? <CheckCircle2 size={17} color="#16A34A" /> : <Info size={17} color="var(--vsm-blue)" />);

        const accentColor = isError ? '#DC2626' : (isSuccess ? '#16A34A' : 'var(--vsm-blue)');

        return (
          <div
            key={n.id}
            className="animate-modal-scale"
            style={{
              pointerEvents: 'all',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${isError ? '#FECACA' : (isSuccess ? '#BBF7D0' : 'var(--border)')}`,
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 24px rgba(15, 35, 55, 0.12)',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: isError ? '#FEF2F2' : (isSuccess ? '#F0FDF4' : 'rgba(47,111,173,0.1)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {icon}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  {n.message}
                </span>
              </div>

              {onCloseNotification && (
                <button
                  onClick={() => onCloseNotification(n.id)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--secondary-text)',
                    cursor: 'pointer', padding: '4px', borderRadius: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'none'}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Bottom Progress Bar Line */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '2.5px',
              background: accentColor, opacity: 0.8
            }} />
          </div>
        );
      })}
    </div>
  );
}
