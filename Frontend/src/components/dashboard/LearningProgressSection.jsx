import React from 'react';
import { Award, Target, Flame, ArrowUpRight, BarChart2 } from 'lucide-react';

const getMasteryLevel = (percent = 0) => {
  if (percent >= 100) return { title: 'Master Scholar', color: '#10a37f', desc: 'Full curriculum completed!' };
  if (percent >= 75) return { title: 'Subject Specialist', color: '#10a37f', desc: 'Outstanding progress across subjects' };
  if (percent >= 50) return { title: 'Advanced Learner', color: '#0ea5e9', desc: 'Over halfway through syllabus' };
  if (percent >= 25) return { title: 'Concept Explorer', color: '#f59e0b', desc: 'Building consistent study momentum' };
  return { title: 'Curriculum Initiate', color: '#8e8e8e', desc: 'Start completing topics to level up' };
};

const LearningProgressSection = ({ stats = {}, subjects = [] }) => {
  const {
    totalTopics = 0,
    completedTopics = 0,
    overallProgress = 0,
  } = stats;

  const mastery = getMasteryLevel(overallProgress);
  const remainingTopics = Math.max(0, totalTopics - completedTopics);

  // Find top performing subject
  const sortedSubjects = [...subjects].sort((a, b) => (b.progress || 0) - (a.progress || 0));
  const topSubject = sortedSubjects.length > 0 && sortedSubjects[0].progress > 0 ? sortedSubjects[0] : null;

  return (
    <div className="learning-progress-grid">
      {/* 1. Overall Learning Progress Hero Card */}
      <div className="progress-hero-card">
        <div className="progress-card-header">
          <div className="progress-header-title">
            <Target size={18} className="progress-icon" />
            <h3>Overall Learning Progress</h3>
          </div>
          <span className="mastery-badge" style={{ backgroundColor: `${mastery.color}20`, color: mastery.color }}>
            <Award size={14} />
            {mastery.title}
          </span>
        </div>

        <div className="progress-hero-body">
          {/* Circular Visual Ring */}
          <div className="progress-radial-wrapper">
            <svg viewBox="0 0 100 100" className="radial-svg">
              <circle
                className="radial-bg"
                cx="50"
                cy="50"
                r="42"
                strokeWidth="10"
              />
              <circle
                className="radial-fill"
                cx="50"
                cy="50"
                r="42"
                strokeWidth="10"
                strokeDasharray={`${(overallProgress / 100) * 264} 264`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="radial-content">
              <span className="radial-percentage">{overallProgress}%</span>
              <span className="radial-label">Completed</span>
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="progress-breakdown">
            <p className="mastery-desc">{mastery.desc}</p>
            
            <div className="progress-stat-pills">
              <div className="stat-pill">
                <span className="pill-val">{completedTopics}</span>
                <span className="pill-lbl">Topics Done</span>
              </div>
              <div className="stat-pill">
                <span className="pill-val">{remainingTopics}</span>
                <span className="pill-lbl">Topics Left</span>
              </div>
              <div className="stat-pill">
                <span className="pill-val">{totalTopics}</span>
                <span className="pill-lbl">Total Goal</span>
              </div>
            </div>

            {topSubject && (
              <div className="top-subject-highlight">
                <Flame size={14} className="highlight-icon" />
                <span>
                  Strongest: <strong>{topSubject.name}</strong> ({topSubject.progress}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Subject-Wise Progress Visual Comparison */}
      <div className="subject-wise-card">
        <div className="progress-card-header">
          <div className="progress-header-title">
            <BarChart2 size={18} className="progress-icon" />
            <h3>Subject-Wise Progress</h3>
          </div>
          <span className="subject-count-tag">{subjects.length} Subjects</span>
        </div>

        <div className="subject-bars-list">
          {subjects.length === 0 ? (
            <div className="empty-subject-bars">
              <p>No subjects to compare yet.</p>
            </div>
          ) : (
            subjects.map((subj) => {
              const completed = (subj.topics || []).filter((t) => t.completed).length;
              const total = (subj.topics || []).length;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div key={subj.id} className="subject-progress-row">
                  <div className="row-labels">
                    <span className="row-subject-name">{subj.name}</span>
                    <div className="row-metrics">
                      <span className="row-topic-ratio">
                        {completed}/{total}
                      </span>
                      <span className="row-percent-tag">{percent}%</span>
                    </div>
                  </div>

                  <div className="row-bar-track">
                    <div
                      className="row-bar-fill"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: subj.color || '#10a37f',
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningProgressSection;
