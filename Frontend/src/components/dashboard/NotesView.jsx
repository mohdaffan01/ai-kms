import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Search, 
  Trash2, 
  Eye, 
  Sparkles, 
  Folder, 
  Calendar, 
  HardDrive, 
  Plus, 
  Loader2,
  BookOpen,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { getMyDocumentsApi, deleteDocumentApi } from '../../api/documentApi';
import UploadModal from './UploadModal';
import DocumentViewerModal from './DocumentViewerModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import '../../styles/notes.css';

const NotesView = ({ onSelectTab, onOpenDocumentViewer }) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const res = await getMyDocumentsApi();
      if (res && res.documents) {
        setDocuments(res.documents);
      }
    } catch (err) {
      console.warn('Failed to load notes & documents:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    const handleDocUpdate = () => fetchDocuments();
    window.addEventListener('aikms:document-uploaded', handleDocUpdate);
    window.addEventListener('aikms:document-deleted', handleDocUpdate);

    return () => {
      window.removeEventListener('aikms:document-uploaded', handleDocUpdate);
      window.removeEventListener('aikms:document-deleted', handleDocUpdate);
    };
  }, []);

  // Distinct subjects for filter pills
  const availableSubjects = useMemo(() => {
    const set = new Set();
    documents.forEach((d) => {
      if (d.subject && d.subject.trim()) {
        set.add(d.subject.trim());
      }
    });
    return Array.from(set);
  }, [documents]);

  // Total storage calculated
  const totalStorageBytes = useMemo(() => {
    return documents.reduce((acc, doc) => acc + (doc.fileSize || 0), 0);
  }, [documents]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatRelativeDate = (dateString) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recent';
    const now = new Date();
    const diffHours = Math.round((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFileExtension = (filename = '') => {
    const ext = filename.split('.').pop() || 'PDF';
    return ext.toUpperCase().slice(0, 4);
  };

  // Filtered documents by search and subject
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (doc.title && doc.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.subject && doc.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.topic && doc.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.filename && doc.filename.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSubject =
        selectedSubject === 'all' ||
        (doc.subject && doc.subject.trim().toLowerCase() === selectedSubject.trim().toLowerCase());

      return matchesSearch && matchesSubject;
    });
  }, [documents, searchQuery, selectedSubject]);

  const handleDeleteDoc = async () => {
    if (!docToDelete) return;
    try {
      setIsDeleting(true);
      await deleteDocumentApi(docToDelete._id || docToDelete.id);
      setDocuments((prev) => prev.filter((d) => (d._id || d.id) !== (docToDelete._id || docToDelete.id)));
      window.dispatchEvent(new CustomEvent('aikms:document-deleted', { detail: docToDelete._id || docToDelete.id }));
      setDocToDelete(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Could not delete note file. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDoc = (doc) => {
    if (onOpenDocumentViewer) {
      onOpenDocumentViewer(doc);
    } else {
      setViewerDoc(doc);
      setIsViewerOpen(true);
    }
  };

  return (
    <div className="notes-page-container">
      {/* 1. Header Row */}
      <div className="notes-header-section">
        <div className="notes-header-left">
          <div className="notes-header-title-row">
            <div className="notes-header-icon">
              <FileText size={22} />
            </div>
            <h1 className="notes-header-title">Study Notes & PDF Vault</h1>
          </div>
          <p className="notes-header-subtitle">
            Manage, review, and query all your curriculum notes, syllabus PDFs, and learning materials with AI.
          </p>
        </div>

        <button
          type="button"
          className="btn-upload-notes-cta"
          onClick={() => setIsUploadOpen(true)}
          title="Upload new study material or lecture notes"
        >
          <Plus size={18} />
          <span>Upload Notes / PDF</span>
        </button>
      </div>

      {/* 2. Stats Row */}
      <div className="notes-stats-grid">
        <div className="notes-stat-card">
          <div className="notes-stat-icon-wrapper emerald">
            <BookOpen size={20} />
          </div>
          <div className="notes-stat-info">
            <span className="notes-stat-value">{documents.length}</span>
            <span className="notes-stat-label">Total Documents</span>
          </div>
        </div>

        <div className="notes-stat-card">
          <div className="notes-stat-icon-wrapper blue">
            <Folder size={20} />
          </div>
          <div className="notes-stat-info">
            <span className="notes-stat-value">{availableSubjects.length}</span>
            <span className="notes-stat-label">Subjects Covered</span>
          </div>
        </div>

        <div className="notes-stat-card">
          <div className="notes-stat-icon-wrapper purple">
            <HardDrive size={20} />
          </div>
          <div className="notes-stat-info">
            <span className="notes-stat-value">{formatFileSize(totalStorageBytes)}</span>
            <span className="notes-stat-label">Vault Storage</span>
          </div>
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="notes-controls-bar">
        <div className="notes-search-wrapper">
          <Search size={16} className="notes-search-icon" />
          <input
            type="text"
            className="notes-search-input"
            placeholder="Search notes by title, subject, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {availableSubjects.length > 0 && (
          <div className="notes-subject-pills">
            <button
              type="button"
              className={`notes-pill-btn ${selectedSubject === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedSubject('all')}
            >
              All Subjects ({documents.length})
            </button>
            {availableSubjects.map((sub) => {
              const count = documents.filter((d) => d.subject?.trim() === sub).length;
              return (
                <button
                  key={sub}
                  type="button"
                  className={`notes-pill-btn ${selectedSubject === sub ? 'active' : ''}`}
                  onClick={() => setSelectedSubject(sub)}
                >
                  {sub} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Notes Grid or Empty State */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '0.75rem', color: '#94a3b8' }}>
          <Loader2 size={24} className="spin-animate" />
          <span>Loading study vault...</span>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="notes-empty-state">
          <div className="notes-empty-icon">
            <UploadCloud size={28} />
          </div>
          <h3 className="notes-empty-title">
            {searchQuery || selectedSubject !== 'all' ? 'No Matching Notes Found' : 'No Study Notes or Materials Yet'}
          </h3>
          <p className="notes-empty-desc">
            {searchQuery || selectedSubject !== 'all'
              ? 'Try adjusting your search terms or subject filter to find your notes.'
              : 'Upload lecture slides, textbooks, or personal notes (PDF, DOC, TXT) to start learning with your AI assistant.'}
          </p>
          <button
            type="button"
            className="btn-upload-notes-cta"
            onClick={() => setIsUploadOpen(true)}
            style={{ marginTop: '0.5rem' }}
          >
            <Plus size={16} />
            <span>Upload First Note</span>
          </button>
        </div>
      ) : (
        <div className="notes-grid">
          {filteredDocuments.map((doc) => {
            const ext = getFileExtension(doc.filename);
            return (
              <div key={doc._id || doc.id} className="note-item-card">
                <div className="note-card-top-row">
                  <div className="note-badges-wrapper">
                    <span className="note-badge-ext">{ext}</span>
                    {doc.subject && <span className="note-badge-subject">{doc.subject}</span>}
                    {doc.topic && <span className="note-badge-topic">{doc.topic}</span>}
                  </div>
                </div>

                <div className="note-card-body">
                  <div className="note-card-icon">
                    <FileText size={20} />
                  </div>
                  <div className="note-card-text">
                    <h4 className="note-card-title">{doc.title || doc.filename}</h4>
                    <div className="note-card-meta-line">
                      <span className="note-card-meta-item">
                        <HardDrive size={12} />
                        {formatFileSize(doc.fileSize)}
                      </span>
                      <span className="note-card-meta-dot">&bull;</span>
                      <span className="note-card-meta-item">
                        <Calendar size={12} />
                        {formatRelativeDate(doc.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="note-card-footer">
                  <div className="note-card-actions-left">
                    <button
                      type="button"
                      className="btn-note-action preview"
                      onClick={() => handleOpenDoc(doc)}
                      title="Open document in reader"
                    >
                      <Eye size={14} />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      className="btn-note-action study"
                      onClick={() => {
                        if (onSelectTab) onSelectTab('chat');
                      }}
                      title="Study and ask AI assistant about this note"
                    >
                      <Sparkles size={14} />
                      <span>Ask AI</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn-note-delete"
                    onClick={() => setDocToDelete(doc)}
                    title="Delete note file"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchDocuments();
          setIsUploadOpen(false);
        }}
      />

      {/* Document Viewer Modal */}
      {viewerDoc && (
        <DocumentViewerModal
          document={viewerDoc}
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setViewerDoc(null);
          }}
          onDeleteSuccess={() => {
            setIsViewerOpen(false);
            setViewerDoc(null);
            fetchDocuments();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <DeleteConfirmModal
          isOpen={Boolean(docToDelete)}
          onClose={() => setDocToDelete(null)}
          onConfirm={handleDeleteDoc}
          title="Delete Study Note"
          itemName={docToDelete.title || docToDelete.filename}
          itemSubject={docToDelete.subject}
          warningMessage="Are you sure you want to delete this study material? This will permanently remove the file from your workspace."
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default NotesView;

