
import React, { useState, useEffect } from 'react';
import { AppSection, ThemeConfig, UserProfile, ToastMessage } from './types';
import { APP_NAME } from './constants';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { Home } from './views/Home';
import { Tasks } from './views/Tasks';
import { Analytics } from './views/Analytics';
import { Learnings } from './views/Learnings';
import { Chat } from './views/Chat';
import { ProfileModal } from './components/ProfileModal';
import { Toast } from './components/Toast';
import { MorningBriefingModal } from './components/MorningBriefingModal';
import { storageService } from './services/storageService';
import { aiService } from './services/aiService';

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.HOME);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<ThemeConfig>({ mode: 'dark', accentColor: '#2dd4bf' });

  // Global Toast State
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Morning Briefing State
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [briefingContent, setBriefingContent] = useState('');

  useEffect(() => {
    // Init Theme
    const savedTheme = storageService.read<ThemeConfig>('theme', { mode: 'dark', accentColor: '#2dd4bf' });
    applyTheme(savedTheme);
    setTheme(savedTheme);
  }, []);

  // Check for Morning Briefing on Load
  useEffect(() => {
    const checkMorningBriefing = async () => {
      const lastBriefingDate = storageService.read<string>('last_briefing_date', '');
      const today = storageService.getTodayISO();

      // If we haven't shown a briefing today
      if (lastBriefingDate !== today) {
        setIsBriefingOpen(true);
        setIsBriefingLoading(true);
        
        try {
          // 1. Gather Context
          const context = storageService.getAIContext();
          
          // 2. Generate Briefing
          const content = await aiService.generateMorningBriefing(context);
          setBriefingContent(content);
          
          // 3. Mark as shown today
          storageService.write('last_briefing_date', today);
        } catch (error) {
          console.error("Failed to load briefing", error);
          setBriefingContent("Good morning! Let's have a productive day.");
        } finally {
          setIsBriefingLoading(false);
        }
      }
    };

    // Small delay to allow app to stabilize/render first
    const timer = setTimeout(() => {
        checkMorningBriefing();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const applyTheme = (config: ThemeConfig) => {
    const root = document.documentElement;
    
    // Mode
    if (config.mode === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    
    // Accent Color
    root.style.setProperty('--accent-color', config.accentColor);
    root.style.setProperty('--accent-hover', config.accentColor); 
  };

  const handleThemeChange = (newTheme: ThemeConfig) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    storageService.saveTheme(newTheme);
  };

  const handleProfileSave = (profile: UserProfile) => {
    storageService.saveProfile(profile);
    showToast('Profile updated successfully', 'success');
  };

  const showToast = (message: string, type: 'success' | 'info' | 'xp' | 'error' = 'info') => {
    const newToast: ToastMessage = { id: crypto.randomUUID(), message, type };
    setToast(newToast);
  };

  const renderSection = () => {
    switch (currentSection) {
      case AppSection.HOME:
        return <Home showToast={showToast} />;
      case AppSection.TASKS:
        return <Tasks showToast={showToast} />;
      case AppSection.ANALYTICS:
        return <Analytics />;
      case AppSection.LEARNINGS:
        return <Learnings />;
      case AppSection.CHAT:
        return <Chat />;
      default:
        return <Home showToast={showToast} />;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-dark-bg text-text-main font-sans selection:bg-accent-teal selection:text-white transition-colors duration-300 flex flex-col md:flex-row">
      
      {/* Morning Briefing Overlay */}
      <MorningBriefingModal 
          isOpen={isBriefingOpen} 
          isLoading={isBriefingLoading} 
          content={briefingContent} 
          onClose={() => setIsBriefingOpen(false)} 
      />

      {/* Global Components */}
      <Toast toast={toast} onClose={() => setToast(null)} />
      
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onSaveProfile={handleProfileSave}
        onThemeChange={handleThemeChange}
        currentTheme={theme}
      />

      {/* Desktop Sidebar */}
      <Sidebar 
        currentSection={currentSection} 
        onNavigate={setCurrentSection} 
        className="hidden md:flex flex-shrink-0"
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        
        {/* Header - Mobile Optimized */}
        <header className="sticky top-0 z-40 bg-dark-bg/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center transition-all duration-300 md:bg-transparent md:backdrop-blur-none md:border-b-0 md:pt-6 md:pb-2">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-teal to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <i className="fa-solid fa-bolt text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-text-main leading-none">{APP_NAME}</h1>
              <span className="text-[10px] text-accent-teal font-bold uppercase tracking-widest">Dashboard</span>
            </div>
          </div>

          {/* Desktop Title / Breadcrumb (Visual only) */}
          <div className="hidden md:block">
            <h2 className="text-2xl font-bold text-text-main capitalize">{currentSection.toLowerCase()}</h2>
          </div>

          <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-white/10 transition-all relative">
              <i className="fa-regular fa-bell"></i>
              <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border border-dark-bg"></span>
            </button>
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-text-main hover:border-accent-teal transition-all shadow-lg"
            >
              <i className="fa-solid fa-user text-sm"></i>
            </button>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-32 md:pb-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full h-full">
            {renderSection()}
          </div>
        </main>

        {/* Mobile Navigation */}
        <BottomNav 
          currentSection={currentSection} 
          onNavigate={setCurrentSection} 
          className="md:hidden"
        />
      </div>
    </div>
  );
};

export default App;
