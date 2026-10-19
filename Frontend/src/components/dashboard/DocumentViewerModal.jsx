import React from 'react';
import { 
  X, 
  ExternalLink, 
  Download, 
  Trash2, 
  FileText, 
  Calendar, 
  Folder, 
  BookOpen, 
  Tag, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';
import { deleteDocumentApi } from '../../api/documentApi';
import DeleteConfirmModal from './DeleteConfirmModal';

const API_STATIC_BASE = 'http://localhost:3000';

const DocumentViewerModal = ({ document: doc, isOpen, onClose, onDeleteSuccess }) => {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !doc) return null;

  const fileUrl = doc.filePath ? `${API_STATIC_BASE}/${doc.filePath.replace(/^\/+/, '')}` : '#';

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenInNewTab = () => {
    if (fileUrl && fileUrl !== '#') {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteDocumentApi(doc._id || doc.id);
      window.dispatchEvent(
        new CustomEvent('aikms:document-deleted', { detail: { id: doc._id || doc.id } })
      );
      if (onDeleteSuccess) onDeleteSuccess(doc._id || doc.id);
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete document.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isPdf = doc.mimeType?.includes('pdf') || doc.originalFileName?.toLowerCase().endsWith('.pdf');

  return (
    <div className="doc-viewer-overlay" onClick={onClose}>
      <div className="doc-viewer-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="doc-viewer-header">
          <div className="doc-header-info">
            <div className="doc-icon-wrapper">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="doc-viewer-title">{doc.title}</h3>
              <p className="doc-viewer-subtitle">{doc.originalFileName || 'Uploaded Document'}</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="doc-viewer-body">
          {/* Main Document Preview Box */}
          <div className="doc-preview-box">
            {isPdf ? (
              <iframe
                src={`${fileUrl}#toolbar=0`}
                title={doc.title}
                className="doc-pdf-frame"
              />
            ) : (
              <div className="doc-file-placeholder">
                <FileText size={56} className="placeholder-icon" />
                <h4>{doc.originalFileName}</h4>
                <p>Preview available by downloading or opening in a new tab.</p>
                <button className="btn-preview-action" onClick={handleOpenInNewTab}>
                  <ExternalLink size={16} /> Open Document File
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Metadata */}
          <div className="doc-metadata-panel">
            <h4 className="metadata-panel-title">Document Details</h4>

            <div className="metadata-list">
              <div className="metadata-item">
                <BookOpen size={16} className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">Subject</span>
                  <span className="meta-value">{doc.subject}</span>
                </div>
              </div>

              {doc.topic && (
                <div className="metadata-item">
                  <Tag size={16} className="meta-icon" />
                  <div className="meta-content">
                    <span className="meta-label">Topic</span>
                    <span className="meta-value">{doc.topic}</span>
                  </div>
                </div>
              )}

              <div className="metadata-item">
                <Folder size={16} className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">Folder</span>
                  <span className="meta-value">{doc.folder || 'General'}</span>
                </div>
              </div>

              <div className="metadata-item">
                <FileText size={16} className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">File Size</span>
                  <span className="meta-value">{formatFileSize(doc.fileSize)}</span>
                </div>
              </div>

              <div className="metadata-item">
                <Calendar size={16} className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">Uploaded On</span>
                  <span className="meta-value">{formatDate(doc.createdAt)}</span>
                </div>
              </div>

              <div className="metadata-item">
                <Clock size={16} className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">Status</span>
                  <span className={`status-badge status-${doc.processingStatus || 'uploaded'}`}>
                    {doc.processingStatus === 'processing' ? (
                      <Loader2 size={12} className="spinner" />
                    ) : (
                      <CheckCircle2 size={12} />
                    )}
                    {doc.processingStatus || 'uploaded'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions inside Metadata Panel */}
            <div className="doc-actions-footer">
              <button className="btn-doc-action btn-doc-open" onClick={handleOpenInNewTab}>
                <ExternalLink size={16} /> Open in Tab
              </button>
              
              <a
                href={fileUrl}
                download={doc.originalFileName || doc.title}
                className="btn-doc-action btn-doc-download"
                target="_blank"
                rel="noreferrer"
              >
                <Download size={16} /> Download
              </a>

              <button className="btn-doc-action btn-doc-delete" onClick={handleDelete}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Document Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          if (!isDeleting) setIsDeleteConfirmOpen(false);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Document"
        itemName={doc.title}
        itemSubject={doc.subject}
        warningMessage="Are you sure you want to delete this document? This will permanently remove the file and all associated study notes from MongoDB."
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default DocumentViewerModal;
