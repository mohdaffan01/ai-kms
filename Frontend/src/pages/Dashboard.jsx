import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
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
  const navigate = useNavigate();

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
            {chatDocuments.length > 0 && (
              <div className="chat-scope-bar">
                <div className="chat-scope-indicator">
                  <Sparkles size={14} className="scope-icon-sparkle" />
                  <span className="scope-label">Search Context:</span>
                </div>
                <select
                  value={selectedChatDocId}
                  onChange={(e) => setSelectedChatDocId(e.target.value)}
                  className="chat-scope-select"
                  aria-label="Select study material search context"
                >
                  <option value="all">
                    🌐 All Documents ({chatDocuments.length} files - Auto Search)
                  </option>
                  {chatDocuments.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      📄 {doc.title} {doc.subject ? `(${doc.subject})` : ''}
                    </option>
                  ))}
                </select>
                {selectedChatDocId !== 'all' && (
                  <button
                    type="button"
                    className="btn-reset-scope"
                    onClick={() => setSelectedChatDocId('all')}
                    title="Switch back to searching across all documents"
                  >
                    Reset to All
                  </button>
                )}
              </div>
            )}
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

