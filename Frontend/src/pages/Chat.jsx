import React from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import ChatWindow from '../components/dashboard/ChatWindow';
import ChatInput from '../components/dashboard/ChatInput';

/**
 * Chat Page - Context-Grounded Conversational AI Workspace
 */
const Chat = () => {
  const [searchParams] = useSearchParams();
  const { messages, isLoading, handleSendMessage } = useOutletContext();

  return (
    <>
      <ChatWindow messages={messages} isLoading={isLoading} />
      <ChatInput 
        onSendMessage={handleSendMessage} 
        disabled={isLoading}
        initialSubject={searchParams.get('subject') || ''} 
        isNewChat={messages.length === 0}
      />
    </>
  );
};

export default Chat;
