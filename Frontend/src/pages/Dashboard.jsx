import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronDown, Globe, FileText, Check, RotateCcw } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import ChatWindow from '../components/dashboard/ChatWindow';
import ChatInput from '../components/dashboard/ChatInput';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import DocumentViewerModal from '../components/dashboard/DocumentViewerModal';
import FlashcardsView from '../components/dashboard/FlashcardsView';
import QuizView from '../components/dashboard/QuizView';
import NotesView from '../components/dashboard/NotesView';
import { queryKnowledgeChatApi } from '../api/knowledgeApi';
import { getMyDocumentsApi } from '../api/documentApi';
import '../styles/dashboard-view.css';

const Dashboard = ({ defaultTab = 'dashboard' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Resolve current active view directly from path
  const getTabFromPath = (pathname) => {
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    if (pathname.startsWith('/chat')) return 'chat';
    if (pathname.startsWith('/quiz')) return 'quiz';
    if (pathname.startsWith('/flashcards')) return 'flashcards';
    if (pathname.startsWith('/notes')) return 'notes';
    return defaultTab;
  };

  const activeTab = getTabFromPath(location.pathname);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('aikms_active_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [chatDocuments, setChatDocuments] = useState([]);
  const [selectedChatDocId, setSelectedChatDocId] = useState('all');
  const [isScopeDropdownOpen, setIsScopeDropdownOpen] = useState(false);
  const scopeDropdownRef = useRef(null);

  // Close scope dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (scopeDropdownRef.current && !scopeDropdownRef.current.contains(event.target)) {
        setIsScopeDropdownOpen(false);
      }
    };
    if (isScopeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isScopeDropdownOpen]);

  useEffect(() => {
    // Protected check: Redirect to /login if unauthenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch documents for chat selector & stay synchronized with upload/delete events
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await getMyDocumentsApi();
        if (res && res.documents) {
          setChatDocuments(res.documents);
        }
      } catch (err) {
        console.warn('Could not fetch documents for chat scope:', err.message);
      }
    };

    fetchDocs();

    const handleDocUpdate = () => fetchDocs();
    window.addEventListener('aikms:document-uploaded', handleDocUpdate);
    window.addEventListener('aikms:document-deleted', handleDocUpdate);

    return () => {
      window.removeEventListener('aikms:document-uploaded', handleDocUpdate);
      window.removeEventListener('aikms:document-deleted', handleDocUpdate);
    };
  }, []);

  // Backward compatibility: If a legacy ?tab= URL is requested, redirect to clean path route
  useEffect(() => {
    const legacyTab = searchParams.get('tab');
    if (legacyTab && ['chat', 'flashcards', 'quiz', 'dashboard', 'notes'].includes(legacyTab)) {
      const remaining = {};
      searchParams.forEach((v, k) => {
        if (k !== 'tab') remaining[k] = v;
      });
      const q = Object.keys(remaining).length > 0 ? '?' + new URLSearchParams(remaining).toString() : '';
      navigate(`/${legacyTab}${q}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSelectTab = (tab, extraParams = {}) => {
    const query = Object.keys(extraParams).length > 0 ? '?' + new URLSearchParams(extraParams).toString() : '';
    navigate(`/${tab}${query}`);
  };

  const handleSendMessage = async (userText) => {
    if (!userText || !userText.trim() || isLoading) return;

    // 1. Append User Message
    const userMessage = { sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 2. Query RAG Chat API with auto-detection across all documents or selected document
      const data = await queryKnowledgeChatApi(userText, selectedChatDocId);

      const aiText = data.answer || "I couldn't process an answer for that query.";
      const aiMessage = {
        sender: 'ai',
        text: aiText,
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('RAG Query Error:', error);
      const errorMessage = {
        sender: 'ai',
        text: 'Sorry, I encountered an error while searching your documents. Please check your backend connection.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Persist messages in session so navigating between tabs does not lose conversation
  useEffect(() => {
    try {
      sessionStorage.setItem('aikms_active_chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not save chat messages to session:', e);
    }
  }, [messages]);

  const handleNewChat = () => {
    setMessages([]);
    try {
      sessionStorage.removeItem('aikms_active_chat_messages');
    } catch {}
    navigate('/chat');
  };

  const handleOpenDocumentViewer = (doc) => {
    setViewerDoc(doc);
    setIsViewerOpen(true);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        onNewChat={handleNewChat} 
        activeTab={activeTab} 
        onSelectTab={handleSelectTab} 
      />
      <main className="chat-main-area">
        {activeTab === 'dashboard' ? (
          <DashboardOverview 
            onSelectTab={handleSelectTab} 
            onOpenDocumentViewer={handleOpenDocumentViewer}
          />
        ) : activeTab === 'flashcards' ? (
          <FlashcardsView initialSubject={searchParams.get('subject') || ''} />
        ) : activeTab === 'quiz' ? (
          <QuizView initialSubject={searchParams.get('subject') || ''} />
        ) : activeTab === 'notes' ? (
          <NotesView 
            onSelectTab={handleSelectTab} 
            onOpenDocumentViewer={handleOpenDocumentViewer} 
          />
        ) : (
          <>
            {chatDocuments.length > 0 && (() => {
              const selectedDoc = chatDocuments.find((d) => d._id === selectedChatDocId);
              return (
                <div className="chat-scope-bar">
                  <span className="scope-label">Search Context:</span>

                  <div className="chat-scope-dropdown-wrapper" ref={scopeDropdownRef}>
                    <button
                      type="button"
                      className={`chat-scope-trigger ${isScopeDropdownOpen ? 'open' : ''}`}
                      onClick={() => setIsScopeDropdownOpen((prev) => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={isScopeDropdownOpen}
                    >
                      <span className="scope-trigger-content">
                        {selectedChatDocId === 'all' ? (
                          <>
                            <Globe size={14} className="scope-option-icon globe" />
                            <span className="scope-trigger-text">
                              All Documents ({chatDocuments.length} files - Auto Search)
                            </span>
                          </>
                        ) : (
                          <>
                            <FileText size={14} className="scope-option-icon file" />
                            <span className="scope-trigger-text">
                              {selectedDoc?.title || 'Selected Document'}
                            </span>
                            {selectedDoc?.subject && (
                              <span className="scope-subject-tag">{selectedDoc.subject}</span>
                            )}
                          </>
                        )}
                      </span>
                      <ChevronDown size={14} className={`scope-chevron ${isScopeDropdownOpen ? 'rotated' : ''}`} />
                    </button>

                    {isScopeDropdownOpen && (
                      <div className="chat-scope-menu" role="listbox">
                        <div
                          className={`chat-scope-item ${selectedChatDocId === 'all' ? 'selected' : ''}`}
                          role="option"
                          aria-selected={selectedChatDocId === 'all'}
                          onClick={() => {
                            setSelectedChatDocId('all');
                            setIsScopeDropdownOpen(false);
                          }}
                        >
                          <div className="scope-item-left">
                            <Globe size={14} className="scope-option-icon globe" />
                            <div className="scope-item-info">
                              <span className="scope-item-title">All Documents</span>
                              <span className="scope-item-meta">{chatDocuments.length} files &bull; Auto Search</span>
                            </div>
                          </div>
                          {selectedChatDocId === 'all' && <Check size={14} className="scope-check-icon" />}
                        </div>

                        <div className="chat-scope-divider" />

                        <div className="chat-scope-scroll-area">
                          {chatDocuments.map((doc) => {
                            const isSelected = selectedChatDocId === doc._id;
                            return (
                              <div
                                key={doc._id}
                                className={`chat-scope-item ${isSelected ? 'selected' : ''}`}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setSelectedChatDocId(doc._id);
                                  setIsScopeDropdownOpen(false);
                                }}
                              >
                                <div className="scope-item-left">
                                  <FileText size={14} className="scope-option-icon file" />
                                  <div className="scope-item-info">
                                    <span className="scope-item-title">{doc.title}</span>
                                    {doc.subject && (
                                      <span className="scope-item-subject">{doc.subject}</span>
                                    )}
                                  </div>
                                </div>
                                {isSelected && <Check size={14} className="scope-check-icon" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedChatDocId !== 'all' && (
                    <button
                      type="button"
                      className="btn-reset-scope"
                      onClick={() => setSelectedChatDocId('all')}
                      title="Switch back to searching across all documents"
                    >
                      <RotateCcw size={12} />
                      <span>Reset to All</span>
                    </button>
                  )}
                </div>
              );
            })()}
            <ChatWindow messages={messages} isLoading={isLoading} />
            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
          </>
        )}
      </main>

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
        }}
      />
    </div>
  );
};

export default Dashboard;

