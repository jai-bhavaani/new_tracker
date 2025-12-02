import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ThemeConfig } from '../types';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile) => void;
  onThemeChange: (theme: ThemeConfig) => void;
  currentTheme: ThemeConfig;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  onSaveProfile, 
  onThemeChange,
  currentTheme 
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [education, setEducation] = useState('');
  const [detailedGoal, setDetailedGoal] = useState('');
  
  // Theme State local
  const [mode, setMode] = useState<'dark' | 'light'>(currentTheme.mode);
  const [accent, setAccent] = useState(currentTheme.accentColor);
  
  // API Key State
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

  // Notification State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'not_set'>(notificationService.getPermissionStatus());

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const profile = storageService.read<UserProfile>('profile', { name: '', age: '', primaryGoal: '' });
    setName(profile.name);
    setAge(profile.age);
    setPrimaryGoal(profile.primaryGoal);
    setEducation(profile.education || '');
    setDetailedGoal(profile.detailedGoal || '');
    
    setMode(currentTheme.mode);
    setAccent(currentTheme.accentColor);
    
    // Load custom API key
    setApiKey(storageService.read<string>('gemini_api_key', ''));

    // Update notification permission state on open
    setNotificationPermission(notificationService.getPermissionStatus());
  }, [isOpen, currentTheme]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profile: UserProfile = { name, age, primaryGoal, education, detailedGoal };
    
    // Save all settings
    onSaveProfile(profile);
    onThemeChange({ mode, accentColor: accent });
    storageService.write('gemini_api_key', apiKey);
    
    onClose();
  };

  const handleRequestNotification = async () => {
    const permission = await notificationService.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      notificationService.scheduleReminders();
    }
  };

  const handleBackup = () => {
    const backupData = storageService.createBackup();
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kortex_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (content) {
          const success = storageService.restoreBackup(content);
          if (success) {
            alert("Backup restored! Reloading app...");
            window.location.reload();
          } else {
            alert("Failed to restore backup. No valid data found in file.");
          }
        }
      };
      reader.readAsText(file);
    }
    // Reset the input so the same file can be selected again if needed
    if (e.target) {
        e.target.value = '';
    }
  };

  const colors = [
    { name: 'Teal', hex: '#2dd4bf' },
    { name: 'Blue', hex: '#60a5fa' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Orange', hex: '#fb923c' },
    { name: 'Rose', hex: '#fb7185' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative animate-slide-up shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar border border-glass-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors">
          <i className="fa-solid fa-times text-xl"></i>
        </button>

        <h2 className="text-xl font-bold text-text-main mb-6">Profile & Settings</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest border-b border-glass-border pb-2">User Details</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-glass-surface border border-glass-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-accent-teal transition-all"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || '')}
                  className="w-full bg-glass-surface border border-glass-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-accent-teal transition-all"
                  placeholder="25"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Education</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full bg-glass-surface border border-glass-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-accent-teal transition-all"
                placeholder="e.g. B.Tech Computer Science"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Primary Goal (Short)</label>
              <input
                type="text"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                className="w-full bg-glass-surface border border-glass-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-accent-teal transition-all"
                placeholder="e.g. Master React Native"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Detailed Goal</label>
              <textarea
                value={detailedGoal}
                onChange={(e) => setDetailedGoal(e.target.value)}
                rows={3}
                className="w-full bg-glass-surface border border-glass-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-accent-teal transition-all resize-none"
                placeholder="e.g. I want to secure a placement in a top MNC like Google or Microsoft by the end of the year."
              />
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest border-b border-glass-border pb-2">Notifications</h3>
            <div className="flex items-center justify-between p-3 bg-glass-surface rounded-lg">
              <div>
                <p className="text-sm font-medium text-text-main">Reminder Notifications</p>
                <p className="text-xs text-text-muted">Status: 
                  <span className={`font-bold ${
                    notificationPermission === 'granted' ? 'text-green-400' :
                    notificationPermission === 'denied' ? 'text-red-400' :
                    'text-orange-400'
                  }`}>
                    {notificationPermission === 'not_set' ? ' Not Enabled' : ` ${notificationPermission.charAt(0).toUpperCase() + notificationPermission.slice(1)}`}
                  </span>
                </p>
              </div>
              {notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestNotification}
                  className="bg-accent-teal hover:bg-accent-hover text-dark-bg font-bold py-2 px-4 rounded-lg text-xs transition-all"
                  disabled={notificationPermission === 'denied'}
                >
                  {notificationPermission === 'denied' ? 'Permission Denied' : 'Enable'}
                </button>
              )}
            </div>
          </div>

          {/* API Configuration */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest border-b border-glass-border pb-2">API Configuration</h3>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Custom Gemini API Key (Optional)</label>
              <div className="relative">
                <input
                  type={isApiKeyVisible ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-glass-surface border border-glass-border rounded-lg px-3 py-2 pr-10 text-text-main focus:outline-none focus:border-accent-teal transition-all"
                  placeholder="AIzaSy..."
                />
                <button
                  type="button"
                  onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                  className="absolute right-3 top-2.5 text-text-muted hover:text-text-main transition-colors"
                >
                  <i className={`fa-solid ${isApiKeyVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                Leave empty to use the system default key. Your key is stored locally.
              </p>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest border-b border-glass-border pb-2">Appearance</h3>
            
            <div>
              <span className="block text-sm text-text-main mb-3">Accent Color</span>
              <div className="flex gap-3">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setAccent(c.hex)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${accent === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

           {/* Data Management */}
           <div className="space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest border-b border-glass-border pb-2">Data Management</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={storageService.exportCSV}
                className="bg-glass-surface hover:bg-glass-highlight border border-glass-border text-text-main py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-file-csv text-accent-teal"></i> Export CSV
              </button>
              <button
                type="button"
                onClick={handleBackup}
                className="bg-glass-surface hover:bg-glass-highlight border border-glass-border text-text-main py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-download text-blue-400"></i> Backup JSON
              </button>
              <button
                type="button"
                onClick={handleRestoreClick}
                className="col-span-2 bg-glass-surface hover:bg-glass-highlight border border-glass-border text-text-main py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-upload text-purple-400"></i> Restore from Backup
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-accent-teal hover:bg-accent-hover text-dark-bg font-bold py-3 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};
