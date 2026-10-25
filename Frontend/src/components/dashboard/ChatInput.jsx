import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import {
  supportsVoiceInput,
  getVoiceRecognitionCtor,
  extractVoiceTranscript,
} from '../../utils/voice';

const ChatInput = ({ onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef(null);
  const voiceSupported = supportsVoiceInput();

  useEffect(() => {
    const RecognitionCtor = getVoiceRecognitionCtor();
    if (!RecognitionCtor) return undefined;

    const recognition = new RecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = extractVoiceTranscript(event);

      if (transcript) {
        setInput(transcript);
      }
    };

    recognition.onerror = () => {
      setVoiceError('Voice input is unavailable right now.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    onSendMessage(input.trim());
    setInput('');
    setVoiceError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleVoiceInput = () => {
    if (!voiceSupported || !recognitionRef.current) {
      setVoiceError('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    setVoiceError('');
    recognitionRef.current.start();
    setIsListening(true);
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

        <div className="chat-input-actions">
          {voiceSupported && (
            <button
              type="button"
              className={`btn-voice-toggle ${isListening ? 'active' : ''}`}
              onClick={toggleVoiceInput}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {isListening ? <MicOff size={19} /> : <Mic size={19} />}
            </button>
          )}

          <button
            type="submit"
            disabled={!input.trim()}
            className="btn-send-message"
            aria-label="Send message"
          >
            <Send size={19} />
          </button>
        </div>
      </form>

      {voiceError && <div className="voice-status-error">{voiceError}</div>}
      
    </div>
  );
};

export default ChatInput;
