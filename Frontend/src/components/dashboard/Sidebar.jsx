import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import UploadModal from './UploadModal';
import DocumentViewerModal from './DocumentViewerModal';
import { getMyDocumentsApi, deleteDocumentApi } from '../../api/documentApi';

const Sidebar = ({ onNewChat }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Document Viewer Modal state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const navigate = useNavigate();

  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { name: 'Student', email: 'user@example.com' };

  // Fetch real documents from backend
  const fetchDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const res = await getMyDocumentsApi();
      if (res && res.documents) {
        setDocuments(res.documents);
      }
    } catch (err) {
      console.warn('Could not fetch uploaded documents:', err.message);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUploadSuccess = () => {
    fetchDocuments();
  };

  const handleOpenViewer = (item) => {
    setSelectedDoc(item);
    setIsViewerOpen(true);
  };

  const handleDeleteDocument = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document from MongoDB?')) {
      return;
    }
    try {
      setDeletingId(docId);
      await deleteDocumentApi(docId);
      setDocuments((prev) => prev.filter((d) => (d._id || d.id) !== docId));
    } catch (err) {
      console.error('Delete doc error:', err);
      alert(err.response?.data?.message || 'Could not delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewerDeleteSuccess = (deletedDocId) => {
    setDocuments((prev) => prev.filter((d) => (d._id || d.id) !== deletedDocId));
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
            className="btn-new-chat"
            onClick={() => {
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
              documents.map((item) => {
                const docId = item._id || item.id;
                const isDeleting = deletingId === docId;

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
                      <span className="content-subject-tag">{item.subject}</span>
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
                        onClick={(e) => handleDeleteDocument(e, docId)}
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
              })
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
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        document={selectedDoc}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedDoc(null);
        }}
        onDeleteSuccess={handleViewerDeleteSuccess}
      />
    </>
  );
};

export default Sidebar;
