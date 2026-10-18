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
  ChevronDown,
  ChevronRight,
  FolderOpen
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
  const [selectedParentId, setSelectedParentId] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [collapsedParents, setCollapsedParents] = useState({});

  if (!isOpen || !subject) return null;

  const topics = subject.topics || [];

  // Calculate total study items (subtopics or standalone topics)
  let totalTopics = 0;
  let completedTopics = 0;
  topics.forEach((t) => {
    if (t.subtopics && t.subtopics.length > 0) {
      totalTopics += t.subtopics.length;
      completedTopics += t.subtopics.filter((st) => st.completed).length;
    } else {
      totalTopics += 1;
      if (t.completed) completedTopics += 1;
    }
  });

  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Filter documents matching this subject
  const subjectDocs = documents.filter((doc) => {
    if (!doc.subject) return false;
    return (
      doc.subject.trim().toLowerCase() === subject.name.trim().toLowerCase() ||
      subject.name.trim().toLowerCase().includes(doc.subject.trim().toLowerCase())
    );
  });

  // Filter topics and nested subtopics according to search query
  const filteredTopics = topics
    .map((t) => {
      if (!searchQuery.trim()) return t;
      const q = searchQuery.trim().toLowerCase();
      const parentMatches = t.name.toLowerCase().includes(q);
      const matchingSubs = (t.subtopics || []).filter((st) =>
        st.name.toLowerCase().includes(q)
      );

      if (parentMatches) {
        return t;
      } else if (matchingSubs.length > 0) {
        return {
          ...t,
          subtopics: matchingSubs,
        };
      }
      return null;
    })
    .filter(Boolean);

  const toggleParentCollapse = (id) => {
    setCollapsedParents((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    if (onAddTopic) {
      onAddTopic(subject.id, newTopicName.trim(), selectedParentId || undefined);
      setNewTopicName('');
      setSelectedParentId('');
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
              placeholder="Search chapters & subtopics..."
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
              {completedTopics} of {totalTopics} subtopics studied
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
                  <span>{completedTopics} of {totalTopics} subtopics studied</span>
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
                      {subjectDocs.length > 0
                        ? `Extracted from ${subjectDocs.length} uploaded ${subjectDocs.length === 1 ? 'document' : 'documents'}. Check off topics and subtopics as you study.`
                        : 'Check off topics you have studied. Your progress percentage updates automatically.'}
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
                  <form onSubmit={handleAddTopic} className="modal-add-topic-form hierarchical-form">
                    <div className="hierarchical-form-inputs">
                      <input
                        type="text"
                        placeholder="e.g. Relational Calculus, B-Trees..."
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        autoFocus
                        required
                      />
                      {topics.length > 0 && (
                        <select
                          value={selectedParentId}
                          onChange={(e) => setSelectedParentId(e.target.value)}
                          className="parent-topic-select"
                        >
                          <option value="">Add as Top-level Parent Topic / Chapter</option>
                          {topics.map((t, idx) => (
                            <option key={t.id} value={t.id}>
                              Under: {idx + 1}. {t.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="form-action-btns">
                      <button type="submit" className="btn-save-topic">Add</button>
                      <button
                        type="button"
                        className="btn-cancel-topic"
                        onClick={() => {
                          setIsAddingTopic(false);
                          setNewTopicName('');
                          setSelectedParentId('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Topic Checklist */}
                <div className="topics-index-list">
                  {topics.length === 0 ? (
                    <div className="empty-topics-card">
                      <div className="empty-topics-icon">
                        <FileText size={36} />
                      </div>
                      <h4>No Topics Generated Yet</h4>
                      <p>
                        Upload your study materials (PDF, TXT, or MD files) for {subject.name} to automatically extract and generate its study topics index, or add custom topics manually.
                      </p>
                      <div className="empty-actions-row">
                        <button
                          type="button"
                          className="btn-empty-upload"
                          onClick={() => {
                            if (onUploadDocument) onUploadDocument();
                          }}
                        >
                          <UploadCloud size={15} />
                          <span>Upload {subject.name} Material</span>
                        </button>
                        <button
                          type="button"
                          className="btn-empty-add-topic"
                          onClick={() => setIsAddingTopic(true)}
                        >
                          <Plus size={15} />
                          <span>Add Topic Manually</span>
                        </button>
                      </div>
                    </div>
                  ) : filteredTopics.length === 0 ? (
                    <div className="empty-topics-search">
                      <p>No topics matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    filteredTopics.map((topic, index) => {
                      const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
                      const isCollapsed = Boolean(collapsedParents[topic.id]);
                      const subCount = hasSubtopics ? topic.subtopics.length : 0;
                      const subDone = hasSubtopics
                        ? topic.subtopics.filter((st) => st.completed).length
                        : 0;
                      const isParentDone = hasSubtopics
                        ? subCount > 0 && subDone === subCount
                        : topic.completed;

                      return (
                        <div key={topic.id} className="hierarchical-topic-group">
                          {/* Parent Chapter / Topic Row */}
                          <div
                            className={`parent-topic-row ${isParentDone ? 'completed' : ''}`}
                            onClick={() => {
                              if (hasSubtopics) {
                                toggleParentCollapse(topic.id);
                              }
                            }}
                          >
                            <div className="parent-row-left">
                              {hasSubtopics ? (
                                <button
                                  type="button"
                                  className="btn-parent-expand"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleParentCollapse(topic.id);
                                  }}
                                  title={isCollapsed ? 'Expand child subtopics' : 'Collapse child subtopics'}
                                >
                                  {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                                </button>
                              ) : (
                                <span className="expand-spacer" />
                              )}

                              <button
                                type="button"
                                className={`index-checkbox parent-checkbox ${isParentDone ? 'checked' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onToggleTopic) {
                                    onToggleTopic(subject.id, topic.id, !isParentDone);
                                  }
                                }}
                                aria-label={`Toggle all of ${topic.name}`}
                              >
                                {isParentDone && <Check size={14} strokeWidth={3} />}
                              </button>

                              <span className="topic-index-number">{index + 1}.</span>
                              <span className="parent-topic-title">{topic.name}</span>
                            </div>

                            <div className="parent-row-right">
                              {hasSubtopics ? (
                                <span
                                  className={`subtopics-counter-badge ${
                                    isParentDone ? 'badge-all-done' : ''
                                  }`}
                                >
                                  {isParentDone ? (
                                    <>
                                      <CheckCircle2 size={12} />
                                      All {subCount} Studied
                                    </>
                                  ) : (
                                    `${subDone} of ${subCount} subtopics`
                                  )}
                                </span>
                              ) : isParentDone ? (
                                <span className="status-badge-done">
                                  <CheckCircle2 size={12} />
                                  Studied
                                </span>
                              ) : (
                                <span className="status-badge-pending">To Study</span>
                              )}
                            </div>
                          </div>

                          {/* Nested Child Subtopics */}
                          {hasSubtopics && !isCollapsed && (
                            <div className="child-subtopics-container">
                              {topic.subtopics.map((subtopic, sIdx) => (
                                <div
                                  key={subtopic.id}
                                  className={`child-subtopic-row ${
                                    subtopic.completed ? 'completed' : ''
                                  }`}
                                  onClick={() => {
                                    if (onToggleTopic) {
                                      onToggleTopic(
                                        subject.id,
                                        topic.id,
                                        subtopic.id,
                                        !subtopic.completed
                                      );
                                    }
                                  }}
                                >
                                  <div className="child-row-left">
                                    <span className="child-branch-line" />
                                    <button
                                      type="button"
                                      className={`index-checkbox child-checkbox ${
                                        subtopic.completed ? 'checked' : ''
                                      }`}
                                      aria-label={`Toggle ${subtopic.name}`}
                                    >
                                      {subtopic.completed && <Check size={12} strokeWidth={3} />}
                                    </button>
                                    <span className="child-index-number">
                                      {index + 1}.{sIdx + 1}
                                    </span>
                                    <span className="child-topic-title">{subtopic.name}</span>
                                  </div>

                                  <div className="child-row-right">
                                    {subtopic.completed ? (
                                      <span className="status-badge-done">
                                        <CheckCircle2 size={11} />
                                        Studied
                                      </span>
                                    ) : (
                                      <span className="status-badge-pending">To Study</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
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
