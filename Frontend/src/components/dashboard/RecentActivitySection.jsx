import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  FileText,
  Upload,
  BookOpen,
  FolderPlus,
  Clock,
  Filter
} from 'lucide-react';

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Recently';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const getActivityIcon = (type) => {
  switch (type) {
    case 'topic_completed':
      return <CheckCircle2 size={16} className="act-icon icon-completed" />;
    case 'topic_uncompleted':
      return <Clock size={16} className="act-icon icon-uncompleted" />;
    case 'note_added':
      return <BookOpen size={16} className="act-icon icon-note" />;
    case 'doc_uploaded':
      return <Upload size={16} className="act-icon icon-upload" />;
    case 'subject_created':
      return <FolderPlus size={16} className="act-icon icon-subject" />;
    default:
      return <FileText size={16} className="act-icon icon-default" />;
  }
};

const getActivityBadge = (type) => {
  switch (type) {
    case 'topic_completed':
      return <span className="act-badge badge-completed">Topic Completed</span>;
    case 'topic_uncompleted':
      return <span className="act-badge badge-pending">Topic Incomplete</span>;
    case 'note_added':
      return <span className="act-badge badge-note">Note Added</span>;
    case 'doc_uploaded':
      return <span className="act-badge badge-upload">Document Uploaded</span>;
    case 'subject_created':
      return <span className="act-badge badge-subject">Subject Created</span>;
    default:
      return <span className="act-badge badge-default">Activity</span>;
  }
};

const RecentActivitySection = ({ recentActivity = [], recentDocuments = [] }) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'topics' | 'notes' | 'documents'

  const filteredActivity = recentActivity.filter((act) => {
    if (filter === 'all') return true;
    if (filter === 'topics') return act.type === 'topic_completed' || act.type === 'topic_uncompleted';
    if (filter === 'notes') return act.type === 'note_added';
    if (filter === 'documents') return act.type === 'doc_uploaded';
    return true;
  });

  return (
    <div className="recent-activity-card">
      <div className="activity-card-header">
        <div className="activity-header-left">
          <Activity size={18} className="activity-header-icon" />
          <h3>Recent Activity</h3>
        </div>

        {/* Filter Tabs */}
        <div className="activity-filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === 'topics' ? 'active' : ''}`}
            onClick={() => setFilter('topics')}
          >
            Topics
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === 'notes' ? 'active' : ''}`}
            onClick={() => setFilter('notes')}
          >
            Notes
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === 'documents' ? 'active' : ''}`}
            onClick={() => setFilter('documents')}
          >
            Documents
          </button>
        </div>
      </div>

      <div className="activity-list">
        {filteredActivity.length === 0 ? (
          <div className="activity-empty-state">
            <Clock size={32} className="empty-icon" />
            <p className="empty-title">No recent activity found</p>
            <p className="empty-subtitle">
              Mark topics as completed or upload new study materials to see your live learning history.
            </p>
          </div>
        ) : (
          filteredActivity.map((item) => (
            <div key={item.id} className="activity-list-item">
              <div className="activity-item-icon-wrapper">
                {getActivityIcon(item.type)}
              </div>

              <div className="activity-item-content">
                <div className="activity-item-top">
                  <span className="activity-item-title">{item.title}</span>
                  {getActivityBadge(item.type)}
                </div>

                <div className="activity-item-bottom">
                  {item.subject && (
                    <span className="activity-subject-tag">{item.subject}</span>
                  )}
                  <span className="activity-timestamp">
                    <Clock size={12} />
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivitySection;
