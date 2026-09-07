import React, { useState } from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ onSendMessage }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-input-wrapper">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <textarea
          rows={1}
          placeholder="Ask anything about your study material..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="chat-textarea"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="btn-send-message"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>
      <div className="chat-footer-disclaimer">
        AiKMS Demo Workspace • RAG-based AI answer model will be enabled in Module 2
      </div>
    </div>
  );
};

export default ChatInput;
