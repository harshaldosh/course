import React, { useState } from 'react';
import { useTodos } from '../context/TodoContext';
import { useTheme } from '../context/ThemeContext';
import { Download, Upload } from 'lucide-react';
import './Settings.css';

const Settings: React.FC = () => {
  const { todos } = useTodos();
  const { theme, toggleTheme } = useTheme();
  const [backupStatus, setBackupStatus] = useState('');
  
  const handleBackup = () => {
    const backupData = JSON.stringify(todos);
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    setBackupStatus('Backup created successfully!');
    
    setTimeout(() => {
      setBackupStatus('');
    }, 3000);
  };
  
  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        // In a real app, you would restore the data here
        console.log('Restore data:', parsedData);
      } catch (error) {
        console.error('Failed to restore data:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset the input to allow selecting the same file again
    event.target.value = '';
  };
  
  return (
    <div className="settings-page fade-in">
      <div className="settings-header">
        <h1 className="page-heading">Settings</h1>
        <p className="subtitle">Configure your preferences and manage your data</p>
      </div>
      
      <div className="settings-grid">
        <div className="settings-section">
          <h2 className="section-title">Appearance</h2>
          <div className="settings-card">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Theme</h3>
                <p>Switch between light and dark mode</p>
              </div>
              <div className="setting-control">
                <button 
                  className={`theme-button ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => theme === 'dark' && toggleTheme()}
                >
                  Light
                </button>
                <button 
                  className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => theme === 'light' && toggleTheme()}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h2 className="section-title">Backup & Restore</h2>
          <div className="settings-card">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Backup Tasks Data</h3>
                <p>Download all your tasks as a JSON file</p>
                {backupStatus && <p className="status-message success">{backupStatus}</p>}
              </div>
              <button className="button-with-icon" onClick={handleBackup}>
                <Download size={18} />
                <span>Backup Data</span>
              </button>
            </div>
            
            <div className="setting-divider"></div>
            
            <div className="setting-item">
              <div className="setting-info">
                <h3>Restore Tasks Data</h3>
                <p>Upload a backup file to restore your tasks</p>
              </div>
              <label className="button-with-icon">
                <Upload size={18} />
                <span>Upload Backup</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleRestore} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;