
import React, { useState, useEffect } from 'react';
import { AppSection, UserProfile } from '../types';
import { NAV_ITEMS, APP_NAME } from '../constants';
import { storageService } from '../services/storageService';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection: AppSection;
  onNavigate: (section: AppSection) => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ 
  isOpen, 
  onClose, 
  currentSection, 
  onNavigate,
  onProfileUpdate
}) => {
  const [education, setEducation] = useState('');
  const [detailedGoal, setDetailedGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const profile = storageService.read<UserProfile>('profile', { name: '', age: '', primaryGoal: '' });
      setEducation(profile.education || '');
      setDetailedGoal(profile.detailedGoal || '');
    }
  }, [isOpen]);

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Read current to preserve other fields
    const currentProfile = storageService.read<UserProfile>('profile', { name: 'User', age: '', primaryGoal: '' });
    const updatedProfile: UserProfile = {
      ...currentProfile,
      education,
      detailedGoal
    };

    // Save
    onProfileUpdate(updatedProfile);
    
    // Fake delay for UX
    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-dark-bg/80 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        ></div>
      )}

      {/* Drawer */}
      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-xs z-[70] glass-panel border-r border-white/10 transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-teal to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <i className="fa-solid fa-bolt text-white text-sm"></i>
            </div>
            <h1 className="text-xl font-black text-text-main">{APP_NAME}</h1>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
            <i className="fa-solid fa-times text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* Personal Detail Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-user-graduate text-accent-teal"></i> Personal Details
            </h3>
            <div className="glass-card p-4 rounded-xl border border-white/5 bg-white/5">
              <form onSubmit={handleSaveDetails} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1.5">Education / Status</label>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="e.g. B.Tech CS, Final Year"
                    className="w-full bg-dark-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:border-accent-teal focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1.5">Detailed Goal</label>
                  <textarea
                    value={detailedGoal}
                    onChange={(e) => setDetailedGoal(e.target.value)}
                    placeholder="e.g. I want to secure a placement in a top MNC like Google or Microsoft by end of year."
                    rows={4}
                    className="w-full bg-dark-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:border-accent-teal focus:outline-none transition-colors resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-accent-teal/10 hover:bg-accent-teal text-accent-teal hover:text-dark-bg border border-accent-teal/20 font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-save"></i>}
                  {isSaving ? 'Saving...' : 'Save Details'}
                </button>
              </form>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Menu</h3>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                  currentSection === item.id 
                    ? 'bg-accent-teal/10 text-text-main border border-accent-teal/20' 
                    : 'text-text-muted hover:text-text-main hover:bg-white/5'
                }`}
              >
                <div className={`w-6 flex justify-center ${currentSection === item.id ? 'text-accent-teal' : ''}`}>
                  <i className={item.iconClass}></i>
                </div>
                <span className="ml-3 text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 text-center">
           <p className="text-[10px] text-text-muted">v1.0.0 • KorteX</p>
        </div>
      </div>
    </>
  );
};
