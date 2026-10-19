import { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocumentApi, getMyDocumentsApi } from '../../api/documentApi';
import { getDashboardDataApi } from '../../api/progressApi';
import { processDocumentKnowledgeApi } from '../../api/knowledgeApi';

const ALLOWED_EXTENSIONS = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.txt', '.md'];
const NEW_FOLDER_OPTION = '__create_new__';
const NEW_SUBJECT_OPTION = '__create_new_subject__';

const UploadModal = ({
  isOpen,
  onClose,
  onUploadSuccess,
  folders = [],
  subjects = [],
  initialSubject = '',
}) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [folderSelection, setFolderSelection] = useState('General');
  const [newFolderName, setNewFolderName] = useState('');

  // Subject management state: choose existing or create new
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [subjectMode, setSubjectMode] = useState('existing'); // 'existing' | 'new'
  const [subjectSelection, setSubjectSelection] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef(null);
  const folderOptions = [...new Set(['General', ...folders.map((name) => name.trim()).filter(Boolean)])]
    .sort((first, second) => first.localeCompare(second));

  // Sync and fetch all existing subjects whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const extractSubjectNames = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((item) => (typeof item === 'string' ? item : item?.name))
        .filter((name) => typeof name === 'string' && name.trim().length > 0)
        .map((name) => name.trim());
    };

    const initialNames = extractSubjectNames(subjects);

    const syncSubjects = async () => {
      const gatheredMap = new Map();
      initialNames.forEach((name) => gatheredMap.set(name.toLowerCase(), name));

      try {
        const [dashRes, docRes] = await Promise.allSettled([
          getDashboardDataApi(),
          getMyDocumentsApi(),
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value?.subjects) {
          extractSubjectNames(dashRes.value.subjects).forEach((name) => {
            if (!gatheredMap.has(name.toLowerCase())) {
              gatheredMap.set(name.toLowerCase(), name);
            }
          });
        }

        if (docRes.status === 'fulfilled' && docRes.value?.documents) {
          docRes.value.documents.forEach((doc) => {
            if (doc.subject && doc.subject.trim()) {
              const name = doc.subject.trim();
              if (!gatheredMap.has(name.toLowerCase())) {
                gatheredMap.set(name.toLowerCase(), name);
              }
            }
          });
        }
      } catch (err) {
        console.warn('Could not refresh subjects in UploadModal:', err);
      }

      if (!isMounted) return;

      const sorted = Array.from(gatheredMap.values()).sort((a, b) => a.localeCompare(b));
      setAvailableSubjects(sorted);

      if (initialSubject) {
        const matched = sorted.find((s) => s.toLowerCase() === initialSubject.trim().toLowerCase());
        if (matched) {
          setSubjectSelection(matched);
          setSubjectMode('existing');
        } else {
          setNewSubjectName(initialSubject.trim());
          setSubjectMode('new');
        }
      } else if (sorted.length > 0) {
        setSubjectMode('existing');
        setSubjectSelection((prev) => (prev && sorted.includes(prev) ? prev : sorted[0]));
      } else {
        setSubjectMode('new');
        setSubjectSelection('');
      }
    };

    syncSubjects();

    return () => {
      isMounted = false;
    };
  }, [isOpen, subjects, initialSubject]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setTopic('');
    setFolderSelection('General');
    setNewFolderName('');
    setNewSubjectName('');
    setSubjectSelection(initialSubject || (availableSubjects.length > 0 ? availableSubjects[0] : ''));
    setSubjectMode(availableSubjects.length > 0 ? 'existing' : 'new');
    setError('');
    setSuccess('');
    setIsUploading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    setSuccess('');

    if (!selectedFile) return;

    const fileExt = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      setError(`Unsupported file type (${fileExt}). Allowed: PDF, PPT, DOC, TXT, MD.`);
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File size exceeds the 20MB limit.');
      return;
    }

    setFile(selectedFile);
    // Autofill title if empty
    if (!title) {
      const fileNameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
      setTitle(fileNameWithoutExt);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No login session token found. Please log out and log in again to authenticate.');
      return;
    }

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    let finalSubject = '';
    if (subjectMode === 'new' || subjectSelection === NEW_SUBJECT_OPTION) {
      finalSubject = newSubjectName.trim();
      if (!finalSubject) {
        setError('Subject is required. Please enter a subject name.');
        return;
      }
    } else {
      finalSubject = subjectSelection.trim();
      if (!finalSubject) {
        setError('Subject is required. Please select an existing subject or switch to create a new one.');
        return;
      }
    }

    const targetFolder = folderSelection === NEW_FOLDER_OPTION
      ? newFolderName.trim()
      : folderSelection.trim();
    if (!targetFolder) {
      setError('Please choose a folder or enter a folder name.');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('subject', finalSubject);
      if (topic.trim()) formData.append('topic', topic.trim());
      formData.append('folder', targetFolder);

      const response = await uploadDocumentApi(formData);
      const uploadedDoc = response.document || response;

      // Automatically trigger text extraction, chunking & vector indexing in background
      if (uploadedDoc && uploadedDoc._id) {
        processDocumentKnowledgeApi(uploadedDoc._id).catch((pErr) => {
          console.warn('Background document processing error:', pErr);
        });
      }

      // 1. Immediately invoke callback if provided so parent can optimistically update
      if (onUploadSuccess) {
        try {
          onUploadSuccess(uploadedDoc);
        } catch (cbErr) {
          console.warn('onUploadSuccess callback error:', cbErr);
        }
      }

      // 2. Broadcast globally so Dashboard cards, Sidebar, and Modals update in 0ms without page reload
      try {
        window.dispatchEvent(
          new CustomEvent('aikms:document-uploaded', { detail: uploadedDoc })
        );
      } catch (evtErr) {
        console.warn('CustomEvent dispatch error:', evtErr);
      }

      setSuccess('Document uploaded & vector processing started!');
      
      setTimeout(() => {
        handleClose();
      }, 700);
    } catch (err) {
      console.error('Upload Error:', err);
      const errMsg = err.response?.data?.message || 'Failed to upload document. Please try again.';
      setError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-modal-overlay" onClick={handleClose}>
      <div className="upload-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="upload-modal-header">
          <div className="upload-header-title">
            <UploadCloud size={22} className="upload-header-icon" />
            <h3>Upload Content</h3>
          </div>
          <button className="btn-modal-close" onClick={handleClose} disabled={isUploading}>
            <X size={20} />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="upload-alert upload-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="upload-alert upload-alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-modal-form">
          {/* File Drag and Drop Zone */}
          <div
            className={`file-drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md"
              style={{ display: 'none' }}
            />

            {file ? (
              <div className="file-preview-card">
                <FileText size={32} className="file-preview-icon" />
                <div className="file-preview-details">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  type="button"
                  className="btn-change-file"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="drop-zone-prompt">
                <UploadCloud size={40} className="drop-zone-icon" />
                <p className="drop-title">Click to upload or drag and drop</p>
                <p className="drop-subtitle">PDF, PPT, DOC, TXT, or MD (max 20MB)</p>
              </div>
            )}
          </div>

          {/* Form Inputs */}
          <div className="upload-fields-grid">
            <div className="upload-field">
              <label htmlFor="doc-title">
                Title <span className="required-star">*</span>
              </label>
              <input
                id="doc-title"
                type="text"
                placeholder="e.g. Unit 3 DBMS Notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="upload-field">
              <div className="upload-field-header">
                <label htmlFor={subjectMode === 'new' ? 'doc-subject-new' : 'doc-subject'}>
                  Subject <span className="required-star">*</span>
                </label>
                {availableSubjects.length > 0 && (
                  <div className="subject-type-toggle">
                    <button
                      type="button"
                      className={`subject-toggle-pill ${subjectMode === 'existing' ? 'active' : ''}`}
                      onClick={() => {
                        setSubjectMode('existing');
                        if (!subjectSelection && availableSubjects.length > 0) {
                          setSubjectSelection(availableSubjects[0]);
                        }
                      }}
                      title="Select an existing subject"
                    >
                      Existing
                    </button>
                    <button
                      type="button"
                      className={`subject-toggle-pill ${subjectMode === 'new' ? 'active' : ''}`}
                      onClick={() => setSubjectMode('new')}
                      title="Create a new subject"
                    >
                      + New
                    </button>
                  </div>
                )}
              </div>

              {subjectMode === 'existing' && availableSubjects.length > 0 ? (
                <div className="subject-select-container">
                  <select
                    id="doc-subject"
                    value={subjectSelection}
                    onChange={(e) => {
                      if (e.target.value === NEW_SUBJECT_OPTION) {
                        setSubjectMode('new');
                        setNewSubjectName('');
                      } else {
                        setSubjectSelection(e.target.value);
                      }
                    }}
                    disabled={isUploading}
                    required
                  >
                    {availableSubjects.map((subjectName) => (
                      <option key={subjectName} value={subjectName}>
                        {subjectName}
                      </option>
                    ))}
                    <option value={NEW_SUBJECT_OPTION}>+ Create New Subject...</option>
                  </select>
                </div>
              ) : (
                <div className="new-subject-field-container">
                  <input
                    id="doc-subject-new"
                    type="text"
                    placeholder="Enter subject name (e.g. Database Management Systems)"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    maxLength={100}
                    required
                    disabled={isUploading}
                    autoFocus={subjectMode === 'new' && availableSubjects.length > 0}
                  />
                  {availableSubjects.length > 0 && (
                    <button
                      type="button"
                      className="btn-switch-subject-mode"
                      onClick={() => {
                        setSubjectMode('existing');
                        if (!subjectSelection) {
                          setSubjectSelection(availableSubjects[0]);
                        }
                      }}
                    >
                      &larr; Choose from existing subjects
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="upload-field">
              <label htmlFor="doc-topic">Topic (Optional)</label>
              <input
                id="doc-topic"
                type="text"
                placeholder="e.g. Normalization & Indexing"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="upload-field">
              <label htmlFor="doc-folder">Folder</label>
              <select
                id="doc-folder"
                value={folderSelection}
                onChange={(e) => setFolderSelection(e.target.value)}
                disabled={isUploading}
              >
                {folderOptions.map((folderName) => (
                  <option key={folderName} value={folderName}>{folderName}</option>
                ))}
                <option value={NEW_FOLDER_OPTION}>Create new folder...</option>
              </select>
              {folderSelection === NEW_FOLDER_OPTION && (
                <input
                  id="new-folder-name"
                  type="text"
                  placeholder="Enter folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  maxLength={80}
                  required
                  disabled={isUploading}
                />
              )}
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="upload-modal-footer">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" disabled={isUploading || !file}>
              {isUploading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
