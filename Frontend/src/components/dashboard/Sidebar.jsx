import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  Upload, 
  LogOut, 
  User, 
  Menu, 
  X,
  Brain
} from 'lucide-react';

const SAMPLE_CONTENT = [
  { id: 1, title: 'DBMS Notes.pdf', type: 'pdf' },
  { id: 2, title: 'Operating Systems.pdf', type: 'pdf' },
  { id: 3, title: 'Computer Networks PPT', type: 'ppt' },
];

const Sidebar = ({ onNewChat }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contentList, setContentList] = useState(SAMPLE_CONTENT);
  const navigate = useNavigate();

  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { name: 'Mohd Affan', email: 'affan@example.com' };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUploadClick = () => {
    alert('Upload Content UI clicked! File processing will be enabled in Module 2.');
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Backdrop for Mobile */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />
      )}

      {/* Main Sidebar Element */}
      <aside className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand & New Chat Button */}
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-logo-icon">
              <Brain size={20} />
            </div>
            <span className="brand-name">AiKMS</span>
          </div>

          <button 
            className="btn-new-chat"
            onClick={() => {
              if (onNewChat) onNewChat();
              setIsOpen(false);
            }}
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Your Content Section */}
        <div className="sidebar-content-section">
          <div className="section-header">
            <span className="section-title">Your Content</span>
          </div>

          <div className="content-list">
            {contentList.map((item) => (
              <div key={item.id} className="content-item">
                <FileText size={16} className="content-icon" />
                <span className="content-title" title={item.title}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>

          <button className="btn-upload-content" onClick={handleUploadClick}>
            <Upload size={16} />
            <span>Upload Content</span>
          </button>
        </div>

        {/* User Footer & Logout */}
        <div className="sidebar-user-footer">
          <div className="user-profile-info">
            <div className="user-avatar-badge">
              <User size={18} />
            </div>
            <div className="user-details">
              <span className="user-display-name">{user.name}</span>
              <span className="user-display-email">{user.email}</span>
            </div>
          </div>

          <button className="btn-sidebar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
