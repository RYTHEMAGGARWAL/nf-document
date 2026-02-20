import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { userService, folderService, fileService } from './services/api';
import './App.css';

function App() {
  const { user, login, logout, isAuthenticated, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFolderClick = (folderId) => {
    setSelectedFolderId(folderId);
    setCurrentView('files'); // Auto switch to Files tab
  };

  // Login Form
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

const handleLogin = async (e) => {
  e.preventDefault();
  console.log('🎬 Login form submitted');
  setLoginError('');
  setLoading(true);

  try {
    console.log('📞 Calling login function...');
    const result = await login(credentials);
    console.log('📦 Login result:', result);
    
    if (result.success) {
      console.log('✅ Login success confirmed');
      
      // Wait for localStorage to be fully written
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verify localStorage before redirect
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('🔍 Pre-redirect check:');
      console.log('  - Token exists:', token ? 'YES ✅' : 'NO ❌');
      console.log('  - User exists:', user ? 'YES ✅' : 'NO ❌');
      
      if (token && user) {
        console.log('🔄 Redirecting to dashboard...');
        window.location.href = '/';
      } else {
        console.error('❌ CRITICAL: LocalStorage not set!');
        console.error('This should never happen - check AuthContext');
        setLoginError('Login failed - storage error');
        setLoading(false);
      }
    } else {
      console.log('❌ Login failed:', result.message);
      setLoginError(result.message);
      setLoading(false);
    }
  } catch (error) {
    console.error('💥 Exception during login:', error);
    setLoginError('An error occurred during login');
    setLoading(false);
  }
};

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <div className="copilot-logo">🤖</div>
            <h1>NF Document Repository</h1>
            <p>Powered by Microsoft Copilot AI v7.0</p>
          </div>
          <div className="login-form">
            {loginError && (
              <div className="alert alert-error mb-20">{loginError}</div>
            )}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Username</label>
                <input
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button className="btn btn-full" type="submit" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            <div className="mt-20" style={{ padding: '15px', background: '#f8f9fa', borderRadius: '5px', fontSize: '13px', color: '#666' }}>
              <strong>NIIT Foundation Staff:</strong><br />
              Contact administrator for credentials
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div className="header">
        <h1>
          <div className="copilot-logo">🤖</div>
          NF Document Repository v7.0
        </h1>
        <div className="user-info">
          <div className="connection-status">
            <div className="status-dot"></div>
            <span>Connected</span>
          </div>
          <span className="user-badge">
            {user.username} ({user.role.toUpperCase()})
          </span>
          <button className="btn btn-header" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar */}
        <FolderTreeSidebar 
          onFolderClick={handleFolderClick} 
          selectedFolderId={selectedFolderId}
        />

        {/* Content Area */}
        <div className="content-area">
          {/* Navigation Tabs */}
          <div className="nav-tabs">
            <button
              className={`nav-tab ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`nav-tab ${currentView === 'files' ? 'active' : ''}`}
              onClick={() => setCurrentView('files')}
            >
              📁 Files
            </button>
            {isAdmin && (
              <>
                <button
                  className={`nav-tab ${currentView === 'folders' ? 'active' : ''}`}
                  onClick={() => setCurrentView('folders')}
                >
                  🗂️ Manage Folders
                </button>
                <button
                  className={`nav-tab ${currentView === 'users' ? 'active' : ''}`}
                  onClick={() => setCurrentView('users')}
                >
                  👥 Users
                </button>
                <button
                  className={`nav-tab ${currentView === 'settings' ? 'active' : ''}`}
                  onClick={() => setCurrentView('settings')}
                >
                  ⚙️ Settings
                </button>
              </>
            )}
          </div>

          {/* Views */}
          <div className="view-container">
            {currentView === 'dashboard' && <DashboardView />}
            {currentView === 'files' && <FilesView selectedFolderId={selectedFolderId} />}
            {currentView === 'folders' && isAdmin && <FoldersView />}
            {currentView === 'users' && isAdmin && <UsersView />}
            {currentView === 'settings' && isAdmin && <SettingsView />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Folder Tree Sidebar Component
function FolderTreeSidebar({ onFolderClick, selectedFolderId }) {
  const [folders, setFolders] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const response = await folderService.getAll();
      setFolders(response.data.folders);
      // Auto-expand all folders
      const expanded = {};
      response.data.folders.forEach(f => {
        expanded[f._id] = true;
      });
      setExpandedFolders(expanded);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>📁 Folder Structure</h2>
        <p style={{ fontSize: '11px', color: '#666' }}>NIIT NF Repository</p>
      </div>
      <div className="folder-tree-container">
        {folders.map((folder) => (
          <div key={folder._id}>
            <div 
              className={`tree-item ${selectedFolderId === folder._id ? 'selected' : ''}`}
              onClick={() => {
                toggleFolder(folder._id);
                onFolderClick(folder._id);
              }}
            >
              <span>{expandedFolders[folder._id] ? '📂' : '📁'}</span> {folder.name}
            </div>
            {expandedFolders[folder._id] && folder.children && folder.children.length > 0 && (
              <div className="tree-item-children">
                {folder.children.map((child) => (
                  <div 
                    key={child._id} 
                    className={`tree-item ${selectedFolderId === child._id ? 'selected' : ''}`}
                    style={{ marginLeft: '20px' }}
                    onClick={() => onFolderClick(child._id)}
                  >
                    <span>📄</span> {child.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Dashboard View Component
function DashboardView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fileService.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await fetch(`http://localhost:5000/api/files/download/${file._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  if (loading) {
    return <div className="text-center mt-20">Loading statistics...</div>;
  }

  return (
    <div>
      <h2>📊 Dashboard</h2>
      <p className="subtle mb-20">Overview of your document repository</p>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Files</h3>
          <div className="value">{stats?.totalFiles || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Your Files</h3>
          <div className="value">{stats?.userFiles || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Total Folders</h3>
          <div className="value">{stats?.filesByFolder?.length || 0}</div>
        </div>
      </div>

      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ 
          padding: '24px 24px 16px',
          fontSize: '18px',
          fontWeight: '700',
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📄 Recent Files
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 100px 2fr 90px 120px 120px 100px 200px',
          padding: '18px 24px',
          background: 'linear-gradient(to right, #f8fafc, #eef2ff)',
          borderTop: '1px solid #e2e8f0',
          borderBottom: '2px solid #e2e8f0',
          fontWeight: '800',
          fontSize: '12px',
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          <div>Icon</div>
          <div>Ref #</div>
          <div>File Name</div>
          <div>Size</div>
          <div>Folder</div>
          <div>Uploaded By</div>
          <div>Date</div>
          <div>Actions</div>
        </div>
        {stats?.recentFiles?.length > 0 ? (
          stats.recentFiles.map((file) => (
            <div 
              key={file._id} 
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 100px 2fr 90px 120px 120px 100px 200px',
                padding: '18px 24px',
                borderBottom: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: '500',
                color: '#0f172a'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, rgba(99, 102, 241, 0.02) 0%, transparent 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ fontSize: '20px' }}>📄</div>
              <div><strong style={{ color: '#6366f1' }}>{file.referenceNumber}</strong></div>
              <div style={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>{file.originalName}</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>{file.sizeFormatted}</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>{file.folderId?.name}</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>{file.uploadedBy?.username}</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>{new Date(file.uploadDate).toLocaleDateString()}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setCurrentFile(file);
                    setShowViewModal(true);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
                  }}
                >
                  👁️ View
                </button>
                <button
                  onClick={() => handleDownload(file)}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.3)';
                  }}
                >
                  📥 Download
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📁</div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>No Files Yet</h3>
            <p style={{ fontSize: '14px' }}>Upload some files to see them here!</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && currentFile && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>📄 File Details</h3>
            </header>
            <main>
              <div className="form-group">
                <label>Reference Number</label>
                <div style={{ 
                  padding: '12px 16px', 
                  background: '#f1f5f9', 
                  borderRadius: '10px',
                  fontWeight: '600',
                  color: '#6366f1'
                }}>
                  {currentFile.referenceNumber}
                </div>
              </div>
              <div className="form-group">
                <label>File Name</label>
                <div style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '10px' }}>
                  {currentFile.originalName}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>File Type</label>
                  <div style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '10px' }}>
                    {currentFile.fileType}
                  </div>
                </div>
                <div className="form-group">
                  <label>File Size</label>
                  <div style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '10px' }}>
                    {currentFile.sizeFormatted}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Folder</label>
                <div style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '10px' }}>
                  {currentFile.folderId?.name}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Uploaded By</label>
                  <div style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '10px' }}>
                    {currentFile.uploadedBy?.username}
                  </div>
                </div>
                <div className="form-group">
                  <label>Upload Date</label>
                  <div style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '10px' }}>
                    {new Date(currentFile.uploadDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {currentFile.oneDrivePath && (
                <div className="form-group">
                  <label>OneDrive Path</label>
                  <div style={{ 
                    padding: '12px 16px', 
                    background: '#f1f5f9', 
                    borderRadius: '10px',
                    fontSize: '13px',
                    wordBreak: 'break-all'
                  }}>
                    {currentFile.oneDrivePath}
                  </div>
                </div>
              )}
            </main>
            <footer>
              <button
                className="btn"
                style={{ background: '#6B7280' }}
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
              <button 
                className="btn btn-success"
                onClick={() => handleDownload(currentFile)}
              >
                📥 Download File
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

// Files View Component
function FilesView({ selectedFolderId }) {
  const { user, isAdmin } = useAuth();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);

  useEffect(() => {
    loadFolders();
    loadFiles();
  }, []);

  // Auto-select folder when clicked from sidebar
  useEffect(() => {
    if (selectedFolderId) {
      setSelectedFolder(selectedFolderId);
      loadFiles(selectedFolderId);
    }
  }, [selectedFolderId]);

  const loadFolders = async () => {
    try {
      const response = await folderService.getAll();
      // Flatten folder structure for dropdown
      const flatFolders = [];
      response.data.folders.forEach(folder => {
        flatFolders.push(folder);
        if (folder.children) {
          folder.children.forEach(child => flatFolders.push(child));
        }
      });
      setFolders(flatFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const loadFiles = async (folderId = '') => {
    try {
      const params = folderId ? { folderId } : {};
      const response = await fileService.getAll(params);
      setFiles(response.data.files);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedFolder) {
      setMessage({ type: 'error', text: 'Please select a folder first' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', selectedFolder);

      await fileService.upload(formData);
      setMessage({ type: 'success', text: '✅ File uploaded successfully' });
      loadFiles(selectedFolder);
      e.target.value = '';
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Upload failed' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Delete this file?')) return;

    try {
      await fileService.delete(fileId);
      setMessage({ type: 'success', text: '✅ File deleted successfully' });
      loadFiles(selectedFolder);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Delete failed' 
      });
    }
  };

  const handleAnalyze = async (file) => {
    setAnalyzing(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fileService.analyze(file._id);
      
      // Show preview first - user can accept or reject
      setCurrentAnalysis({
        fileName: file.originalName,
        analysis: response.data.analysis,
        fileId: file._id,
        isPending: true // New flag for preview mode
      });
      setShowAnalysisModal(true);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'AI analysis failed' 
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcceptAnalysis = async () => {
    try {
      // Analysis already saved by backend, just refresh
      await loadFiles(selectedFolder);
      setShowAnalysisModal(false);
      setMessage({ type: 'success', text: '✅ AI Analysis saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save analysis' });
    }
  };

  const handleRejectAnalysis = () => {
    setShowAnalysisModal(false);
    setMessage({ type: 'info', text: 'AI Analysis discarded' });
  };

  const handleViewFile = (file) => {
    setCurrentFile(file);
    setShowViewModal(true);
  };

  const handleDownloadOriginal = async (fileId) => {
    try {
      await fileService.download(fileId);
      setMessage({ type: 'success', text: '📥 File downloaded' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Download failed' });
    }
  };

  const handleDownloadCombined = async (file) => {
    try {
      setMessage({ type: 'info', text: '📦 Preparing download package...' });
      
      // Import JSZip dynamically
      const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
      const zip = new JSZip();
      
      // 1. Download original file
      const token = localStorage.getItem('token');
      const fileResponse = await fetch(`http://localhost:5000/api/files/download/${file._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!fileResponse.ok) {
        throw new Error('Failed to fetch original file');
      }
      
      const fileBlob = await fileResponse.blob();
      
      // Add original file to ZIP
      zip.file(file.originalName, fileBlob);
      
      // 2. Create AI Analysis Report (if available)
      if (file.aiAnalysis) {
        const reportContent = `
═══════════════════════════════════════════════════════════
        NIIT FOUNDATION - AI DOCUMENT ANALYSIS REPORT
═══════════════════════════════════════════════════════════

File Information:
─────────────────────────────────────────────────────────
Reference Number: ${file.referenceNumber}
File Name:        ${file.originalName}
File Type:        ${file.type}
File Size:        ${file.sizeFormatted}
Folder Location:  ${file.folderPath}
Uploaded By:      ${file.uploadedByUsername}
Upload Date:      ${new Date(file.uploadDate).toLocaleString()}

AI Analysis:
─────────────────────────────────────────────────────────
Analyzed On:      ${new Date(file.aiAnalyzedAt).toLocaleString()}

${file.aiAnalysis}

═══════════════════════════════════════════════════════════
Generated by: NF Document Repository v7.0
Report Date: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════
        `.trim();
        
        // Add AI report to ZIP
        zip.file(`${file.referenceNumber}_AI_Analysis.txt`, reportContent);
      }
      
      // 3. Generate ZIP and download
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.referenceNumber}_Complete_Package.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ 
        type: 'success', 
        text: file.aiAnalysis 
          ? '📦 Downloaded: Original file + AI Analysis Report (ZIP)' 
          : '📥 Downloaded: Original file only (no AI analysis yet)'
      });
    } catch (error) {
      console.error('Download error:', error);
      setMessage({ type: 'error', text: 'Failed to create download package' });
    }
  };

  const handleDownload = async (fileId) => {
    try {
      await fileService.download(fileId);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Download failed. Please try again.' 
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-20">
        <div>
          <h2>📁 Files</h2>
          <p className="subtle">Upload and manage your documents</p>
        </div>
        <div className="flex gap-10">
          <select
            className="form-group"
            style={{ padding: '10px', marginBottom: 0 }}
            value={selectedFolder}
            onChange={(e) => {
              setSelectedFolder(e.target.value);
              loadFiles(e.target.value);
            }}
          >
            <option value="">All Folders</option>
            {folders.map(folder => (
              <option key={folder._id} value={folder._id}>
                {folder.path}
              </option>
            ))}
          </select>
          <label className="btn" style={{ marginBottom: 0, cursor: 'pointer' }}>
            {uploading ? 'Uploading...' : '📤 Upload File'}
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={uploading || !selectedFolder}
            />
          </label>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} mb-20`}>
          {message.text}
        </div>
      )}

      <div className="file-list">
        <div className="file-list-header">
          <div>Icon</div>
          <div>Ref #</div>
          <div>File Name</div>
          <div>Size</div>
          <div>Folder</div>
          <div>Uploaded By</div>
          <div>Date</div>
          <div>AI Status</div>
          <div>Actions</div>
        </div>
        {files.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            No files found. Upload a file to get started.
          </div>
        ) : (
          files.map((file) => (
            <div key={file._id} className="file-item">
              <div>📄</div>
              <div><strong>{file.referenceNumber}</strong></div>
              <div>{file.originalName}</div>
              <div>{file.sizeFormatted}</div>
              <div>{file.folderId?.name || 'N/A'}</div>
              <div>{file.uploadedByUsername || file.uploadedBy?.username || 'N/A'}</div>
              <div>{new Date(file.uploadDate).toLocaleDateString()}</div>
              <div>
                {file.aiAnalysis ? (
                  <span style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    ✨ Analyzed
                  </span>
                ) : (
                  <span style={{ color: '#999', fontSize: '12px' }}>Not analyzed</span>
                )}
              </div>
              <div className="flex gap-10" style={{ gap: '8px' }}>
                <button
                  className="btn btn-sm"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => handleViewFile(file)}
                  title="View file details"
                >
                  👁️ View
                </button>
                <button
                  className="btn btn-sm"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => handleDownloadCombined(file)}
                  title={file.aiAnalysis ? "Download original + AI report (ZIP)" : "Download original file"}
                >
                  {file.aiAnalysis ? '📦 Package' : '📥 Download'}
                </button>
                <button
                  className="btn btn-sm"
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '12px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                  }}
                  onClick={() => handleAnalyze(file)}
                  disabled={analyzing}
                  title="AI Analysis"
                >
                  🤖 AI
                </button>
                {/* Only admin can delete files */}
                {isAdmin && (
                  <button
                    className="btn btn-sm btn-danger"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => handleDelete(file._id)}
                    title="Delete file"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Analysis Modal */}
      {showAnalysisModal && currentAnalysis && (
        <div className="modal-overlay" onClick={() => setShowAnalysisModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>🤖 AI Analysis Results</h3>
              <p className="subtle">{currentAnalysis.fileName}</p>
            </header>
            <main>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                padding: '20px',
                borderRadius: '8px',
                border: '2px solid #667eea'
              }}>
                <h4 style={{ marginBottom: '15px', color: '#667eea' }}>📊 AI Observations:</h4>
                <div style={{ 
                  whiteSpace: 'pre-line', 
                  lineHeight: '1.8',
                  color: '#333',
                  background: 'white',
                  padding: '15px',
                  borderRadius: '6px'
                }}>
                  {currentAnalysis.analysis}
                </div>
              </div>
              
              {currentAnalysis.isPending && (
                <div style={{
                  marginTop: '15px',
                  padding: '15px',
                  background: '#d1ecf1',
                  borderRadius: '8px',
                  border: '1px solid #bee5eb',
                  color: '#0c5460'
                }}>
                  ℹ️ <strong>Review the analysis above.</strong> Accept to save it to the file record, or reject to discard.
                </div>
              )}
            </main>
            <footer style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {currentAnalysis.isPending ? (
                <>
                  <button
                    className="btn"
                    style={{ background: '#dc3545' }}
                    onClick={handleRejectAnalysis}
                  >
                    ❌ Reject
                  </button>
                  <button
                    className="btn"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    onClick={handleAcceptAnalysis}
                  >
                    ✅ Accept & Save
                  </button>
                </>
              ) : (
                <button
                  className="btn"
                  style={{ background: '#6B7280' }}
                  onClick={() => setShowAnalysisModal(false)}
                >
                  Close
                </button>
              )}
            </footer>
          </div>
        </div>
      )}

      {/* View File Modal */}
      {showViewModal && currentFile && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>📄 File Details</h3>
              <p className="subtle">{currentFile.originalName}</p>
            </header>
            <main style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gap: '15px' }}>
                <div>
                  <strong>Reference Number:</strong> {currentFile.referenceNumber}
                </div>
                <div>
                  <strong>File Name:</strong> {currentFile.originalName}
                </div>
                <div>
                  <strong>Size:</strong> {currentFile.sizeFormatted}
                </div>
                <div>
                  <strong>Type:</strong> {currentFile.type}
                </div>
                <div>
                  <strong>Folder:</strong> {currentFile.folderId?.name || 'N/A'}
                </div>
                <div>
                  <strong>Uploaded By:</strong> {currentFile.uploadedByUsername || currentFile.uploadedBy?.username || 'N/A'}
                </div>
                <div>
                  <strong>Upload Date:</strong> {new Date(currentFile.uploadDate).toLocaleString()}
                </div>
                <div>
                  <strong>OneDrive Path:</strong> 
                  <div style={{ 
                    background: '#f5f5f5', 
                    padding: '10px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginTop: '5px',
                    wordBreak: 'break-all'
                  }}>
                    {currentFile.oneDrivePath}
                  </div>
                </div>
                
                {/* AI Analysis Section */}
                {currentFile.aiAnalysis && (
                  <div style={{ 
                    marginTop: '10px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                    borderRadius: '12px',
                    border: '2px solid #667eea'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                      <h4 style={{ margin: 0, color: '#667eea', flex: 1 }}>🤖 AI Analysis</h4>
                      <span style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        ✨ Analyzed
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                      <strong>Analyzed on:</strong> {new Date(currentFile.aiAnalyzedAt).toLocaleString()}
                    </div>
                    <div style={{ 
                      whiteSpace: 'pre-line', 
                      lineHeight: '1.8',
                      color: '#333',
                      background: 'white',
                      padding: '15px',
                      borderRadius: '8px'
                    }}>
                      {currentFile.aiAnalysis}
                    </div>
                  </div>
                )}
                
                {!currentFile.aiAnalysis && (
                  <div style={{
                    marginTop: '10px',
                    padding: '15px',
                    background: '#fff3cd',
                    borderRadius: '8px',
                    border: '1px solid #ffc107',
                    color: '#856404'
                  }}>
                    ℹ️ No AI analysis available. Click the AI button to analyze this file.
                  </div>
                )}
              </div>
            </main>
            <footer style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                className="btn"
                style={{ background: '#6B7280' }}
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
              <button
                className="btn"
                onClick={() => handleDownloadOriginal(currentFile._id)}
                title="Download original file only"
              >
                📥 Original File
              </button>
              {currentFile.aiAnalysis && (
                <>
                  <button
                    className="btn"
                    style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                    onClick={async () => {
                      // Download AI Report only
                      const reportContent = `
═══════════════════════════════════════════════════════════
        NIIT FOUNDATION - AI DOCUMENT ANALYSIS REPORT
═══════════════════════════════════════════════════════════

File Information:
─────────────────────────────────────────────────────────
Reference Number: ${currentFile.referenceNumber}
File Name:        ${currentFile.originalName}
File Type:        ${currentFile.type}
File Size:        ${currentFile.sizeFormatted}
Folder Location:  ${currentFile.folderPath}
Uploaded By:      ${currentFile.uploadedByUsername}
Upload Date:      ${new Date(currentFile.uploadDate).toLocaleString()}

AI Analysis:
─────────────────────────────────────────────────────────
Analyzed On:      ${new Date(currentFile.aiAnalyzedAt).toLocaleString()}

${currentFile.aiAnalysis}

═══════════════════════════════════════════════════════════
Generated by: NF Document Repository v7.0
Report Date: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════
                      `.trim();
                      
                      const blob = new Blob([reportContent], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${currentFile.referenceNumber}_AI_Analysis.txt`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      setMessage({ type: 'success', text: '📊 AI Report downloaded' });
                    }}
                    title="Download AI analysis report only"
                  >
                    📊 AI Report
                  </button>
                  <button
                    className="btn"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    onClick={() => handleDownloadCombined(currentFile)}
                    title="Download complete package: Original file + AI report (ZIP)"
                  >
                    📦 Complete Package
                  </button>
                </>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

// Folders View Component (Admin Only)
function FoldersView() {
  const [folders, setFolders] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const response = await folderService.getAll();
      setFolders(response.data.folders);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const initializeFolders = async () => {
    if (!window.confirm('Initialize default folder structure? This can only be done once.')) return;

    try {
      await folderService.initialize();
      setMessage({ type: 'success', text: '✅ Folders initialized successfully' });
      loadFolders();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Initialization failed' 
      });
    }
  };

  const createFolder = async () => {
    const name = window.prompt('Enter folder name:');
    if (!name) return;

    try {
      await folderService.create({ name });
      setMessage({ type: 'success', text: '✅ Folder created successfully' });
      loadFolders();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Creation failed' 
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-20">
        <div>
          <h2>🗂️ Manage Folders</h2>
          <p className="subtle">Configure folder structure</p>
        </div>
        <div className="flex gap-10">
          <button className="btn" onClick={initializeFolders}>
            Initialize Default Structure
          </button>
          <button className="btn btn-success" onClick={createFolder}>
            ➕ Add Folder
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} mb-20`}>
          {message.text}
        </div>
      )}

      <div className="file-list">
        {folders.map((folder) => (
          <div key={folder._id}>
            <div className="file-item">
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>📁 {folder.name}</strong>
                {folder.children && folder.children.length > 0 && (
                  <span className="subtle"> ({folder.children.length} subfolders)</span>
                )}
              </div>
            </div>
            {folder.children && folder.children.map((child) => (
              <div key={child._id} className="file-item" style={{ paddingLeft: '60px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  📄 {child.name}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Users View Component (Admin Only)
function UsersView() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    username: '',
    password: '',
    designation: '',
    role: 'user',
    status: 'active'
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Generate random password
  const generateRandomPassword = () => {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '@#$%&*!';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setGeneratedPassword(password);
    setPasswordData({
      newPassword: password,
      confirmPassword: password
    });
    setShowNewPassword(true);
    setShowConfirmPassword(true);
    setMessage({ type: 'success', text: '✅ Random password generated! Copy it before saving.' });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: '📋 Password copied to clipboard!' });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userService.getAll();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (editUser) {
        await userService.update(editUser._id, formData);
        setMessage({ type: 'success', text: '✅ User updated successfully' });
      } else {
        await userService.create(formData);
        setMessage({ type: 'success', text: '✅ User created successfully' });
      }
      
      setShowModal(false);
      setEditUser(null);
      setFormData({ 
        name: '',
        surname: '',
        username: '', 
        password: '', 
        designation: '',
        role: 'user', 
        status: 'active' 
      });
      loadUsers();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Operation failed' 
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: '❌ Passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: '❌ Password must be at least 6 characters' });
      return;
    }

    try {
      await userService.update(passwordUser._id, { password: passwordData.newPassword });
      setMessage({ type: 'success', text: '✅ Password changed successfully' });
      setShowPasswordModal(false);
      setPasswordUser(null);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Password change failed' 
      });
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      await userService.delete(userId);
      setMessage({ type: 'success', text: '✅ User deleted successfully' });
      loadUsers();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Delete failed' 
      });
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditUser(user);
      setFormData({
        name: user.name || '',
        surname: user.surname || '',
        username: user.username,
        password: '',
        designation: user.designation || '',
        role: user.role,
        status: user.status
      });
    } else {
      setEditUser(null);
      setFormData({ 
        name: '',
        surname: '',
        username: '', 
        password: '', 
        designation: '',
        role: 'user', 
        status: 'active' 
      });
    }
    setShowModal(true);
  };

  const openPasswordModal = (user) => {
    setPasswordUser(user);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-20">
        <div>
          <h2>👥 User Management</h2>
          <p className="subtle">Manage system users and permissions</p>
        </div>
        <button className="btn btn-success" onClick={() => openModal()}>
          ➕ Create User
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} mb-20`}>
          {message.text}
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Designation</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td><strong>{user.name} {user.surname}</strong></td>
              <td>{user.username}</td>
              <td>{user.designation}</td>
              <td>{user.role.toUpperCase()}</td>
              <td>{user.status}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <div className="flex gap-10">
                  <button
                    className="btn btn-sm"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    onClick={() => openModal(user)}
                  >
                    ✏️ Modify
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                    onClick={() => openPasswordModal(user)}
                  >
                    🔑 Password
                  </button>
                  {user._id !== currentUser.id && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(user._id)}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* User Modal */}
      {showModal && (
        <div className="modal-overlay" key={editUser ? editUser._id : 'new-user'}>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <header>
              <h3>{editUser ? '✏️ Edit User' : '➕ Create New User'}</h3>
            </header>
            <main>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      placeholder="Enter first name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="form-group">
                    <label>Surname *</label>
                    <input
                      type="text"
                      placeholder="Enter surname"
                      value={formData.surname}
                      onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    placeholder="Enter username (min 3 characters)"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    minLength="3"
                    autoComplete="off"
                  />
                </div>
                
                <div className="form-group">
                  <label>Password {editUser && '(leave blank to keep current)'}</label>
                  <input
                    type="password"
                    placeholder="Enter password (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editUser}
                    minLength="6"
                    autoComplete="new-password"
                  />
                </div>
                
                <div className="form-group">
                  <label>Designation *</label>
                  <input
                    type="text"
                    placeholder="e.g., Manager, Accountant, HR Executive"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required
                    autoComplete="off"
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </form>
            </main>
            <footer>
              <button
                className="btn"
                style={{ background: '#6B7280' }}
                onClick={() => {
                  setShowModal(false);
                  setEditUser(null);
                  setFormData({ 
                    name: '',
                    surname: '',
                    username: '', 
                    password: '', 
                    designation: '',
                    role: 'user', 
                    status: 'active' 
                  });
                }}
              >
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleSubmit}>
                {editUser ? '✅ Update' : '➕ Create'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && passwordUser && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>🔑 Change Password</h3>
              <p className="subtle">User: <strong>{passwordUser.username}</strong> ({passwordUser.role.toUpperCase()})</p>
            </header>
            <main>
              {/* Random Password Generator */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                border: '2px dashed #667eea',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <span style={{ fontSize: '24px' }}>🎲</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#667eea', fontSize: '15px' }}>Quick Password Generator</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                      Generate a secure random password instantly
                    </p>
                  </div>
                </div>
                
                {generatedPassword && (
                  <div style={{
                    background: 'white',
                    padding: '12px 15px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '2px solid #667eea',
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#667eea',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <span>{generatedPassword}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedPassword)}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}
                      title="Copy to clipboard"
                    >
                      📋 Copy
                    </button>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>🎲</span>
                  <span>Generate Random Password</span>
                </button>
              </div>

              <div style={{
                textAlign: 'center',
                color: '#999',
                fontSize: '13px',
                margin: '15px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                <span>OR SET CUSTOM</span>
                <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
              </div>

              <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password (min 6 characters)"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength="6"
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '20px',
                        padding: '5px',
                        color: '#667eea'
                      }}
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      minLength="6"
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '20px',
                        padding: '5px',
                        color: '#667eea'
                      }}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                {passwordData.newPassword && passwordData.confirmPassword && (
                  <div style={{
                    padding: '12px 15px',
                    borderRadius: '8px',
                    marginTop: '15px',
                    background: passwordData.newPassword === passwordData.confirmPassword 
                      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' 
                      : 'linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%)',
                    border: `2px solid ${passwordData.newPassword === passwordData.confirmPassword ? '#667eea' : '#dc3545'}`,
                    color: passwordData.newPassword === passwordData.confirmPassword ? '#667eea' : '#dc3545',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {passwordData.newPassword === passwordData.confirmPassword 
                      ? <><span>✅</span><span>Passwords match - Ready to save!</span></> 
                      : <><span>❌</span><span>Passwords do not match</span></>}
                  </div>
                )}
              </form>
            </main>
            <footer>
              <button
                className="btn"
                style={{ background: '#6B7280' }}
                onClick={() => {
                  setShowPasswordModal(false);
                  setShowNewPassword(false);
                  setShowConfirmPassword(false);
                  setGeneratedPassword('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                onClick={handlePasswordChange}
                disabled={!passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword}
              >
                🔑 Change Password
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

// Settings View Component
function SettingsView() {
  const [message, setMessage] = useState({ type: '', text: '' });

  return (
    <div>
      <h2>⚙️ Settings</h2>
      <p className="subtle mb-20">Configure system preferences</p>

      {message.text && (
        <div className={`alert alert-${message.type} mb-20`}>
          {message.text}
        </div>
      )}

      <div className="file-list" style={{ padding: '25px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>📁 OneDrive Connection</h3>
        <p className="subtle mb-20">
          OneDrive folder path configured in server environment
        </p>
        
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px', fontFamily: 'monospace', fontSize: '12px' }}>
          <strong>Configured Path:</strong><br />
          C:\Users\rythe\OneDrive\NIIT NF
        </div>
      </div>

      <div className="file-list" style={{ padding: '25px' }}>
        <h3 style={{ marginBottom: '15px' }}>🤖 Microsoft Copilot AI</h3>
        <p className="subtle mb-20">
          AI-powered document analysis and smart categorization
        </p>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
          <input type="checkbox" defaultChecked />
          <span>Enable Microsoft Copilot for document analysis</span>
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input type="checkbox" defaultChecked />
          <span>Auto-sync files to OneDrive on upload</span>
        </label>
      </div>
    </div>
  );
}

export default App;