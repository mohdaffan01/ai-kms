import React, { useRef, useEffect, useState } from 'react';
import { User, FileText, Loader2, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { speakText, stopSpeaking } from '../../utils/voice';

const ChatWindow = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    // Cleanup speech synthesis on component unmount
    return () => {
      stopSpeaking(window);
    };
  }, []);

  const handleToggleVoice = (index, text) => {
    if (speakingIndex === index) {
      stopSpeaking(window);
      setSpeakingIndex(null);
    } else {
      stopSpeaking(window);
      const started = speakText(window, text, () => setSpeakingIndex(null));
      if (started) {
        setSpeakingIndex(index);
      }
    }
  };

  return (
    <div className="chat-window-container">
      {messages.length === 0 ? (
        /* Empty State / Welcome Screen */
        <div className="chat-welcome-state">
          <div className="welcome-icon">
            <img
              src="/logo.png"
              alt="AiKMS Logo"
              style={{ width: '46px', height: '46px', objectFit: 'contain' }}
            />
          </div>
          <h1>Welcome to AiKMS</h1>
          <p>Ask anything from your uploaded PDF learning materials.</p>
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
                  <img
                    src="/logo-white-128.png"
                    alt="AI"
                    style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                  />
                )}
              </div>

              <div className="message-bubble">
                <div className="message-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <div className="message-sender-name">
                    {msg.sender === 'user' ? 'You' : 'AiKMS Assistant'}
                  </div>

                  {msg.sender === 'ai' && (
                    <button
                      type="button"
                      className={`btn-message-voice ${speakingIndex === index ? 'active' : ''}`}
                      onClick={() => handleToggleVoice(index, msg.text)}
                      title={speakingIndex === index ? 'Stop reading' : 'Listen to response'}
                    >
                      {speakingIndex === index ? (
                        <>
                          <VolumeX size={14} />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={14} />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className={`message-text ${msg.sender === 'ai' ? 'markdown-content' : ''}`} style={msg.sender === 'user' ? { whiteSpace: 'pre-wrap' } : {}}>
                  {msg.sender === 'ai' ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="message-sources" style={{ marginTop: '8px', fontSize: '0.8rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={14} />
                    <span>Source: {msg.sources.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-row row-ai">
              <div className="message-avatar">
                <img
                  src="/logo-white-128.png"
                  alt="AI"
                  style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                />
              </div>
              <div className="message-bubble">
                <div className="message-sender-name">AiKMS Assistant</div>
                <div className="message-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={16} className="animate-spin" color="var(--accent-green, #10a37f)" />
                  <span>Searching PDF & generating response...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
