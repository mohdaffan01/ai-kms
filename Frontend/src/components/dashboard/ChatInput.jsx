import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Plus, X, BookOpen, Check, Globe } from 'lucide-react';
import {
  supportsVoiceInput,
  getVoiceRecognitionCtor,
  extractVoiceTranscript,
} from '../../utils/voice';
import { getDashboardDataApi } from '../../api/progressApi';
import { getMyDocumentsApi } from '../../api/documentApi';

const ChatInput = ({ onSendMessage, disabled = false, initialSubject = '', isNewChat = false }) => {
  const [input, setInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || '');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef(null);
  const popoverRef = useRef(null);
  const textareaRef = useRef(null);
  const voiceSupported = supportsVoiceInput();

  // Sync initialSubject when prop updates
  useEffect(() => {
    if (initialSubject !== undefined) {
      setSelectedSubject(initialSubject || '');
    }
  }, [initialSubject]);

  // Fetch subjects from progress dashboard API and fallback to documents
  const loadSubjects = async (showLoading = true) => {
    if (showLoading) {
      setIsLoadingSubjects(true);
    }
    try {
      let subjectList = [];

      try {
        const data = await getDashboardDataApi();
        if (data && data.success && Array.isArray(data.subjects) && data.subjects.length > 0) {
          subjectList = data.subjects;
        }
      } catch (err) {
        console.warn('[ChatInput] Could not load subjects from progress:', err.message);
      }

      if (subjectList.length === 0) {
        try {
          const docData = await getMyDocumentsApi();
          if (docData && docData.success && Array.isArray(docData.documents)) {
            const unique = [...new Set(docData.documents.map((d) => d.subject).filter(Boolean))];
            subjectList = unique.map((s) => ({ id: s, name: s }));
          }
        } catch (err) {
          console.warn('[ChatInput] Could not load subjects from documents:', err.message);
        }
      }

      setSubjects(subjectList);
    } catch (err) {
      console.warn('[ChatInput] Error loading subjects:', err.message);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  useEffect(() => {
    loadSubjects(true);

    const handleRefresh = () => loadSubjects(false);
    window.addEventListener('aikms:refresh-dashboard', handleRefresh);
    window.addEventListener('aikms:document-uploaded', handleRefresh);
    window.addEventListener('aikms:document-deleted', handleRefresh);

    return () => {
      window.removeEventListener('aikms:refresh-dashboard', handleRefresh);
      window.removeEventListener('aikms:document-uploaded', handleRefresh);
      window.removeEventListener('aikms:document-deleted', handleRefresh);
    };
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsPopoverOpen(false);
      }
    };

    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

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

  const handleSelectSubject = (subjectName) => {
    setSelectedSubject(subjectName);
    setIsPopoverOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleClearSubject = (e) => {
    e.stopPropagation();
    setSelectedSubject('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    onSendMessage(input.trim(), selectedSubject || null);
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

  const placeholderText = selectedSubject
    ? `Ask anything about ${selectedSubject}...`
    : 'Ask anything about your study material...';

  return (
    <div className={`chat-input-wrapper ${isNewChat ? 'new-chat-mode' : ''}`}>
      <form onSubmit={handleSubmit} className="chat-input-form" ref={popoverRef}>
        {/* Subject Selection Popover */}
        {isPopoverOpen && (
          <div className="chat-subject-popover" role="dialog" aria-label="Select Subject Filter">
            <div className="subject-popover-header">
              <span className="subject-popover-title">Scope by Subject</span>
              <span className="subject-popover-subtitle">Filter answers to specific study material</span>
            </div>

            <div className="subject-popover-list">
              <button
                type="button"
                className={`subject-popover-item ${!selectedSubject ? 'active' : ''}`}
                onClick={() => handleSelectSubject('')}
              >
                <div className="subject-popover-item-left">
                  <Globe size={15} className="popover-item-icon" />
                  <span>All Subjects (Entire Workspace)</span>
                </div>
                {!selectedSubject && <Check size={14} className="popover-check-icon" />}
              </button>

              <div className="subject-popover-divider" />

              {isLoadingSubjects && subjects.length === 0 ? (
                <div className="subject-popover-empty">Loading subjects...</div>
              ) : subjects.length > 0 ? (
                subjects.map((sub) => {
                  const subName = typeof sub === 'string' ? sub : (sub.name || sub.title || '');
                  if (!subName) return null;
                  const isSelected = selectedSubject && subName
                    ? selectedSubject.trim().toLowerCase() === subName.trim().toLowerCase()
                    : false;
                  return (
                    <button
                      key={sub.id || sub._id || subName}
                      type="button"
                      className={`subject-popover-item ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectSubject(subName)}
                    >
                      <div className="subject-popover-item-left">
                        <span
                          className="subject-color-dot"
                          style={{ backgroundColor: sub.color || '#10b981' }}
                        />
                        <span className="subject-item-name">{subName}</span>
                      </div>
                      {isSelected && <Check size={14} className="popover-check-icon" />}
                    </button>
                  );
                })
              ) : (
                <div className="subject-popover-empty">
                  No subjects found. Upload materials or add subjects in Dashboard.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Left Section: Plus Button and Active Subject Badge */}
        <div className="chat-input-prefix">
          <button
            type="button"
            className={`btn-chat-scope-add ${isPopoverOpen ? 'active' : ''} ${selectedSubject ? 'has-subject' : ''}`}
            onClick={() => {
              setIsPopoverOpen((prev) => {
                const nextState = !prev;
                if (nextState) {
                  loadSubjects(subjects.length === 0);
                }
                return nextState;
              });
            }}
            title={selectedSubject ? `Change subject scope (Current: ${selectedSubject})` : "Select subject to scope your questions"}
            aria-label="Filter by subject"
          >
            <Plus size={18} />
          </button>

          {selectedSubject && (
            <div className="chat-scoped-subject-badge" title={`Chat scoped to: ${selectedSubject}`}>
              <BookOpen size={13} className="subject-badge-icon" />
              <span className="subject-badge-name">{selectedSubject}</span>
              <button
                type="button"
                className="btn-clear-scoped-subject"
                onClick={handleClearSubject}
                title="Remove subject filter"
                aria-label="Remove subject filter"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Textarea Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={placeholderText}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="chat-textarea"
          disabled={disabled}
        />

        {/* Actions (Voice + Send) */}
        <div className="chat-input-actions">
          {voiceSupported && (
            <button
              type="button"
              className={`btn-voice-toggle ${isListening ? 'active' : ''}`}
              onClick={toggleVoiceInput}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              disabled={disabled}
            >
              {isListening ? <MicOff size={19} /> : <Mic size={19} />}
            </button>
          )}

          <button
            type="submit"
            disabled={!input.trim() || disabled}
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
