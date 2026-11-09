import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import DashboardSkeleton from './DashboardSkeleton';

import {
  getDashboardDataApi,
  toggleTopicApi,
  createSubjectApi,
  updateSubjectApi,
  deleteSubjectApi,
  addTopicApi,
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
  const [uploadPreselectedSubject, setUploadPreselectedSubject] = useState('');
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
      const isConnectionError = !err.response || err.code === 'ERR_NETWORK';
      setError({
        message: isConnectionError
          ? 'Backend API server is offline or unreachable. Please check your backend connection.'
          : (err.response?.data?.message || 'Could not connect to backend server.'),
        isConnectionError,
      });
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Instant optimistic update for newly uploaded documents so cards appear in 0ms without reload
  const applyOptimisticDocument = (newDoc) => {
    if (!newDoc) return;
    setDashboardData((prev) => {
      const docId = newDoc._id || newDoc.id || `doc-${Date.now()}`;
      const docSubject = (newDoc.subject || 'General').trim();
      const docTitle = newDoc.title || newDoc.originalFileName || 'Untitled Document';

      const formattedDoc = {
        id: docId,
        _id: docId,
        title: docTitle,
        subject: docSubject,
        topic: newDoc.topic || '',
        contentType: newDoc.contentType || 'file',
        fileSize: newDoc.fileSize || 0,
        processingStatus: newDoc.processingStatus || 'uploaded',
        createdAt: newDoc.createdAt || new Date().toISOString(),
      };

      const existingDocIndex = (prev.recentDocuments || []).findIndex(
        (d) => (d.id || d._id) === docId
      );
      const updatedRecentDocs = existingDocIndex >= 0
        ? prev.recentDocuments.map((d, i) => (i === existingDocIndex ? formattedDoc : d))
        : [formattedDoc, ...(prev.recentDocuments || [])];

      let subjectFound = false;
      const updatedSubjects = (prev.subjects || []).map((subj) => {
        if (subj.name && subj.name.trim().toLowerCase() === docSubject.toLowerCase()) {
          subjectFound = true;
          return {
            ...subj,
            documentCount: (subj.documentCount || 0) + 1,
          };
        }
        return subj;
      });

      if (!subjectFound && docSubject) {
        updatedSubjects.push({
          id: `sub-opt-${Date.now().toString(36)}`,
          name: docSubject,
          code: '',
          description: `Generated from ${docTitle}`,
          category: 'Coursework',
          icon: 'BookOpen',
          color: '#10a37f',
          totalTopics: 0,
          completedTopics: 0,
          progress: 0,
          topics: [],
          documentCount: 1,
          createdAt: new Date().toISOString(),
        });
      }

      const updatedStats = {
        ...prev.stats,
        uploadedDocuments: (prev.stats?.uploadedDocuments || 0) + 1,
        totalSubjects: updatedSubjects.length,
      };

      const newActivity = {
        id: `act-opt-${Date.now()}`,
        type: 'doc_uploaded',
        title: `Uploaded document: "${docTitle}"`,
        subject: docSubject,
        timestamp: new Date().toISOString(),
      };

      return {
        ...prev,
        stats: updatedStats,
        subjects: updatedSubjects,
        recentDocuments: updatedRecentDocs,
        recentActivity: [newActivity, ...(prev.recentActivity || [])].slice(0, 15),
      };
    });
  };

  useEffect(() => {
    fetchDashboard(true);

    const handleDocUploaded = (event) => {
      const doc = event.detail;
      if (doc) {
        applyOptimisticDocument(doc);
      }
      fetchDashboard(false);
      // Secondary background checks to sync AI extracted topics
      setTimeout(() => fetchDashboard(false), 2500);
      setTimeout(() => fetchDashboard(false), 5500);
    };

    const handleDocDeleted = (event) => {
      const deletedId = event.detail?.id;
      if (deletedId) {
        setDashboardData((prev) => ({
          ...prev,
          recentDocuments: (prev.recentDocuments || []).filter(
            (d) => (d.id || d._id) !== deletedId
          ),
          stats: {
            ...prev.stats,
            uploadedDocuments: Math.max(0, (prev.stats?.uploadedDocuments || 1) - 1),
          },
        }));
      }
      fetchDashboard(false);
    };

    const handleRefreshEvent = () => fetchDashboard(false);

    window.addEventListener('aikms:document-uploaded', handleDocUploaded);
    window.addEventListener('aikms:document-deleted', handleDocDeleted);
    window.addEventListener('aikms:refresh-dashboard', handleRefreshEvent);

    return () => {
      window.removeEventListener('aikms:document-uploaded', handleDocUploaded);
      window.removeEventListener('aikms:document-deleted', handleDocDeleted);
      window.removeEventListener('aikms:refresh-dashboard', handleRefreshEvent);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard(false);
  };

  // Optimistic Topic or Subtopic Toggle
  const handleToggleTopic = async (subjectId, topicId, subtopicIdOrCompleted, explicitCompleted) => {
    let subtopicId = null;
    let newCompleted = false;

    if (typeof subtopicIdOrCompleted === 'boolean') {
      newCompleted = subtopicIdOrCompleted;
    } else {
      subtopicId = subtopicIdOrCompleted;
      newCompleted = typeof explicitCompleted === 'boolean' ? explicitCompleted : true;
    }

    // 1. Optimistically update local state for instantaneous feedback
    setDashboardData((prev) => {
      let itemName = '';
      let subjectName = '';

      const updatedSubjects = prev.subjects.map((subj) => {
        const isTargetSubj =
          subj.id === subjectId ||
          (subj._id && subj._id.toString() === String(subjectId)) ||
          (subj.name && subjectId && subj.name.trim().toLowerCase() === String(subjectId).trim().toLowerCase());
        if (!isTargetSubj) return subj;
        subjectName = subj.name;

        const updatedTopics = (subj.topics || []).map((t) => {
          const isTargetTopic =
            t.id === topicId ||
            (t._id && t._id.toString() === String(topicId)) ||
            (t.name && topicId && t.name.trim().toLowerCase() === String(topicId).trim().toLowerCase()) ||
            (t.name && topicId && t.name.replace(/^\d+[\.\:\-]?\s*/, '').trim().toLowerCase() === String(topicId).replace(/^\d+[\.\:\-]?\s*/, '').trim().toLowerCase());
          if (!isTargetTopic) return t;

          if (subtopicId) {
            // Toggling specific child subtopic
            const updatedSubtopics = (t.subtopics || []).map((st) => {
              const isTargetSub =
                st.id === subtopicId ||
                (st._id && st._id.toString() === String(subtopicId)) ||
                (st.name && subtopicId && st.name.trim().toLowerCase() === String(subtopicId).trim().toLowerCase()) ||
                (st.name && subtopicId && st.name.replace(/^\d+[\.\:\-]?\d*[\.\:\-]?\s*/, '').trim().toLowerCase() === String(subtopicId).replace(/^\d+[\.\:\-]?\d*[\.\:\-]?\s*/, '').trim().toLowerCase());
              if (!isTargetSub) return st;
              itemName = st.name;
              return { ...st, completed: newCompleted, completedAt: newCompleted ? new Date() : null };
            });
            const allSubsDone = updatedSubtopics.length > 0 && updatedSubtopics.every((st) => st.completed);
            return {
              ...t,
              completed: allSubsDone,
              completedAt: allSubsDone ? new Date() : null,
              subtopics: updatedSubtopics,
            };
          } else {
            // Toggling parent topic
            itemName = t.name;
            const updatedSubtopics = (t.subtopics || []).map((st) => ({
              ...st,
              completed: newCompleted,
              completedAt: newCompleted ? new Date() : null,
            }));
            return {
              ...t,
              completed: newCompleted,
              completedAt: newCompleted ? new Date() : null,
              subtopics: updatedSubtopics,
            };
          }
        });

        let total = 0;
        let completed = 0;
        updatedTopics.forEach((top) => {
          if (top.subtopics && top.subtopics.length > 0) {
            total += top.subtopics.length;
            completed += top.subtopics.filter((st) => st.completed).length;
          } else {
            total += 1;
            if (top.completed) completed += 1;
          }
        });
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          ...subj,
          topics: updatedTopics,
          totalTopics: total,
          completedTopics: completed,
          progress,
        };
      });

      // Recalculate global stats
      let totalTopics = 0;
      let completedTopics = 0;
      updatedSubjects.forEach((s) => {
        (s.topics || []).forEach((top) => {
          if (top.subtopics && top.subtopics.length > 0) {
            totalTopics += top.subtopics.length;
            completedTopics += top.subtopics.filter((st) => st.completed).length;
          } else {
            totalTopics += 1;
            if (top.completed) completedTopics += 1;
          }
        });
      });

      const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      const optimisticActivity = {
        id: `opt-act-${Date.now()}`,
        type: newCompleted ? 'topic_completed' : 'topic_uncompleted',
        title: newCompleted ? `Completed: "${itemName}"` : `Marked incomplete: "${itemName}"`,
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
      const res = await toggleTopicApi(subjectId, topicId, subtopicId, newCompleted);
      if (res && res.subject) {
        setDashboardData((prev) => ({
          ...prev,
          stats: res.stats || prev.stats,
          subjects: prev.subjects.map((s) =>
            s.id === subjectId || (s._id && s._id.toString() === String(subjectId)) || (res.subject && (s.id === res.subject.id || (s._id && res.subject._id && s._id.toString() === res.subject._id.toString())))
              ? { ...s, ...res.subject }
              : s
          ),
        }));
      }
    } catch (err) {
      console.error('Failed to sync topic status with backend:', err);
      fetchDashboard(false);
    }
  };

  // Add Topic or Subtopic to Subject
  const handleAddTopic = async (subjectId, name, parentTopicId) => {
    try {
      const res = await addTopicApi(subjectId, name, parentTopicId);
      if (res && res.subject) {
        setDashboardData((prev) => ({
          ...prev,
          stats: res.stats || prev.stats,
          subjects: prev.subjects.map((s) =>
            s.id === subjectId || (s._id && s._id.toString() === String(subjectId)) || (res.subject && (s.id === res.subject.id || (s._id && res.subject._id && s._id.toString() === res.subject._id.toString())))
              ? { ...s, ...res.subject }
              : s
          ),
        }));
      }
    } catch (err) {
      console.error('Failed to add topic:', err);
      alert('Could not add topic. Please check backend connection.');
    }
  };

  // Create Subject
  const handleSubjectCreated = async (payload) => {
    try {
      const res = await createSubjectApi(payload);
      if (res && res.subject) {
        setDashboardData((prev) => {
          const exists = (prev.subjects || []).some(
            (s) => s.id === res.subject.id || s.name?.trim().toLowerCase() === res.subject.name?.trim().toLowerCase()
          );
          const newSubj = {
            ...res.subject,
            documentCount: res.subject.documentCount || 0,
          };
          return {
            ...prev,
            stats: res.stats || prev.stats,
            subjects: exists ? prev.subjects : [...(prev.subjects || []), newSubj],
          };
        });
        window.dispatchEvent(new CustomEvent('aikms:refresh-dashboard'));
        await fetchDashboard(false);
      }
    } catch (err) {
      console.error('Failed to create subject:', err);
      throw err;
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
          recentDocuments: (prev.recentDocuments || []).filter(
            (d) => d.subject?.trim().toLowerCase() !== res.deletedSubjectName?.trim().toLowerCase()
          ),
        }));
        window.dispatchEvent(new CustomEvent('aikms:refresh-dashboard'));
        window.dispatchEvent(new CustomEvent('aikms:document-deleted', { detail: { subject: res.deletedSubjectName } }));
        await fetchDashboard(false);
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
      alert('Could not delete subject.');
    }
  };

  // Update Subject (e.g. rename)
  const handleUpdateSubject = async (subjectId, updateData) => {
    try {
      const res = await updateSubjectApi(subjectId, updateData);
      if (res && res.subject) {
        setDashboardData((prev) => ({
          ...prev,
          stats: res.stats || prev.stats,
          subjects: prev.subjects.map((s) =>
            s.id === subjectId ? { ...s, ...res.subject } : s
          ),
        }));
        await fetchDashboard(false);
        return res.subject;
      }
    } catch (err) {
      console.error('Failed to update subject:', err);
      throw err;
    }
  };



  // Upload modal success callback
  const handleUploadSuccess = (uploadedDoc) => {
    if (uploadedDoc) {
      applyOptimisticDocument(uploadedDoc);
    }
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
          <span>{typeof error === 'object' ? error.message : error}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {error.isConnectionError && (
              <Link
                to="/server-offline"
                state={{ isBackendOffline: true }}
                className="btn-retry"
                style={{ textDecoration: 'none', background: 'rgba(239, 68, 68, 0.25)', borderColor: 'rgba(239, 68, 68, 0.5)' }}
              >
                Server Status
              </Link>
            )}
            <button type="button" className="btn-retry" onClick={() => fetchDashboard(true)}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      {isLoading ? (
        <DashboardSkeleton />
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
              <h2 className="section-main-heading">My Vaults</h2>

              <button
                type="button"
                className="btn-add-subject-top"
                onClick={() => setIsCreateSubjectOpen(true)}
              >
                <FolderPlus size={16} />
                <span>New Vault</span>
              </button>
            </div>

            {/* Empty State for Subjects */}
            {dashboardData.subjects.length === 0 ? (
              <div className="empty-subjects-card">
                <BookOpen size={48} className="empty-subjects-icon" />
                <h3 className="empty-subjects-title">No Subjects in Your Curriculum</h3>
                <p className="empty-subjects-desc">
                  You haven't added any subjects yet. Upload learning materials (PDF, DOC, TXT) or create a custom subject to automatically generate your curriculum.
                </p>
                <div className="empty-subjects-actions">
                  <button
                    type="button"
                    className="btn-empty-primary"
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    <UploadCloud size={16} />
                    <span>Upload Study Material</span>
                  </button>
                  <button
                    type="button"
                    className="btn-empty-secondary"
                    onClick={() => setIsCreateSubjectOpen(true)}
                  >
                    <FolderPlus size={16} />
                    <span>Create Custom Subject</span>
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn-quick-upload-doc"
                        style={{ background: 'transparent', borderColor: 'rgba(255, 255, 255, 0.1)' }}
                        onClick={() => {
                          if (onSelectTab) onSelectTab('notes');
                        }}
                        title="Open Notes study vault (/notes)"
                      >
                        <BookOpen size={14} />
                        <span>All Notes</span>
                      </button>
                      <button
                        type="button"
                        className="btn-quick-upload-doc"
                        onClick={() => setIsUploadModalOpen(true)}
                      >
                        <UploadCloud size={14} />
                        <span>Upload</span>
                      </button>
                    </div>
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
                      {dashboardData.recentDocuments.slice(0, 8).map((doc) => (
                        <div
                          key={doc.id || doc._id}
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
        onUpdateSubject={handleUpdateSubject}
        onStudyWithAI={handleStudyWithAI}
        onStudyFlashcards={(subName) => {
          if (onSelectTab) onSelectTab('flashcards', { subject: subName });
        }}
        onTakeQuiz={(subName) => {
          if (onSelectTab) onSelectTab('quiz', { subject: subName });
        }}
        onUploadDocument={(subName) => {
          const prefill = subName || (dashboardData.subjects.find((s) => s.id === selectedSubjectId)?.name) || '';
          setUploadPreselectedSubject(prefill);
          setIsUploadModalOpen(true);
        }}
        onOpenDocumentViewer={onOpenDocumentViewer}
      />

      {/* Create Subject Modal */}
      <CreateSubjectModal
        isOpen={isCreateSubjectOpen}
        onClose={() => setIsCreateSubjectOpen(false)}
        onSubjectCreated={handleSubjectCreated}
      />

      {/* Upload Study Material Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadPreselectedSubject('');
        }}
        onUploadSuccess={handleUploadSuccess}
        subjects={dashboardData.subjects}
        initialSubject={uploadPreselectedSubject}
      />
    </div>
  );
};

export default DashboardOverview;
