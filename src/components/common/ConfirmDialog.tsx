import React, { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmWord?: string; // If set, requires typing this word
  confirmButtonText?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmWord,
  confirmButtonText = 'Confirm',
  isDestructive = true,
}) => {
  const [typedWord, setTypedWord] = useState('');

  const handleConfirm = () => {
    if (confirmWord && typedWord.toUpperCase() !== confirmWord.toUpperCase()) {
      return;
    }
    onConfirm();
    setTypedWord('');
    onClose();
  };

  const isButtonDisabled = Boolean(confirmWord && typedWord.toUpperCase() !== confirmWord.toUpperCase());

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '10px',
              backgroundColor: 'rgba(244, 63, 94, 0.12)',
              color: 'var(--accent-rose)',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>

        {confirmWord && (
          <div style={{ marginTop: '6px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Type <strong style={{ color: 'var(--text-main)' }}>{confirmWord}</strong> to confirm:
            </label>
            <input
              type="text"
              value={typedWord}
              onChange={(e) => setTypedWord(e.target.value)}
              placeholder={confirmWord}
              className="input-field"
              autoFocus
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isButtonDisabled}
            className={isDestructive ? 'btn-danger' : 'btn-primary'}
            style={{
              opacity: isButtonDisabled ? 0.4 : 1,
              cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
