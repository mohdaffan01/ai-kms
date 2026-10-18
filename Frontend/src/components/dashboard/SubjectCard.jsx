import React from 'react';
import {
  Database,
  Cpu,
  Network,
  Layers,
  Boxes,
  BookOpen,
  FileText,
  Sparkles
} from 'lucide-react';

const getSubjectIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('dbms') || lower.includes('database')) return <Database size={20} />;
  if (lower.includes('operating') || lower.includes('os')) return <Cpu size={20} />;
  if (lower.includes('network') || lower.includes('cn')) return <Network size={20} />;
  if (lower.includes('data structure') || lower.includes('ds') || lower.includes('algorithm')) return <Layers size={20} />;
  if (lower.includes('software') || lower.includes('engineering') || lower.includes('se')) return <Boxes size={20} />;
  return <BookOpen size={20} />;
};

const SubjectCard = ({
  subject,
  onOpenSubject,
  onStudyWithAI,
}) => {
  const topics = subject.topics || [];
  let total = 0;
  let completedCount = 0;
  topics.forEach((top) => {
    if (top.subtopics && top.subtopics.length > 0) {
      total += top.subtopics.length;
      completedCount += top.subtopics.filter((st) => st.completed).length;
    } else {
      total += 1;
      if (top.completed) completedCount += 1;
    }
  });
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const docCount = subject.documentCount || 0;

  return (
    <div
      className="subject-card"
      onClick={() => onOpenSubject && onOpenSubject(subject)}
      title={`Click to open ${subject.name} study index & topic progress`}
    >
      {/* Clickable Card Header */}
      <div className="subject-card-header">
        <div className="subject-card-title-group">
          <div
            className="subject-icon-badge"
            style={{
              backgroundColor: `${subject.color || '#10a37f'}20`,
              color: subject.color || '#10a37f',
            }}
          >
            {getSubjectIcon(subject.name)}
          </div>
          <h3 className="subject-name">{subject.name}</h3>
        </div>

        <div className="subject-card-meta">
          <div className="subject-progress-stats">
            <span className="subject-progress-percent">
              {progressPercent}%
            </span>
            <span className="subject-topics-count">
              {completedCount}/{total} Topics
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="subject-progress-container">
        <div
          className="subject-progress-bar"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: subject.color || '#10a37f',
          }}
        />
      </div>

      {/* Action Bar: Document Count & Study with AI Button */}
      <div className="subject-card-action-bar">
        <span className="subject-docs-count">
          <FileText size={13} />
          <span>{docCount} {docCount === 1 ? 'doc' : 'docs'}</span>
        </span>

        <button
          type="button"
          className="btn-study-ai"
          onClick={(e) => {
            e.stopPropagation();
            if (onStudyWithAI) onStudyWithAI(subject.name);
          }}
          title={`Ask AI Assistant about ${subject.name}`}
        >
          <Sparkles size={13} />
          <span>Study with AI</span>
        </button>
      </div>
    </div>
  );
};

export default SubjectCard;
