import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  FolderPlus,
  UploadCloud,
  Bot,
  Layers,
  BookOpen,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileUp,
  ExternalLink,
  Eye
} from 'lucide-react';

import OverviewStats from './OverviewStats';
import SubjectCard from './SubjectCard';
import LearningProgressSection from './LearningProgressSection';
import RecentActivitySection from './RecentActivitySection';
import CreateSubjectModal from './CreateSubjectModal';
import UploadModal from './UploadModal';
import SubjectDetailModal from './SubjectDetailModal';

import {
  getDashboardDataApi,
  toggleTopicApi,
  createSubjectApi,
  deleteSubjectApi,
  addTopicApi,
  resetDefaultSubjectsApi,
} from '../../api/progressApi';

const DashboardOverview = ({ onSelectTab, onOpenDocumentViewer }) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalSubjects: 0,
      totalTopics: 0,
      completedTopics: 0,
      overallProgress: 0,
      uploadedDocuments: 0,
    },
    subjects: [],
    recentActivity: [],
    recentDocuments: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [isSubjectDetailOpen, setIsSubjectDetailOpen] = useState(false);

  // Fetch dashboard data
  const fetchDashboard = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);
      const data = await getDashboardDataApi();
      if (data && data.success) {
        setDashboardData({
          stats: data.stats || {},
          subjects: data.subjects || [],
          recentActivity: data.recentActivity || [],
          recentDocuments: data.recentDocuments || [],
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.response?.data?.message || 'Could not connect to backend server.');
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard(false);
  };

  // Optimistic Topic Toggle
  const handleToggleTopic = async (subjectId, topicId, newCompleted) => {
    // 1. Optimistically update local state for instantaneous feedback
    setDashboardData((prev) => {
      let topicName = '';
      let subjectName = '';

      const updatedSubjects = prev.subjects.map((subj) => {
        if (subj.id !== subjectId) return subj;
        subjectName = subj.name;

        const updatedTopics = (subj.topics || []).map((t) => {
          if (t.id !== topicId) return t;
          topicName = t.name;
          return { ...t, completed: newCompleted, completedAt: newCompleted ? new Date() : null };
        });

        const total = updatedTopics.length;
        const completed = updatedTopics.filter((t) => t.completed).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          ...subj,
          topics: updatedTopics,
          completedTopics: completed,
          progress,
        };
      });

      // Recalculate global stats
      let totalTopics = 0;
      let completedTopics = 0;
      updatedSubjects.forEach((s) => {
        totalTopics += (s.topics || []).length;
        completedTopics += (s.topics || []).filter((t) => t.completed).length;
      });

      const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      // Optimistically push activity item
      const optimisticActivity = {
        id: `opt-act-${Date.now()}`,
        type: newCompleted ? 'topic_completed' : 'topic_uncompleted',
        title: newCompleted ? `Completed topic: "${topicName}"` : `Marked incomplete: "${topicName}"`,
        subject: subjectName,
        timestamp: new Date(),
      };

      return {
        ...prev,
        stats: {
          ...prev.stats,
          totalTopics,
          completedTopics,
          overallProgress,
        },
        subjects: updatedSubjects,
        recentActivity: [optimisticActivity, ...prev.recentActivity.slice(0, 14)],
      };
    });

    // 2. Persist to MongoDB backend
    try {
      await toggleTopicApi(subjectId, topicId, newCompleted);
    } catch (err) {
      console.error('Failed to sync topic status with backend:', err);
      // Re-fetch to restore ground truth on error
      fetchDashboard(false);
    }
  };

  // Add Topic to Subject
  const handleAddTopic = async (subjectId, name) => {
    try {
      const res = await addTopicApi(subjectId, name);
      if (res && res.subject) {
        setDashboardData((prev) => ({
          ...prev,
          stats: res.stats || prev.stats,
          subjects: prev.subjects.map((s) => (s.id === subjectId ? { ...s, ...res.subject } : s)),
        }));
      }
    } catch (err) {
      console.error('Failed to add topic:', err);
      alert('Could not add topic. Please check backend connection.');
    }
  };

  // Create Subject
  const handleSubjectCreated = async (payload) => {
    const res = await createSubjectApi(payload);
    if (res && res.subject) {
      setDashboardData((prev) => ({
        ...prev,
        stats: res.stats || prev.stats,
        subjects: [...prev.subjects, res.subject],
      }));
      fetchDashboard(false);
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (subjectId) => {
    try {
      const res = await deleteSubjectApi(subjectId);
      if (res) {
        setDashboardData((prev) => ({
          ...prev,
          stats: res.stats || prev.stats,
          subjects: prev.subjects.filter((s) => s.id !== subjectId),
        }));
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
      alert('Could not delete subject.');
    }
  };

  // Reset Default CS Curriculum
  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        'Reset curriculum back to default subjects (DBMS, Operating Systems, Computer Networks, Data Structures, Software Engineering)?'
      )
    ) {
      return;
    }
    try {
      setIsRefreshing(true);
      await resetDefaultSubjectsApi();
      await fetchDashboard(false);
    } catch (err) {
      console.error('Failed to reset default subjects:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Upload modal success callback
  const handleUploadSuccess = () => {
    fetchDashboard(false);
  };

  // Open Chat with Subject prompt
  const handleStudyWithAI = (subjectName) => {
    if (onSelectTab) {
      onSelectTab('chat');
    }
  };

  const handleOpenSubjectModal = (subj) => {
    setSelectedSubjectId(subj.id);
    setIsSubjectDetailOpen(true);
  };

  return (
    <div className="dashboard-page-container">

      {/* Error Alert */}
      {error && (
        <div className="dashboard-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" className="btn-retry" onClick={() => fetchDashboard(true)}>
            Retry
          </button>
        </div>
      )}

      {/* Main Content Body */}
      {isLoading ? (
        <div className="dashboard-loading-skeleton">
          <Loader2 size={36} className="spinner" />
          <p>Loading your study dashboard...</p>
        </div>
      ) : (
        <div className="dashboard-content-layout">
          {/* 1. Overview Section */}
          <section className="dashboard-section section-overview">
            <div className="section-title-wrap">
              <h2 className="section-main-heading">Overview</h2>
            </div>
            <OverviewStats stats={dashboardData.stats} />
          </section>

          {/* 2 & 3. Subject Cards & Topic Tracking Section */}
          <section className="dashboard-section section-subjects">
            <div className="section-title-wrap with-action">
              <h2 className="section-main-heading">Subjects</h2>

              <button
                type="button"
                className="btn-add-subject-top"
                onClick={() => setIsCreateSubjectOpen(true)}
              >
                <FolderPlus size={16} />
                <span>New Subject</span>
              </button>
            </div>

            {/* Empty State for Subjects */}
            {dashboardData.subjects.length === 0 ? (
              <div className="empty-subjects-card">
                <BookOpen size={48} className="empty-subjects-icon" />
                <h3 className="empty-subjects-title">No Subjects in Your Curriculum</h3>
                <p className="empty-subjects-desc">
                  You haven't configured any subjects yet. Create your first subject or restore the default
                  Computer Science curriculum (DBMS, Operating Systems, Computer Networks, Data Structures, and Software Engineering).
                </p>
                <div className="empty-subjects-actions">
                  <button
                    type="button"
                    className="btn-empty-primary"
                    onClick={() => setIsCreateSubjectOpen(true)}
                  >
                    <FolderPlus size={16} />
                    <span>Create Custom Subject</span>
                  </button>
                  <button
                    type="button"
                    className="btn-empty-secondary"
                    onClick={handleResetDefaults}
                  >
                    <span>Restore Standard CS Curriculum</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="subjects-cards-grid">
                {dashboardData.subjects.map((subject) => (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    onOpenSubject={handleOpenSubjectModal}
                    onStudyWithAI={handleStudyWithAI}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 4. Visual Learning Progress Section */}
          <section className="dashboard-section section-learning-progress">
            <div className="section-title-wrap">
              <h2 className="section-main-heading">Learning Progress</h2>
            </div>
            <LearningProgressSection
              stats={dashboardData.stats}
              subjects={dashboardData.subjects}
            />
          </section>

          {/* 5. Recent Activity & Uploaded Documents Section */}
          <section className="dashboard-section section-activity-and-docs">
            <div className="activity-docs-grid">
              {/* Recent Activity Feed */}
              <div className="grid-col-activity">
                <RecentActivitySection
                  recentActivity={dashboardData.recentActivity}
                  recentDocuments={dashboardData.recentDocuments}
                />
              </div>

              {/* Uploaded Documents List & Empty State */}
              <div className="grid-col-docs">
                <div className="uploaded-docs-card">
                  <div className="docs-card-header">
                    <div className="docs-header-left">
                      <FileText size={18} className="docs-header-icon" />
                      <h3>Uploaded Study Materials</h3>
                    </div>
                    <button
                      type="button"
                      className="btn-quick-upload-doc"
                      onClick={() => setIsUploadModalOpen(true)}
                    >
                      <UploadCloud size={14} />
                      <span>Upload</span>
                    </button>
                  </div>

                  {dashboardData.recentDocuments.length === 0 ? (
                    <div className="docs-empty-state">
                      <UploadCloud size={36} className="empty-upload-icon" />
                      <h4 className="empty-upload-title">No Study Materials Uploaded Yet</h4>
                      <p className="empty-upload-desc">
                        Upload lecture slides, textbooks, or syllabus documents (PDF, DOC, TXT) to empower your AI assistant to answer questions directly from them.
                      </p>
                      <button
                        type="button"
                        className="btn-upload-empty-cta"
                        onClick={() => setIsUploadModalOpen(true)}
                      >
                        <FileUp size={16} />
                        <span>Upload Your First Document</span>
                      </button>
                    </div>
                  ) : (
                    <div className="docs-mini-list">
                      {dashboardData.recentDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="doc-mini-item"
                          onClick={() => {
                            if (onOpenDocumentViewer) onOpenDocumentViewer(doc);
                          }}
                        >
                          <div className="doc-mini-icon-wrapper">
                            <FileText size={16} />
                          </div>
                          <div className="doc-mini-info">
                            <span className="doc-mini-title" title={doc.title}>
                              {doc.title}
                            </span>
                            <div className="doc-mini-meta">
                              <span className="doc-mini-subject">{doc.subject}</span>
                              {doc.topic && <span className="doc-mini-topic">• {doc.topic}</span>}
                            </div>
                          </div>
                          <span className={`doc-mini-status status-${doc.processingStatus || 'uploaded'}`}>
                            {doc.processingStatus === 'processed' ? 'Indexed' : doc.processingStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Create Subject Modal */}
      <CreateSubjectModal
        isOpen={isCreateSubjectOpen}
        onClose={() => setIsCreateSubjectOpen(false)}
        onSubjectCreated={handleSubjectCreated}
      />

      {/* Upload Study Material Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Subject Study Progress & Topics Detail Modal */}
      <SubjectDetailModal
        subject={dashboardData.subjects.find((s) => s.id === selectedSubjectId)}
        documents={dashboardData.recentDocuments}
        isOpen={isSubjectDetailOpen}
        onClose={() => {
          setIsSubjectDetailOpen(false);
          setSelectedSubjectId(null);
        }}
        onToggleTopic={handleToggleTopic}
        onAddTopic={handleAddTopic}
        onDeleteSubject={handleDeleteSubject}
        onStudyWithAI={handleStudyWithAI}
        onUploadDocument={() => setIsUploadModalOpen(true)}
        onOpenDocumentViewer={onOpenDocumentViewer}
      />
    </div>
  );
};

export default DashboardOverview;
