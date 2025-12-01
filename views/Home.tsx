
import React, { useEffect, useState } from 'react';
import { DailyStats, Quote, UserProfile, Task } from '../types';
import { StatCard } from '../components/StatCard';
import { storageService } from '../services/storageService';
import { QUOTES, DEFAULT_STATS } from '../constants';
import { ActivityModal } from '../components/ActivityModal';
import { aiService } from '../services/aiService';

interface HomeProps {
  showToast: (msg: string, type: 'success' | 'info' | 'xp' | 'error') => void;
}

export const Home: React.FC<HomeProps> = ({ showToast }) => {
  const [stats, setStats] = useState<DailyStats>(DEFAULT_STATS);
  const [quote, setQuote] = useState<Quote>(QUOTES[0]);
  const [userName, setUserName] = useState('User');
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  
  // Modals
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isSmartLogOpen, setIsSmartLogOpen] = useState(false);
  
  // Smart Log State
  const [smartLogInput, setSmartLogInput] = useState('');
  const [isProcessingLog, setIsProcessingLog] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Proactive Insight State
  const [insight, setInsight] = useState<string>('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  useEffect(() => {
    // Load Stats
    const savedStats = storageService.read<DailyStats>('stats', DEFAULT_STATS);
    setStats(savedStats);

    // Load User
    const profile = storageService.read<UserProfile>('profile', { name: 'User', age: '', primaryGoal: '' });
    if (profile.name) setUserName(profile.name);

    // Load Random Quote
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(randomQuote);

    // Load Tasks for Pending Count
    const allTasks = storageService.read<Task[]>('tasks', []);
    const pending = allTasks.filter(t => !t.completed).length;
    setActiveTaskCount(pending);

    // Attempt to load cached insight or leave empty
    const savedInsight = storageService.read<string>('ai_insight', '');
    if (savedInsight) setInsight(savedInsight);
  }, []);

  const handleSaveActivity = (category: 'study' | 'workout' | 'wellness' | 'sleep' | 'distractions', data: any) => {
    let xpEarned = 0;
    const currentStats = storageService.read<DailyStats>('stats', DEFAULT_STATS);
    let updates: Partial<DailyStats> = {};
    let notificationType: 'success' | 'xp' | 'info' | 'error' = 'success';
    let notificationMsg = 'Activity logged successfully';

    if (category === 'study') {
      const { hours } = data;
      // Cap at 24 hours
      const newTotal = Math.min((currentStats.studyHours || 0) + hours, 24);
      updates = { studyHours: newTotal };
      xpEarned = Math.round(hours * 20);
      notificationType = 'xp';
      notificationMsg = `+${xpEarned} XP Activity Logged`;
    } 
    else if (category === 'workout') {
      const { mins } = data;
      updates = { workoutMins: (currentStats.workoutMins || 0) + mins };
      xpEarned = Math.round(mins / 5); // 1 XP per 5 mins roughly
      notificationType = 'xp';
      notificationMsg = `+${xpEarned} XP Activity Logged`;
    } 
    else if (category === 'wellness') {
      const { water, meditation } = data;
      updates = { 
        waterLitres: (currentStats.waterLitres || 0) + (water || 0),
        mindfulnessMins: (currentStats.mindfulnessMins || 0) + (meditation || 0)
      };
      if (water) xpEarned += 5;
      if (meditation) xpEarned += Math.round(meditation / 2);
      notificationType = 'xp';
      notificationMsg = `+${xpEarned} XP Activity Logged`;
    }
    else if (category === 'sleep') {
      const { hours } = data;
      const newTotal = (currentStats.sleepHours || 0) + hours;
      updates = { sleepHours: newTotal };
      xpEarned = Math.round(hours * 10);
      notificationType = 'xp';
      notificationMsg = `+${xpEarned} XP Activity Logged`;
    }
    else if (category === 'distractions') {
      const { mins } = data;
      updates = { distractionMins: (currentStats.distractionMins || 0) + mins };
      notificationType = 'info';
      notificationMsg = `Distraction Logged: ${mins} mins`;
    }

    // Update Aggregated Stats
    const newStats = storageService.updateDailyStats(updates);
    setStats(newStats);

    // Add XP
    if (xpEarned > 0) {
      storageService.addXP(xpEarned);
    }

    // Log detailed history
    storageService.logDailyActivity(category, data);

    // Show Notification
    showToast(notificationMsg, notificationType);
  };

  const handleVoiceInput = () => {
    if (isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      showToast("Voice input not supported in this browser.", 'error');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false; // Stop after one sentence for command-style input

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSmartLogInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error", event.error);
        setIsListening(false);
        showToast("Could not hear you. Please try again.", 'error');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error("Speech start failed", e);
      setIsListening(false);
      showToast("Microphone access error.", 'error');
    }
  };

  const handleSmartLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartLogInput.trim() || isProcessingLog) return;

    setIsProcessingLog(true);
    try {
      const parsedActivities = await aiService.parseActivityLog(smartLogInput);
      
      if (parsedActivities.length === 0) {
        showToast("Couldn't understand activity. Try 'Studied React for 2 hours' or 'Wasted 30 mins on tiktok'", 'error');
      } else {
        let count = 0;
        parsedActivities.forEach(item => {
          handleSaveActivity(item.category as any, item.data);
          count++;
        });
        showToast(`Logged ${count} activities via AI`, 'success');
        setIsSmartLogOpen(false);
        setSmartLogInput('');
      }
    } catch (error) {
      showToast('AI Error. Please try manual logging.', 'error');
    } finally {
      setIsProcessingLog(false);
    }
  };

  const generateInsight = async () => {
    setIsInsightLoading(true);
    try {
      const context = storageService.getAIContext();
      const newInsight = await aiService.generateProactiveInsight(context);
      setInsight(newInsight);
      storageService.write('ai_insight', newInsight);
    } catch (e) {
      showToast('Could not generate insight', 'error');
    } finally {
      setIsInsightLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-10">
      <ActivityModal 
        isOpen={isActivityModalOpen} 
        onClose={() => setIsActivityModalOpen(false)} 
        onSave={handleSaveActivity} 
      />

      {/* Smart Log Modal */}
      {isSmartLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 relative animate-slide-up shadow-2xl border border-glass-border">
            <button onClick={() => setIsSmartLogOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors">
              <i className="fa-solid fa-times text-xl"></i>
            </button>
            <h2 className="text-2xl font-black text-text-main mb-2 flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-accent-teal"></i> Smart Log
            </h2>
            <p className="text-xs text-text-muted mb-6 font-medium">Type naturally or speak to log activities.</p>
            
            <form onSubmit={handleSmartLogSubmit}>
              <div className="relative mb-4">
                <textarea
                  value={smartLogInput}
                  onChange={(e) => setSmartLogInput(e.target.value)}
                  rows={3}
                  placeholder="e.g., 'I ran for 30 mins and studied Math for 2 hours'"
                  className="w-full bg-glass-surface border border-glass-border rounded-2xl p-4 pr-12 text-text-main placeholder-text-muted focus:outline-none focus:border-accent-teal transition-all resize-none text-sm"
                  disabled={isProcessingLog || isListening}
                />
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  disabled={isProcessingLog || isListening}
                  className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                      : 'bg-glass-highlight text-text-muted hover:bg-accent-teal hover:text-dark-bg'
                  }`}
                  title="Speak to log"
                >
                  <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
                </button>
              </div>

              <button
                type="submit"
                disabled={isProcessingLog || !smartLogInput.trim()}
                className="w-full bg-accent-teal hover:bg-accent-hover text-dark-bg font-bold py-4 rounded-2xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
              >
                {isProcessingLog ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Processing...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i> Log with AI
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hero Welcome Section - Bolder Gradient */}
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 relative overflow-hidden shadow-2xl">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-teal opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 opacity-5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-1">Hello, {userName}</h2>
                <div className="h-1 w-12 bg-accent-teal rounded-full"></div>
             </div>
             <i className="fa-solid fa-quote-right text-4xl text-white/5"></i>
          </div>
          <p className="text-base text-gray-300 font-medium leading-relaxed italic pr-4">"{quote.text}"</p>
          <p className="text-xs font-bold text-accent-teal mt-3 uppercase tracking-widest opacity-80">— {quote.author}</p>
        </div>
      </div>

      {/* Proactive Insight Card */}
      <div className="glass-card p-5 rounded-3xl relative overflow-hidden border border-accent-teal/20 shadow-lg shadow-teal-500/5 group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-teal via-blue-500 to-purple-500"></div>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-2">
               <i className="fa-solid fa-chart-line text-accent-teal"></i>
               <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Weekly Insight</h3>
             </div>
             <p className="text-text-main text-sm font-medium leading-relaxed min-h-[40px]">
               {isInsightLoading ? (
                 <span className="flex items-center gap-2 text-text-muted">
                   <i className="fa-solid fa-circle-notch fa-spin"></i> Analyzing data trends...
                 </span>
               ) : (
                 insight || "Click the button to analyze your last 7 days."
               )}
             </p>
          </div>
          <button 
            onClick={generateInsight}
            disabled={isInsightLoading}
            className="w-10 h-10 rounded-xl bg-accent-teal/10 hover:bg-accent-teal/20 text-accent-teal flex items-center justify-center transition-all border border-accent-teal/20 active:scale-95 shadow-sm"
            title="Generate New Insight"
          >
             <i className={`fa-solid ${isInsightLoading ? 'fa-spinner fa-spin' : 'fa-bolt'}`}></i>
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-end mb-4 px-1">
          <h2 className="text-2xl font-black text-text-main tracking-tight">Today's Overview</h2>
          <button 
            onClick={() => setIsSmartLogOpen(true)}
            className="group flex items-center gap-2 px-4 py-2 bg-glass-surface hover:bg-glass-highlight border border-glass-border rounded-full transition-all active:scale-95"
          >
            <span className="text-xs font-bold text-accent-teal group-hover:text-text-main transition-colors uppercase tracking-wider">AI Log</span>
            <div className="w-6 h-6 rounded-full bg-accent-teal/20 flex items-center justify-center group-hover:bg-accent-teal group-hover:text-dark-bg transition-all">
              <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
            </div>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <StatCard 
            label="Study" 
            value={stats.studyHours.toFixed(1)} 
            unit="hours" 
            iconClass="fa-solid fa-brain"
            colorClass="text-purple-400"
          />
          <StatCard 
            label="Workout • Zen" 
            value={`${stats.workoutMins} / ${stats.mindfulnessMins}`} 
            unit="min" 
            iconClass="fa-solid fa-heart-pulse"
            colorClass="text-orange-400"
          />
          <StatCard 
            label="Tasks" 
            value={`${stats.tasksCompleted} / ${activeTaskCount}`} 
            unit="Done / Active" 
            iconClass="fa-solid fa-list-check"
            colorClass="text-emerald-400"
          />
           <StatCard 
            label="Sleep" 
            value={stats.sleepHours.toFixed(1)} 
            unit="hours" 
            iconClass="fa-solid fa-bed"
            colorClass="text-indigo-400"
          />
          <StatCard 
            label="Water" 
            value={stats.waterLitres.toFixed(1)} 
            unit="litres" 
            iconClass="fa-solid fa-glass-water"
            colorClass="text-blue-400"
          />
          <StatCard 
            label="Streak" 
            value={stats.streakDays} 
            unit="days" 
            iconClass="fa-solid fa-fire"
            colorClass="text-rose-500"
          />
           <StatCard 
            label="Wasted" 
            value={stats.distractionMins} 
            unit="min" 
            iconClass="fa-solid fa-ban"
            colorClass="text-red-500"
          />
          
          {/* Add Metric Card */}
          <div 
            onClick={() => setIsActivityModalOpen(true)}
            className="glass-card rounded-3xl p-5 flex flex-col items-center justify-center text-text-muted hover:text-text-main cursor-pointer border-dashed border-2 border-glass-border hover:border-accent-teal hover:bg-glass-highlight transition-all active:scale-95 col-span-1 min-h-[140px] group relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-accent-teal/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-14 h-14 rounded-2xl bg-glass-highlight flex items-center justify-center mb-3 group-hover:bg-accent-teal group-hover:text-dark-bg transition-all shadow-lg group-hover:shadow-teal-500/30 z-10">
              <i className="fa-solid fa-plus text-2xl text-text-muted group-hover:text-dark-bg transition-colors"></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-accent-teal z-10">Add Metric</span>
          </div>
        </div>
      </div>
    </div>
  );
};
