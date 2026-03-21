import React from 'react';

type ReusableFormModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
  saveLabel?: string;
  cancelLabel?: string;
  saveDisabled?: boolean;
};

export default function ReusableFormModal({
  isOpen,
  title,
  onClose,
  onSave,
  children,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  saveDisabled = false,
}: ReusableFormModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.45)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-xl rounded-2xl p-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>

        <div className="mt-4 space-y-3">{children}</div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            className="h-10 px-4 rounded-lg"
            style={{
              background: 'var(--brand-dim)',
              color: 'var(--brand-light)',
              border: '1px solid var(--brand-border)',
              opacity: saveDisabled ? 0.65 : 1,
            }}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
