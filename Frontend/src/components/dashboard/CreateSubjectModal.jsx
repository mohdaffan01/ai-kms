import React, { useState } from 'react';
import { X, BookPlus, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Emerald', value: '#10a37f' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#ec4899' },
];

const CreateSubjectModal = ({ isOpen, onClose, onSubjectCreated }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#10a37f');
  const [topicInput, setTopicInput] = useState('');
  const [topicsList, setTopicsList] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddTopic = () => {
    if (!topicInput.trim()) return;
    if (topicsList.includes(topicInput.trim())) {
      setError('Topic already added to the list.');
      return;
    }
    setTopicsList([...topicsList, topicInput.trim()]);
    setTopicInput('');
    setError('');
  };

  const handleKeyDownTopic = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTopic();
    }
  };

  const handleRemoveTopic = (indexToRemove) => {
    setTopicsList(topicsList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Subject name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        code: code.trim(),
        description: description.trim(),
        color: selectedColor,
        topics: topicsList.length > 0 ? topicsList : undefined,
      };

      await onSubjectCreated(payload);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setCode('');
    setDescription('');
    setSelectedColor('#10a37f');
    setTopicInput('');
    setTopicsList([]);
    setError('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="upload-modal-overlay" onClick={handleClose}>
      <div className="create-subject-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="upload-modal-header">
          <div className="upload-header-title">
            <BookPlus size={22} className="upload-header-icon" />
            <h3>Create New Subject</h3>
          </div>
          <button className="btn-modal-close" onClick={handleClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="upload-alert upload-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-subject-form">
          <div className="upload-fields-grid">
            <div className="upload-field">
              <label htmlFor="subj-name">
                Subject Name <span className="required-star">*</span>
              </label>
              <input
                id="subj-name"
                type="text"
                placeholder="e.g. Artificial Intelligence, Compiler Design"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="upload-field">
              <label htmlFor="subj-code">Subject Code (Optional)</label>
              <input
                id="subj-code"
                type="text"
                placeholder="e.g. CS-402"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="upload-field field-full-width">
              <label htmlFor="subj-desc">Description (Optional)</label>
              <input
                id="subj-desc"
                type="text"
                placeholder="Brief summary of subject objectives"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Color Accent Picker */}
            <div className="upload-field field-full-width">
              <label>Theme Color</label>
              <div className="color-presets-row">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`color-preset-circle ${selectedColor === color.value ? 'selected' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.name}
                  >
                    {selectedColor === color.value && <CheckCircle2 size={14} color="#ffffff" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Topics Builder */}
            <div className="upload-field field-full-width">
              <label>Syllabus Topics (Optional)</label>
              <p className="field-hint">Add topics now or add them later inside the subject card.</p>
              
              <div className="topic-input-row">
                <input
                  type="text"
                  placeholder="e.g. Heuristic Search Algorithms"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={handleKeyDownTopic}
                />
                <button type="button" className="btn-add-topic-chip" onClick={handleAddTopic}>
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>

              {topicsList.length > 0 && (
                <div className="topics-chips-container">
                  {topicsList.map((top, idx) => (
                    <span key={idx} className="topic-chip">
                      <span className="topic-chip-text">{top}</span>
                      <button
                        type="button"
                        className="btn-remove-chip"
                        onClick={() => handleRemoveTopic(idx)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="upload-modal-footer">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>Creating Subject...</span>
                </>
              ) : (
                <>
                  <BookPlus size={18} />
                  <span>Create Subject</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubjectModal;
