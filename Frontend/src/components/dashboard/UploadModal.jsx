import { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocumentApi } from '../../api/documentApi';
import { processDocumentKnowledgeApi } from '../../api/knowledgeApi';

const ALLOWED_EXTENSIONS = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.txt', '.md'];
const NEW_FOLDER_OPTION = '__create_new__';

const UploadModal = ({ isOpen, onClose, onUploadSuccess, folders = [] }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [folderSelection, setFolderSelection] = useState('General');
  const [newFolderName, setNewFolderName] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef(null);
  const folderOptions = [...new Set(['General', ...folders.map((name) => name.trim()).filter(Boolean)])]
    .sort((first, second) => first.localeCompare(second));

  if (!isOpen) return null;

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setSubject('');
    setTopic('');
    setFolderSelection('General');
    setNewFolderName('');
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

    if (!subject.trim()) {
      setError('Subject is required.');
      return;
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
      formData.append('subject', subject.trim());
      if (topic.trim()) formData.append('topic', topic.trim());
      formData.append('folder', targetFolder);

      const response = await uploadDocumentApi(formData);
      const uploadedDoc = response.document || response;

      // Automatically trigger text extraction, chunking & vector indexing
      if (uploadedDoc && uploadedDoc._id) {
        processDocumentKnowledgeApi(uploadedDoc._id).catch((pErr) => {
          console.warn('Background document processing error:', pErr);
        });
      }

      setSuccess('Document uploaded & vector processing started!');
      
      setTimeout(() => {
        if (onUploadSuccess) onUploadSuccess(uploadedDoc);
        handleClose();
      }, 1200);
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
              <label htmlFor="doc-subject">
                Subject <span className="required-star">*</span>
              </label>
              <input
                id="doc-subject"
                type="text"
                placeholder="e.g. Database Management Systems"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
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
