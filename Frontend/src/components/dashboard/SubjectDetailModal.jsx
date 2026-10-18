import React, { useState } from 'react';
import {
  X,
  Check,
  Plus,
  Search,
  FileText,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  BookOpen,
  ListChecks,
  Trash2,
  ExternalLink,
  Layers
} from 'lucide-react';

const SubjectDetailModal = ({
  subject,
  documents = [],
  isOpen,
  onClose,
  onToggleTopic,
  onAddTopic,
  onDeleteSubject,
  onStudyWithAI,
  onUploadDocument,
  onOpenDocumentViewer,
}) => {
  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'materials'
  const [searchQuery, setSearchQuery] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  if (!isOpen || !subject) return null;

  const topics = subject.topics || [];
  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.completed).length;
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Filter documents matching this subject
  const subjectDocs = documents.filter((doc) => {
    if (!doc.subject) return false;
    return (
      doc.subject.trim().toLowerCase() === subject.name.trim().toLowerCase() ||
      subject.name.trim().toLowerCase().includes(doc.subject.trim().toLowerCase())
    );
  });

  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    if (onAddTopic) {
      onAddTopic(subject.id, newTopicName.trim());
      setNewTopicName('');
      setIsAddingTopic(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="subject-modal-backdrop" onClick={onClose}>
      <div className="subject-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Left Navigation Sidebar */}
        <div className="subject-modal-sidebar">
          <div className="sidebar-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sidebar-section-title">SUBJECT DETAILS</div>

          <nav className="sidebar-nav-list">
            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'topics' ? 'active' : ''}`}
              onClick={() => setActiveTab('topics')}
            >
              <ListChecks size={16} />
              <span>Topics Index</span>
              <span className="nav-item-badge">{completedTopics}/{totalTopics}</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'materials' ? 'active' : ''}`}
              onClick={() => setActiveTab('materials')}
            >
              <FileText size={16} />
              <span>Uploaded PDFs & Notes</span>
              <span className="nav-item-badge">{subjectDocs.length}</span>
            </button>
          </nav>

          {/* Quick Subject Progress Summary in Sidebar */}
          <div className="sidebar-progress-box">
            <div className="box-header">
              <span className="box-title">Subject Progress</span>
              <span className="box-percent">{progressPercent}%</span>
            </div>
            <div className="box-progress-track">
              <div
                className="box-progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: subject.color || '#10a37f',
                }}
              />
            </div>
            <span className="box-subtext">
              {completedTopics} of {totalTopics} topics studied
            </span>
          </div>

          {/* Ask AI Tutor CTA in sidebar */}
          <button
            type="button"
            className="sidebar-ai-cta"
            onClick={() => {
              if (onStudyWithAI) onStudyWithAI(subject.name);
              onClose();
            }}
          >
            <Sparkles size={14} />
            <span>Study {subject.name} with AI</span>
          </button>
        </div>

        {/* Right Main Content Panel */}
        <div className="subject-modal-main">
          {/* Top Bar with Subject Title and Close Button */}
          <div className="modal-main-topbar">
            <div className="main-subject-title-row">
              <div
                className="main-subject-icon-box"
                style={{
                  backgroundColor: `${subject.color || '#10a37f'}25`,
                  color: subject.color || '#10a37f',
                }}
              >
                <BookOpen size={20} />
              </div>
              <div className="main-title-meta">
                <h2>{subject.name}</h2>
                <div className="subject-stat-line">
                  <span className="stat-highlight" style={{ color: subject.color || '#10a37f' }}>
                    {progressPercent}% Completed
                  </span>
                  <span className="stat-dot">•</span>
                  <span>{completedTopics} of {totalTopics} topics studied</span>
                  <span className="stat-dot">•</span>
                  <span>{subjectDocs.length} {subjectDocs.length === 1 ? 'PDF linked' : 'PDFs linked'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-modal-close-icon"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress Bar Header */}
          <div className="main-progress-bar-track">
            <div
              className="main-progress-bar-fill"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: subject.color || '#10a37f',
              }}
            />
          </div>

          {/* Content Area Based on Tab */}
          <div className="modal-main-scroll-content">
            {activeTab === 'topics' ? (
              <div className="tab-topics-content">
                <div className="content-intro-row">
                  <div>
                    <h3 className="tab-heading">Topic Index & Study Progress</h3>
                    <p className="tab-subheading">
                      Check off topics you have studied. Your progress percentage updates automatically.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn-add-topic-inline"
                    onClick={() => setIsAddingTopic(true)}
                  >
                    <Plus size={14} />
                    <span>Add Topic</span>
                  </button>
                </div>

                {/* Add Topic Inline Form */}
                {isAddingTopic && (
                  <form onSubmit={handleAddTopic} className="modal-add-topic-form">
                    <input
                      type="text"
                      placeholder="e.g. Relational Calculus, B-Trees..."
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      autoFocus
                      required
                    />
                    <div className="form-action-btns">
                      <button type="submit" className="btn-save-topic">Add</button>
                      <button
                        type="button"
                        className="btn-cancel-topic"
                        onClick={() => {
                          setIsAddingTopic(false);
                          setNewTopicName('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Topic Checklist */}
                <div className="topics-index-list">
                  {filteredTopics.length === 0 ? (
                    <div className="empty-topics-search">
                      <p>No topics matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    filteredTopics.map((topic, index) => (
                      <div
                        key={topic.id}
                        className={`topic-index-row ${topic.completed ? 'completed' : ''}`}
                        onClick={() => onToggleTopic && onToggleTopic(subject.id, topic.id, !topic.completed)}
                      >
                        <div className="row-left">
                          <button
                            type="button"
                            className={`index-checkbox ${topic.completed ? 'checked' : ''}`}
                            aria-label={`Toggle ${topic.name}`}
                          >
                            {topic.completed && <Check size={14} strokeWidth={3} />}
                          </button>
                          <span className="topic-index-number">{index + 1}.</span>
                          <span className="topic-index-title">{topic.name}</span>
                        </div>

                        <div className="row-right">
                          {topic.completed ? (
                            <span className="status-badge-done">
                              <CheckCircle2 size={12} />
                              Studied
                            </span>
                          ) : (
                            <span className="status-badge-pending">To Study</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="tab-materials-content">
                <div className="content-intro-row">
                  <div>
                    <h3 className="tab-heading">Uploaded Study Materials</h3>
                    <p className="tab-subheading">
                      PDFs, notes, and syllabus files associated with {subject.name}.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn-add-topic-inline"
                    onClick={() => {
                      if (onUploadDocument) onUploadDocument();
                    }}
                  >
                    <UploadCloud size={14} />
                    <span>Upload Material</span>
                  </button>
                </div>

                {subjectDocs.length === 0 ? (
                  <div className="empty-materials-card">
                    <FileText size={40} className="empty-file-icon" />
                    <h4>No Study Materials Uploaded for {subject.name}</h4>
                    <p>
                      Upload lecture slides or reference PDFs to index concepts and study with AI.
                    </p>
                    <button
                      type="button"
                      className="btn-upload-subject-doc"
                      onClick={() => {
                        if (onUploadDocument) onUploadDocument();
                      }}
                    >
                      <UploadCloud size={16} />
                      <span>Upload PDF for {subject.name}</span>
                    </button>
                  </div>
                ) : (
                  <div className="subject-docs-grid">
                    {subjectDocs.map((doc) => (
                      <div
                        key={doc.id || doc._id}
                        className="subject-doc-item"
                        onClick={() => {
                          if (onOpenDocumentViewer) onOpenDocumentViewer(doc);
                        }}
                      >
                        <div className="doc-icon-wrapper">
                          <FileText size={20} />
                        </div>
                        <div className="doc-item-details">
                          <span className="doc-item-title">{doc.title}</span>
                          <div className="doc-item-meta">
                            <span>{formatFileSize(doc.fileSize)}</span>
                            {doc.topic && <span>• Topic: {doc.topic}</span>}
                          </div>
                        </div>
                        <span className={`doc-status-tag status-${doc.processingStatus || 'uploaded'}`}>
                          {doc.processingStatus === 'processed' ? 'Indexed' : doc.processingStatus || 'Ready'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetailModal;
