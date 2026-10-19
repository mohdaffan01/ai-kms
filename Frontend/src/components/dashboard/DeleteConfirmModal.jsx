import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, FileText, Loader2 } from 'lucide-react';

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Document',
  itemName = '',
  itemSubject = '',
  warningMessage = 'Are you sure you want to delete this document? This action cannot be undone and will permanently remove all AI study index and vector data associated with it.',
  confirmButtonText = 'Delete Document',
  isDeleting = false,
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay" onClick={isDeleting ? undefined : onClose}>
      <div className="delete-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="delete-modal-header">
          <div className="delete-modal-title-group">
            <div className="delete-modal-icon-badge">
              <Trash2 size={20} />
            </div>
            <div className="delete-modal-title-texts">
              <h3 className="delete-modal-title">{title}</h3>
              <p className="delete-modal-subtitle">Confirm permanent removal</p>
            </div>
          </div>
          <button
            type="button"
            className="delete-modal-close-btn"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="delete-modal-body">
          {itemName && (
            <div className="delete-item-preview-card">
              <div className="delete-item-icon-wrap">
                <FileText size={22} />
              </div>
              <div className="delete-item-info">
                <span className="delete-item-name" title={itemName}>
                  {itemName}
                </span>
                {itemSubject && (
                  <span className="delete-item-subject-tag">{itemSubject}</span>
                )}
              </div>
            </div>
          )}

          <div className="delete-modal-warning-alert">
            <AlertTriangle size={18} className="warning-icon" />
            <p className="warning-text">{warningMessage}</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="delete-modal-footer">
          <button
            type="button"
            className="btn-delete-modal-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-delete-modal-confirm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>{confirmButtonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
