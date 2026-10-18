import React from 'react';
import { BookOpen, ListChecks, CheckCircle2, TrendingUp, Files } from 'lucide-react';

const OverviewStats = ({ stats = {} }) => {
  const {
    totalSubjects = 0,
    totalTopics = 0,
    completedTopics = 0,
    overallProgress = 0,
    uploadedDocuments = 0,
  } = stats;

  return (
    <div className="overview-stats-grid">
      {/* 1. Total Subjects */}
      <div className="stat-card stat-card-subjects">
        <div className="stat-card-top">
          <span className="stat-card-label">Total Subjects</span>
          <div className="stat-card-icon icon-subjects">
            <BookOpen size={20} />
          </div>
        </div>
        <div className="stat-card-body">
          <span className="stat-card-value">{totalSubjects}</span>
          <span className="stat-card-subtext">Active curriculum subjects</span>
        </div>
      </div>

      {/* 2. Total Topics */}
      <div className="stat-card stat-card-topics">
        <div className="stat-card-top">
          <span className="stat-card-label">Total Topics</span>
          <div className="stat-card-icon icon-topics">
            <ListChecks size={20} />
          </div>
        </div>
        <div className="stat-card-body">
          <span className="stat-card-value">{totalTopics}</span>
          <span className="stat-card-subtext">Syllabus concepts to master</span>
        </div>
      </div>

      {/* 3. Completed Topics */}
      <div className="stat-card stat-card-completed">
        <div className="stat-card-top">
          <span className="stat-card-label">Completed Topics</span>
          <div className="stat-card-icon icon-completed">
            <CheckCircle2 size={20} />
          </div>
        </div>
        <div className="stat-card-body">
          <span className="stat-card-value">{completedTopics}</span>
          <span className="stat-card-subtext">
            {totalTopics > 0
              ? `${Math.max(0, totalTopics - completedTopics)} remaining topics`
              : 'Start learning today'}
          </span>
        </div>
      </div>

      {/* 4. Overall Learning Progress */}
      <div className="stat-card stat-card-progress">
        <div className="stat-card-top">
          <span className="stat-card-label">Overall Progress</span>
          <div className="stat-card-icon icon-progress">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="stat-card-body">
          <div className="stat-progress-metric">
            <span className="stat-card-value">{overallProgress}%</span>
            <div className="stat-mini-radial">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${overallProgress}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>
          <span className="stat-card-subtext">
            {overallProgress >= 100
              ? 'Curriculum completed! 🎉'
              : `${completedTopics} of ${totalTopics} topics finished`}
          </span>
        </div>
      </div>

      {/* 5. Uploaded Documents */}
      <div className="stat-card stat-card-documents">
        <div className="stat-card-top">
          <span className="stat-card-label">Uploaded Documents</span>
          <div className="stat-card-icon icon-documents">
            <Files size={20} />
          </div>
        </div>
        <div className="stat-card-body">
          <span className="stat-card-value">{uploadedDocuments}</span>
          <span className="stat-card-subtext">
            {uploadedDocuments === 1 ? '1 study resource linked' : `${uploadedDocuments} study resources linked`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OverviewStats;
