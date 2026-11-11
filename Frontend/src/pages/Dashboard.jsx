import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import ChatWindow from '../components/dashboard/ChatWindow';
import ChatInput from '../components/dashboard/ChatInput';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import DocumentViewerModal from '../components/dashboard/DocumentViewerModal';
import FlashcardsView from '../components/dashboard/FlashcardsView';
import QuizView from '../components/dashboard/QuizView';
import NotesView from '../components/dashboard/NotesView';
import { queryKnowledgeChatApi } from '../api/knowledgeApi';
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
  useEffect(() => {
    // Protected check: Redirect to /login if unauthenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [navigate]);

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

  const handleSendMessage = async (userText, subject = null) => {
    if (!userText || !userText.trim() || isLoading) return;

    // 1. Append User Message
    const userMessage = { sender: 'user', text: userText, subject: subject || undefined };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 2. Query RAG Chat API with auto-detection across all documents or scoped subject
      const data = await queryKnowledgeChatApi(userText, 'all', subject);

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
      <main className={`chat-main-area ${activeTab === 'chat' && messages.length === 0 ? 'new-chat-centered-layout' : ''}`}>
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
            <ChatWindow messages={messages} isLoading={isLoading} />
            <ChatInput 
              onSendMessage={handleSendMessage} 
              disabled={isLoading}
              initialSubject={searchParams.get('subject') || ''} 
              isNewChat={messages.length === 0}
            />
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

