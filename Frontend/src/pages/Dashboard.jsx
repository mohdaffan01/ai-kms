import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import ChatWindow from '../components/dashboard/ChatWindow';
import ChatInput from '../components/dashboard/ChatInput';

const Dashboard = () => {
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Protected check: Redirect to /login if unauthenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSendMessage = (userText) => {
    // Append User Message
    const userMessage = { sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMessage]);

    // Append Dummy AI Response
    setTimeout(() => {
      const aiMessage = {
        sender: 'ai',
        text: 'This is a demo AI response. RAG-based answers will be added in the next module.',
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 600);
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar onNewChat={handleNewChat} />
      <main className="chat-main-area">
        <ChatWindow messages={messages} />
        <ChatInput onSendMessage={handleSendMessage} />
      </main>
    </div>
  );
};

export default Dashboard;
