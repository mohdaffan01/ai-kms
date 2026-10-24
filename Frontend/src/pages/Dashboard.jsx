import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Globe, FileText, Check, RotateCcw } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import ChatWindow from '../components/dashboard/ChatWindow';
import ChatInput from '../components/dashboard/ChatInput';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import DocumentViewerModal from '../components/dashboard/DocumentViewerModal';
import FlashcardsView from '../components/dashboard/FlashcardsView';
import QuizView from '../components/dashboard/QuizView';
import { queryKnowledgeChatApi } from '../api/knowledgeApi';
import { getMyDocumentsApi } from '../api/documentApi';
import '../styles/dashboard-view.css';

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = ['chat', 'flashcards', 'quiz', 'dashboard'].includes(tabParam) ? tabParam : 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab); // 'dashboard' | 'chat' | 'flashcards' | 'quiz'
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [chatDocuments, setChatDocuments] = useState([]);
  const [selectedChatDocId, setSelectedChatDocId] = useState('all');
  const [isScopeDropdownOpen, setIsScopeDropdownOpen] = useState(false);
  const scopeDropdownRef = useRef(null);
  const navigate = useNavigate();

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

  const handleSelectTab = (tab, extraParams = {}) => {
    setActiveTab(tab);
    if (tab === 'dashboard') {
      setSearchParams({});
    } else {
      setSearchParams({ tab, ...extraParams });
    }
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

  const handleNewChat = () => {
    setMessages([]);
    handleSelectTab('chat');
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

