import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import ChatWindow from '../components/dashboard/ChatWindow';
import ChatInput from '../components/dashboard/ChatInput';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import DocumentViewerModal from '../components/dashboard/DocumentViewerModal';
import { queryKnowledgeChatApi } from '../api/knowledgeApi';
import '../styles/dashboard-view.css';

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'chat' ? 'chat' : 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab); // 'dashboard' | 'chat'
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Protected check: Redirect to /login if unauthenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'chat' ? { tab: 'chat' } : {});
  };

  const handleSendMessage = async (userText) => {
    if (!userText || !userText.trim() || isLoading) return;

    // 1. Append User Message
    const userMessage = { sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 2. Query RAG Chat API grounded in user's PDFs
      const data = await queryKnowledgeChatApi(userText);

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
        text: 'Sorry, I encountered an error while searching your document. Please check your backend connection.',
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
        ) : (
          <>
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

