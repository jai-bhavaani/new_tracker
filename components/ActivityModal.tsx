
import React, { useState, useEffect } from 'react';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: 'study' | 'workout' | 'wellness' | 'sleep' | 'distractions', data: any) => void;
}

type TabType = 'study' | 'workout' | 'wellness' | 'sleep' | 'distractions';

export const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<TabType>('study');
  
  // Form States
  const [studyHours, setStudyHours] = useState('');
  const [studyTopic, setStudyTopic] = useState('');
  
  const [workoutMins, setWorkoutMins] = useState('');
  const [workoutType, setWorkoutType] = useState('Gym');
  
  const [waterLitres, setWaterLitres] = useState('');
  const [meditationMins, setMeditationMins] = useState('');

  // Sleep States
  const [sleepStart, setSleepStart] = useState('');
  const [sleepEnd, setSleepEnd] = useState('');
  const [sleepHours, setSleepHours] = useState('');

  // Distraction States
  const [distName, setDistName] = useState('');
  const [distMins, setDistMins] = useState('');

  useEffect(() => {
    // Auto-calculate sleep duration if start and end are provided
    if (sleepStart && sleepEnd) {
      const [startH, startM] = sleepStart.split(':').map(Number);
      const [endH, endM] = sleepEnd.split(':').map(Number);
      
      let start = startH + startM / 60;
      let end = endH + endM / 60;

      // Handle crossing midnight (e.g. 23:00 to 07:00)
      if (end < start) {
        end += 24;
      }

      const duration = end - start;
      setSleepHours(duration.toFixed(1));
    }
  }, [sleepStart, sleepEnd]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let data = {};
    
    if (activeTab === 'study') {
      const hours = parseFloat(studyHours);
      if (isNaN(hours) || hours <= 0) return;
      data = { hours, topic: studyTopic };
    } 
    else if (activeTab === 'workout') {
      const mins = parseInt(workoutMins);
      if (isNaN(mins) || mins <= 0) return;
      data = { mins, type: workoutType };
    } 
    else if (activeTab === 'wellness') {
      const water = parseFloat(waterLitres) || 0;
      const meditation = parseInt(meditationMins) || 0;
      if (water === 0 && meditation === 0) return;
      data = { water, meditation };
    }
    else if (activeTab === 'sleep') {
      const hours = parseFloat(sleepHours);
      if (isNaN(hours) || hours <= 0) return;
      data = { hours, startTime: sleepStart, endTime: sleepEnd };
    }
    else if (activeTab === 'distractions') {
      const mins = parseInt(distMins);
      if (isNaN(mins) || mins <= 0) return;
      data = { mins, name: distName };
    }

    onSave(activeTab, data);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setStudyHours('');
    setStudyTopic('');
    setWorkoutMins('');
    setWaterLitres('');
    setMeditationMins('');
    setSleepStart('');
    setSleepEnd('');
    setSleepHours('');
    setDistName('');
    setDistMins('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative animate-slide-up shadow-2xl border border-glass-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors">
          <i className="fa-solid fa-times text-xl"></i>
        </button>

        <h2 className="text-xl font-bold text-text-main mb-6">Log Activity</h2>

        {/* Tabs */}
        <div className="flex p-1 bg-glass-surface rounded-xl mb-6 backdrop-blur-sm border border-glass-border overflow-x-auto custom-scrollbar">
          {(['study', 'workout', 'wellness', 'sleep', 'distractions'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[70px] py-2 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap px-2 ${
                activeTab === tab 
                  ? (tab === 'distractions' ? 'bg-red-500/20 text-red-400 shadow-sm border border-red-500/30' : 'bg-glass-highlight text-text-main shadow-sm border border-glass-border') 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {tab === 'distractions' ? 'Distraction' : tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {activeTab === 'study' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Duration (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  max="24"
                  value={studyHours}
                  onChange={(e) => setStudyHours(e.target.value)}
                  placeholder="e.g. 2.5"
                  className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:border-accent-teal transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Topic / Subject</label>
                <input
                  type="text"
                  value={studyTopic}
                  onChange={(e) => setStudyTopic(e.target.value)}
                  placeholder="e.g. React Native"
                  className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:border-accent-teal transition-all"
                  required
                />
              </div>
            </div>
          )}

          {activeTab === 'workout' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Duration (Minutes)</label>
                <input
                  type="number"
                  value={workoutMins}
                  onChange={(e) => setWorkoutMins(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:border-accent-teal transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Activity Type</label>
                <select
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                  className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-accent-teal transition-all appearance-none"
                >
                  <option value="Gym">Gym</option>
                  <option value="Running">Running</option>
                  <option value="Cycling">Cycling</option>
                  <option value="Yoga">Yoga</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'wellness' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Water Intake (Litres)</label>
                <input
                  type="number"
                  step="0.1"
                  value={waterLitres}
                  onChange={(e) => setWaterLitres(e.target.value)}
                  placeholder="e.g. 0.5"
                  className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:border-accent-teal transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Meditation (Minutes)</label>
                <input
                  type="number"
                  value={meditationMins}
                  onChange={(e) => setMeditationMins(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:border-accent-teal transition-all"
                />
              </div>
            </div>
          )}

          {activeTab === 'sleep' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Bedtime</label>
                  <input
                    type="time"
                    value={sleepStart}
                    onChange={(e) => setSleepStart(e.target.value)}
                    className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-accent-teal transition-all color-scheme-dark"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Wake Up</label>
                  <input
                    type="time"
                    value={sleepEnd}
                    onChange={(e) => setSleepEnd(e.target.value)}
                    className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-accent-teal transition-all color-scheme-dark"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Total Duration (Hours)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    placeholder="Auto-calculated..."
                    className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:border-accent-teal transition-all"
                    required
                  />
                   <div className="absolute right-3 top-3.5 text-xs text-accent-teal pointer-events-none">
                     {sleepHours ? 'hrs' : ''}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'distractions' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Source of Distraction</label>
                <input
                  type="text"
                  value={distName}
                  onChange={(e) => setDistName(e.target.value)}
                  placeholder="e.g. Instagram, Video Games"
                  className="w-full bg-glass-surface border border-red-500/30 rounded-lg px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:border-red-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Duration (Minutes)</label>
                <input
                  type="number"
                  value={distMins}
                  onChange={(e) => setDistMins(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full bg-glass-surface border border-red-500/30 rounded-lg px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:border-red-500 transition-all"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className={`w-full mt-2 font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95 ${
              activeTab === 'distractions' 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
                : 'bg-accent-teal hover:bg-accent-hover text-dark-bg shadow-teal-500/20'
            }`}
          >
            {activeTab === 'distractions' ? 'Log Distraction' : 'Log Activity'}
          </button>
        </form>
      </div>
    </div>
  );
};
