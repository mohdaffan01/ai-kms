import { useState, useEffect, useRef } from 'react';
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
  HelpCircle,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  PanelLeftClose
} from 'lucide-react';
import UploadModal from './UploadModal';
import DocumentViewerModal from './DocumentViewerModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import UserProfileFlyout from './UserProfileFlyout';
import { getMyDocumentsApi, deleteDocumentApi } from '../../api/documentApi';
import { getMeApi } from '../../api/authApi';

const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 520;
const DEFAULT_SIDEBAR_WIDTH = 260;

const Sidebar = ({ onNewChat, activeTab = 'chat', onSelectTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  // Documents Section Collapsible state (defaults to false / remembered in localStorage)
  const [isDocsExpanded, setIsDocsExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem('aikms_sidebar_docs_expanded');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const toggleDocsExpanded = () => {
    setIsDocsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem('aikms_sidebar_docs_expanded', String(next));
      return next;
    });
  };

  // Sidebar Collapsed Mini-Rail state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('aikms_sidebar_collapsed');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('aikms_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Resizable Sidebar width state (persisted in localStorage)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('aikms_sidebar_width');
      const parsed = parseInt(saved, 10);
      return !isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH
        ? parsed
        : DEFAULT_SIDEBAR_WIDTH;
    } catch {
      return DEFAULT_SIDEBAR_WIDTH;
    }
  });
  const [isResizing, setIsResizing] = useState(false);

  // Handle drag-to-resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = Math.min(Math.max(e.clientX, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.classList.remove('resizing-sidebar');
      setSidebarWidth((current) => {
        localStorage.setItem('aikms_sidebar_width', String(current));
        return current;
      });
    };

    document.body.classList.add('resizing-sidebar');
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.classList.remove('resizing-sidebar');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleResetWidth = () => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    localStorage.setItem('aikms_sidebar_width', String(DEFAULT_SIDEBAR_WIDTH));
  };

  // Document Viewer Modal state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const navigate = useNavigate();

  // Get user info from localStorage (as reactive state)
  const [user, setUser] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : { name: 'Student', email: 'user@example.com' };
    } catch {
      return { name: 'Student', email: 'user@example.com' };
    }
  });
  const [isProfileWindowOpen, setIsProfileWindowOpen] = useState(false);
  const profileFooterRef = useRef(null);

  // Sync latest user profile on mount
  useEffect(() => {
    const fetchLatestUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const fresh = await getMeApi();
          if (fresh) {
            setUser((prev) => {
              const merged = { ...prev, ...fresh };
              localStorage.setItem('user', JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch {
        // Silently keep localStorage fallback
      }
    };
    fetchLatestUser();

    const handleUserUpdated = (e) => {
      if (e.detail) setUser(e.detail);
    };
    window.addEventListener('aikms:user-updated', handleUserUpdated);
    return () => {
      window.removeEventListener('aikms:user-updated', handleUserUpdated);
    };
  }, []);

  // Close user profile window on outside click or Escape key
  useEffect(() => {
    if (!isProfileWindowOpen) return;

    const handleClickOutside = (e) => {
      if (profileFooterRef.current && !profileFooterRef.current.contains(e.target)) {
        setIsProfileWindowOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProfileWindowOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileWindowOpen]);
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
      setIsDocsExpanded(true);
      localStorage.setItem('aikms_sidebar_docs_expanded', 'true');
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
      <aside 
        className={`chat-sidebar ${isCollapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''} ${isResizing ? 'resizing' : ''}`}
        style={!isOpen ? { width: isCollapsed ? '68px' : `${sidebarWidth}px` } : undefined}
      >
        {/* Brand & New Chat Button */}
        <div className="sidebar-top">
          <div 
            className="sidebar-brand"
            onClick={toggleCollapsed}
            title={isCollapsed ? "Click to expand sidebar" : "Click to collapse sidebar"}
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCollapsed();
              }
            }}
          >
            <div className="brand-logo-icon" style={{ cursor: 'pointer' }}>
              <img
                src="/logo-128.png"
                alt="AiKMS Logo"
                style={{ width: 22, height: 22, objectFit: 'contain', display: 'block', cursor: 'pointer' }}
              />
            </div>
            {!isCollapsed && (
              <>
                <span className="brand-name">AiKMS</span>
                <button 
                  type="button" 
                  className="btn-sidebar-collapse-toggle" 
                  title="Collapse sidebar"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCollapsed();
                  }}
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose size={16} />
                </button>
              </>
            )}
          </div>

          {/* 1. New Chat (Fresh Conversation Action) */}
          <button 
            type="button"
            className="btn-new-chat"
            onClick={() => {
              if (onNewChat) onNewChat();
              setIsOpen(false);
            }}
            title="Start a new chat session"
          >
            <Plus size={18} />
            {!isCollapsed && <span>New Chat</span>}
          </button>

          {/* 2. Chat (Go back to ongoing conversation) */}
          <button 
            type="button"
            className={`btn-sidebar-nav ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => {
              if (onSelectTab) onSelectTab('chat');
              setIsOpen(false);
            }}
            title="Open active chat"
          >
            <MessageSquare size={18} />
            {!isCollapsed && <span>Chat</span>}
          </button>

          {/* 3. Dashboard Overview */}
          <button 
            type="button"
            className={`btn-sidebar-nav ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              if (onSelectTab) onSelectTab('dashboard');
              setIsOpen(false);
            }}
            title="View Dashboard overview"
          >
            <LayoutDashboard size={18} />
            {!isCollapsed && <span>Dashboard</span>}
          </button>

          {/* 4. Notes & Study Materials */}
          <button 
            type="button"
            className={`btn-sidebar-nav ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => {
              if (onSelectTab) onSelectTab('notes');
              setIsOpen(false);
            }}
            title="View study notes and materials"
          >
            <FileText size={18} />
            {!isCollapsed && <span>Notes</span>}
          </button>

          {/* Quick Modules: Quiz (Left, Future) & Flashcards (Right, Active) */}
          <div className="sidebar-action-grid">
            <button
              type="button"
              className={`btn-sidebar-square btn-quiz-nav ${activeTab === 'quiz' ? 'active' : ''}`}
              title="Practice AI Quizzes & Assessments"
              onClick={() => {
                if (onSelectTab) onSelectTab('quiz');
                setIsOpen(false);
              }}
            >
              <HelpCircle size={18} />
              {!isCollapsed && <span>Quiz</span>}
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
              {!isCollapsed && <span>Flashcards</span>}
            </button>
          </div>

          {/* Collapsed Mini-Rail: Upload button directly placed in line with other buttons */}
          {isCollapsed && (
            <button 
              type="button" 
              className="btn-upload-content-collapsed" 
              onClick={() => setIsUploadModalOpen(true)}
              title={`Upload Content • ${documents.length} docs uploaded`}
            >
              <Upload size={18} />
            </button>
          )}
        </div>

        {/* Your Content Section (Visible when expanded) */}
        {!isCollapsed && (
          <div className="sidebar-content-section">
            <div 
              className="section-header"
            onClick={toggleDocsExpanded}
            role="button"
            tabIndex={0}
            aria-expanded={isDocsExpanded}
            title={isDocsExpanded ? "Click to collapse documents" : "Click to view documents"}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDocsExpanded();
              }
            }}
          >
            <div className="section-header-title-row">
              <span className="section-title">Documents</span>
              {documents.length > 0 && (
                <span className="content-count-badge">{documents.length}</span>
              )}
              <div className="section-arrow-badge">
                <ChevronDown 
                  size={14} 
                  className={`section-toggle-arrow ${isDocsExpanded ? 'expanded' : ''}`} 
                />
              </div>
            </div>
          </div>

          {isDocsExpanded && (
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
          )}

            <button 
              className="btn-upload-content" 
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Upload size={16} />
              <span>Upload Content</span>
            </button>
          </div>
        )}

        {/* User Footer & Logout */}
        <div className="sidebar-user-footer" ref={profileFooterRef}>
          <div 
            className={`user-profile-info ${isProfileWindowOpen ? 'active' : ''}`}
            onClick={() => setIsProfileWindowOpen((prev) => !prev)}
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            aria-expanded={isProfileWindowOpen}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsProfileWindowOpen((prev) => !prev);
              }
            }}
            title="Click to open profile & account details"
          >
            <div className="user-avatar-badge">
              <User size={18} />
            </div>
            {!isCollapsed && (
              <>
                <div className="user-details">
                  <span className="user-display-name">{user.name}</span>
                  <span className="user-display-email">{user.email}</span>
                </div>
                <ChevronRight 
                  size={14} 
                  className={`user-profile-chevron ${isProfileWindowOpen ? 'open' : ''}`} 
                />
              </>
            )}
          </div>

          <button className="btn-sidebar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>

          {/* Small Profile Window on Right Side */}
          {isProfileWindowOpen && (
            <UserProfileFlyout
              user={user}
              onClose={() => setIsProfileWindowOpen(false)}
              onUserUpdate={(updated) => {
                setUser((prev) => ({ ...prev, ...updated }));
                localStorage.setItem('user', JSON.stringify({ ...user, ...updated }));
                window.dispatchEvent(new CustomEvent('aikms:user-updated', { detail: { ...user, ...updated } }));
              }}
              onLogout={handleLogout}
              docCount={documents.length}
              subjectCount={existingSubjectNames.length}
              onSelectTab={onSelectTab}
            />
          )}
        </div>

        {/* Sidebar Resize Handle (Drag to adjust width - available when expanded) */}
        {!isCollapsed && (
          <div
            className="sidebar-resizer"
            onMouseDown={handleMouseDown}
            onDoubleClick={handleResetWidth}
            title="Drag to resize sidebar • Double-click to reset"
            role="separator"
            aria-orientation="vertical"
          />
        )}
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
