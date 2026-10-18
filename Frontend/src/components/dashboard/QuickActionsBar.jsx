import React from 'react';
import { PlusCircle, UploadCloud, Bot, RotateCcw, Sparkles } from 'lucide-react';

const QuickActionsBar = ({
  onCreateSubject,
  onUploadMaterial,
  onOpenChat,
  onResetDefaults,
}) => {
  return (
    <div className="quick-actions-card">
      <div className="quick-actions-header">
        <div className="quick-actions-title-group">
          <Sparkles size={18} className="quick-actions-icon" />
          <h3>Quick Actions</h3>
        </div>
        <span className="quick-actions-hint">One-click study accelerators</span>
      </div>

      <div className="quick-actions-grid">
        {/* 1. Create Subject */}
        <button
          type="button"
          className="quick-action-btn btn-action-subject"
          onClick={onCreateSubject}
        >
          <div className="action-btn-icon-box">
            <PlusCircle size={22} />
          </div>
          <div className="action-btn-texts">
            <span className="action-btn-title">Create New Subject</span>
            <span className="action-btn-desc">Add custom subject with syllabus topics</span>
          </div>
        </button>

        {/* 2. Upload Study Material */}
        <button
          type="button"
          className="quick-action-btn btn-action-upload"
          onClick={onUploadMaterial}
        >
          <div className="action-btn-icon-box">
            <UploadCloud size={22} />
          </div>
          <div className="action-btn-texts">
            <span className="action-btn-title">Upload Study Material</span>
            <span className="action-btn-desc">Upload PDFs & docs for vector indexing</span>
          </div>
        </button>

        {/* 3. Open AI Knowledge Assistant */}
        <button
          type="button"
          className="quick-action-btn btn-action-ai"
          onClick={onOpenChat}
        >
          <div className="action-btn-icon-box">
            <Bot size={22} />
          </div>
          <div className="action-btn-texts">
            <span className="action-btn-title">AI Knowledge Assistant</span>
            <span className="action-btn-desc">Ask doubts grounded in your documents</span>
          </div>
        </button>
      </div>

      {onResetDefaults && (
        <div className="quick-actions-reset-row">
          <button
            type="button"
            className="btn-reset-curriculum"
            onClick={onResetDefaults}
            title="Restore standard Computer Science curriculum (DBMS, OS, CN, DS, SE)"
          >
            <RotateCcw size={13} />
            <span>Restore Standard CS Curriculum</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickActionsBar;
