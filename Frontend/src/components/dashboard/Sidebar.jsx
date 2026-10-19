import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  Upload, 
  LogOut, 
  User, 
  Menu, 
  X,
  Brain,
  Folder,
  Trash2,
  Eye,
  Loader2,
  LayoutDashboard,
  Layers,
  HelpCircle
} from 'lucide-react';
import UploadModal from './UploadModal';
import DocumentViewerModal from './DocumentViewerModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { getMyDocumentsApi, deleteDocumentApi } from '../../api/documentApi';

const Sidebar = ({ onNewChat, activeTab = 'chat', onSelectTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  // Document Viewer Modal state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const navigate = useNavigate();

  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { name: 'Student', email: 'user@example.com' };
  const folders = [...new Set(documents.map((item) => item.folder?.trim() || 'General'))]
    .sort((first, second) => first.localeCompare(second));
  const existingSubjectNames = [
    ...new Set(documents.map((item) => item.subject?.trim()).filter(Boolean))
  ].sort((first, second) => first.localeCompare(second));
  const documentsByFolder = folders.map((folder) => ({
    folder,
    items: documents.filter((item) => (item.folder?.trim() || 'General') === folder),
  }));

  // Fetch real documents from backend
  const fetchDocuments = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoadingDocs(true);
      const res = await getMyDocumentsApi();
      if (res && res.documents) {
        setDocuments(res.documents);
      }
    } catch (err) {
      console.warn('Could not fetch uploaded documents:', err.message);
    } finally {
      if (showLoading) setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    const handleDocUploaded = (event) => {
      const newDoc = event.detail;
      if (newDoc) {
        setDocuments((prev) => {
          const docId = newDoc._id || newDoc.id;
          if (prev.some((d) => (d._id || d.id) === docId)) return prev;
          return [newDoc, ...prev];
        });
      }
      fetchDocuments(false);
    };

    const handleDocDeleted = (event) => {
      const deletedId = event.detail?.id;
      if (deletedId) {
        setDocuments((prev) => prev.filter((d) => (d._id || d.id) !== deletedId));
      }
      fetchDocuments(false);
    };

    const handleRefresh = () => fetchDocuments(false);

    window.addEventListener('aikms:document-uploaded', handleDocUploaded);
    window.addEventListener('aikms:document-deleted', handleDocDeleted);
    window.addEventListener('aikms:refresh-dashboard', handleRefresh);

    return () => {
      window.removeEventListener('aikms:document-uploaded', handleDocUploaded);
      window.removeEventListener('aikms:document-deleted', handleDocDeleted);
      window.removeEventListener('aikms:refresh-dashboard', handleRefresh);
    };
  }, []);

  // Automatically poll every 2.5 seconds while any document is in 'processing' status
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.processingStatus === 'processing');
    if (!hasProcessing) return;

    const intervalId = setInterval(() => {
      fetchDocuments(false);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [documents]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUploadSuccess = (uploadedDoc) => {
    if (uploadedDoc) {
      setDocuments((prev) => {
        const docId = uploadedDoc._id || uploadedDoc.id;
        if (prev.some((d) => (d._id || d.id) === docId)) return prev;
        return [uploadedDoc, ...prev];
      });
    }
    fetchDocuments(false);
  };

  const handleOpenViewer = (item) => {
    setSelectedDoc(item);
    setIsViewerOpen(true);
  };

  const handleConfirmDeleteDoc = async () => {
    if (!docToDelete) return;
    const docId = docToDelete._id || docToDelete.id;

    try {
      setIsDeletingDoc(true);
      await deleteDocumentApi(docId);
      setDocuments((prev) => prev.filter((d) => (d._id || d.id) !== docId));
      window.dispatchEvent(new CustomEvent('aikms:document-deleted', { detail: { id: docId } }));
      setDocToDelete(null);
    } catch (err) {
      console.error('Delete doc error:', err);
      alert(err.response?.data?.message || 'Could not delete document.');
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const handleViewerDeleteSuccess = (deletedDocId) => {
    setDocuments((prev) => prev.filter((d) => (d._id || d.id) !== deletedDocId));
    window.dispatchEvent(new CustomEvent('aikms:document-deleted', { detail: { id: deletedDocId } }));
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Backdrop for Mobile */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />
      )}

      {/* Main Sidebar Element */}
      <aside className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand & New Chat Button */}
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-logo-icon">
              <Brain size={20} />
            </div>
            <span className="brand-name">AiKMS</span>
          </div>

          <button 
            className={`btn-sidebar-nav ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              if (onSelectTab) onSelectTab('dashboard');
              setIsOpen(false);
            }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          {/* Quick Modules: Quiz (Left, Future) & Flashcards (Right, Active) */}
          <div className="sidebar-action-grid">
            <button
              type="button"
              className="btn-sidebar-square btn-quiz-placeholder"
              title="Quiz & Practice Assessments (Coming Soon)"
              onClick={() => {
                alert('Quiz & Practice Assessment module is coming soon in the next update!');
              }}
            >
              <HelpCircle size={18} />
              <span>Quiz</span>
              <span className="badge-soon">Soon</span>
            </button>

            <button
              type="button"
              className={`btn-sidebar-square btn-flashcards-nav ${activeTab === 'flashcards' ? 'active' : ''}`}
              title="Study & Revise Flashcards"
              onClick={() => {
                if (onSelectTab) onSelectTab('flashcards');
                setIsOpen(false);
              }}
            >
              <Layers size={18} />
              <span>Flashcards</span>
            </button>
          </div>

          <button 
            className={`btn-new-chat ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => {
              if (onSelectTab) onSelectTab('chat');
              if (onNewChat) onNewChat();
              setIsOpen(false);
            }}
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Your Content Section */}
        <div className="sidebar-content-section">
          <div className="section-header">
            <span className="section-title">Your Content</span>
            {documents.length > 0 && (
              <span className="content-count-badge">{documents.length}</span>
            )}
          </div>

          <div className="content-list">
            {isLoadingDocs ? (
              <div className="content-loading-state">Loading files...</div>
            ) : documents.length === 0 ? (
              <div className="empty-content-state">
                <Folder size={24} className="empty-icon" />
                <p>No documents uploaded yet.</p>
              </div>
            ) : (
              documentsByFolder.map(({ folder, items }) => (
                <section className="content-folder-group" key={folder}>
                  <div className="content-folder-heading">
                    <Folder size={14} />
                    <span className="content-folder-name">{folder}</span>
                    <span className="content-folder-count">{items.length}</span>
                  </div>
                  {items.map((item) => {
                    const docId = item._id || item.id;
                    const isDeleting = isDeletingDoc && (docToDelete?._id || docToDelete?.id) === docId;

                    return (
                      <div
                        key={docId}
                        className="content-item"
                        title={`Click to view ${item.title} (${item.subject})`}
                        onClick={() => handleOpenViewer(item)}
                      >
                        <FileText size={16} className="content-icon" />
                        <div className="content-item-info">
                          <span className="content-title">{item.title}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className="content-subject-tag">{item.subject}</span>
                            {item.processingStatus === 'processing' && (
                              <span style={{ fontSize: '0.68rem', color: '#fde047', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Loader2 size={10} className="spinner" /> Processing...
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="content-item-actions">
                          <button
                            className="btn-view-doc"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenViewer(item);
                            }}
                            title="View Document"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            className="btn-delete-doc"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDocToDelete(item);
                            }}
                            title="Delete Document"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 size={14} className="spinner" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </section>
              ))
            )}
          </div>

          <button 
            className="btn-upload-content" 
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload size={16} />
            <span>Upload Content</span>
          </button>
        </div>

        {/* User Footer & Logout */}
        <div className="sidebar-user-footer">
          <div className="user-profile-info">
            <div className="user-avatar-badge">
              <User size={18} />
            </div>
            <div className="user-details">
              <span className="user-display-name">{user.name}</span>
              <span className="user-display-email">{user.email}</span>
            </div>
          </div>

          <button className="btn-sidebar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Upload Content Modal */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUploadSuccess={handleUploadSuccess}
        folders={folders}
        subjects={existingSubjectNames}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        document={documents.find((d) => (d._id || d.id) === (selectedDoc?._id || selectedDoc?.id)) || selectedDoc}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedDoc(null);
        }}
        onDeleteSuccess={handleViewerDeleteSuccess}
      />

      {/* Delete Document Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(docToDelete)}
        onClose={() => {
          if (!isDeletingDoc) setDocToDelete(null);
        }}
        onConfirm={handleConfirmDeleteDoc}
        title="Delete Document"
        itemName={docToDelete?.title}
        itemSubject={docToDelete?.subject}
        warningMessage="Are you sure you want to delete this document? This will permanently remove the file and all associated study notes from MongoDB."
        isDeleting={isDeletingDoc}
      />
    </>
  );
};

export default Sidebar;
