import React, { useRef, useEffect } from 'react';
import { Brain, User, Sparkles } from 'lucide-react';

const ChatWindow = ({ messages }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-window-container">
      {messages.length === 0 ? (
        /* Empty State / Welcome Screen */
        <div className="chat-welcome-state">
          <div className="welcome-icon">
            <Brain size={44} />
          </div>
          <h1>Welcome to AiKMS</h1>
          <p>Ask anything from your uploaded learning materials.</p>
        </div>
      ) : (
        /* Messages Stream */
        <div className="messages-stream">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message-row ${msg.sender === 'user' ? 'row-user' : 'row-ai'}`}
            >
              <div className="message-avatar">
                {msg.sender === 'user' ? (
                  <User size={18} />
                ) : (
                  <Brain size={18} />
                )}
              </div>

              <div className="message-bubble">
                <div className="message-sender-name">
                  {msg.sender === 'user' ? 'You' : 'AiKMS Assistant'}
                </div>
                <div className="message-text">{msg.text}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
