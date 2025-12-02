import { STORAGE_PREFIX, DEFAULT_STATS } from '../constants';
import { DailyStats, Task, UserProfile, ThemeConfig, Target, LearningEntry, GamificationState } from '../types';

export const storageService = {
  /**
   * Reads a value from local storage with the application prefix.
   * @param key The suffix key to read (e.g. 'stats')
   * @param defaultValue The value to return if nothing is found
   */
  read: <T>(key: string, defaultValue: T): T => {
    try {
      const fullKey = `${STORAGE_PREFIX}${key}`;
      const item = localStorage.getItem(fullKey);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading key ${key} from storage:`, error);
      return defaultValue;
    }
  },

  /**
   * Writes a value to local storage with the application prefix.
   * @param key The suffix key to write
   * @param value The value to stringify and store
   */
  write: <T>(key: string, value: T): void => {
    try {
      const fullKey = `${STORAGE_PREFIX}${key}`;
      localStorage.setItem(fullKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing key ${key} to storage:`, error);
    }
  },

  /**
   * Returns today's date key (YYYY-MM-DD) using a local timezone reset hour.
   * Default resetHour = 2 (02:00 local time).
   */
  getTodayISO: (resetHour: number = 2): string => {
    const now = new Date();

    // Build today's reset time in local timezone at resetHour:00
    const resetToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), resetHour, 0, 0, 0);

    // If current time is before today's reset hour, use previous day
    const targetDate = now >= resetToday ? resetToday : new Date(resetToday.getTime() - 24 * 60 * 60 * 1000);

    // Return YYYY-MM-DD in local timezone
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  /**
   * Updates the daily stats object by merging provided updates.
   * Handles initialization if stats don't exist.
   * Automatically calculates Streak based on consecutive active days.
   */
  updateDailyStats: (updates: Partial<DailyStats>): DailyStats => {
    try {
      const currentStats = storageService.read<DailyStats>('stats', DEFAULT_STATS);

      // Use the same local date-key format (YYYY-MM-DD) with 02:00 reset
      const todayKey = storageService.getTodayISO(2);

      // Normalize lastUpdated to a YYYY-MM-DD local key (support legacy ISO)
      let lastDateStr = '';
      if (!currentStats.lastUpdated) {
        lastDateStr = '';
      } else if (currentStats.lastUpdated.includes('T')) {
        const d = new Date(currentStats.lastUpdated); // legacy ISO timestamp
        lastDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else {
        lastDateStr = currentStats.lastUpdated;
      }

      let streakDays = currentStats.streakDays || 0;

      if (lastDateStr !== todayKey) {
        // Compare using local midnight dates to get an integer day difference
        const lastDate = lastDateStr ? new Date(`${lastDateStr}T00:00:00`) : null;
        const todayDate = new Date(`${todayKey}T00:00:00`);
        const diffDays = lastDate ? Math.round((todayDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000)) : Infinity;

        if (diffDays === 1) {
          // consecutive day
          streakDays += 1;
        } else {
          // broken streak or first run
          streakDays = 1;
        }
      }

      const newStats = {
        ...currentStats,
        ...updates,
        streakDays,
        // store lastUpdated as the local date-key so comparisons are consistent
        lastUpdated: todayKey
      };

      storageService.write('stats', newStats);
      return newStats;
    } catch (error) {
      console.error('Error updating daily stats:', error);
      return DEFAULT_STATS;
    }
  },

  /**
   * Logs a specific activity to a date-keyed storage item.
   * e.g., prodtrk_study_2023-10-27
   */
  logDailyActivity: (category: string, data: any): void => {
    try {
      const today = storageService.getTodayISO();
      const key = `${category}_${today}`;
      const existingLogs = storageService.read<any>(key, []);
      const logsArray = Array.isArray(existingLogs) ? existingLogs : (existingLogs ? [existingLogs] : []);
      const newLog = { ...data, timestamp: new Date().toISOString() };
      storageService.write(key, [...logsArray, newLog]);
    } catch (error) {
      console.error('Error logging daily activity:', error);
    }
  },

  /**
   * Analytics: Get weekly aggregation
   */
  getWeeklyHistory: () => {
    const labels: string[] = [];
    const studyData: number[] = [];
    const tasksData: number[] = [];
    
    const allTasks = storageService.read<Task[]>('tasks', []);

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      labels.push(displayLabel);

      // 1. Fetch Study Hours for this date
      let studyLogs = storageService.read<any>(`study_${dateStr}`, []);
      if (!Array.isArray(studyLogs)) studyLogs = studyLogs ? [studyLogs] : [];

      const dailyStudyHours = studyLogs.reduce((acc: number, log: any) => acc + (log.hours || 0), 0);
      studyData.push(dailyStudyHours);

      // 2. Fetch Tasks completed on this date
      const dailyTasksDone = Array.isArray(allTasks) ? allTasks.filter(t => 
        t.completed && 
        t.completedAt && 
        t.completedAt.startsWith(dateStr)
      ).length : 0;
      tasksData.push(dailyTasksDone);
    }

    return { labels, studyData, tasksData };
  },

  /**
   * Analytics: Get Comprehensive Daily History
   * Returns an array of daily summaries for the last N days.
   */
  getDailyHistory: (days: number) => {
    const history = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      // Aggregate Study
      let studyLogs = storageService.read<any>(`study_${dateStr}`, []);
      if (!Array.isArray(studyLogs)) studyLogs = studyLogs ? [studyLogs] : [];
      const studyHours = studyLogs.reduce((acc: number, log: any) => acc + (log.hours || 0), 0);

      // Aggregate Workout
      let workoutLogs = storageService.read<any>(`workout_${dateStr}`, []);
      if (!Array.isArray(workoutLogs)) workoutLogs = workoutLogs ? [workoutLogs] : [];
      const workoutMins = workoutLogs.reduce((acc: number, log: any) => acc + (log.mins || 0), 0);

      // Aggregate Sleep
      let sleepLogs = storageService.read<any>(`sleep_${dateStr}`, []);
      if (!Array.isArray(sleepLogs)) sleepLogs = sleepLogs ? [sleepLogs] : [];
      const sleepHours = sleepLogs.reduce((acc: number, log: any) => acc + (log.hours || 0), 0);

      // Aggregate Distractions
      let distractionLogs = storageService.read<any>(`distractions_${dateStr}`, []);
      if (!Array.isArray(distractionLogs)) distractionLogs = distractionLogs ? [distractionLogs] : [];
      const distractionMins = distractionLogs.reduce((acc: number, log: any) => acc + (log.mins || 0), 0);

      // Aggregate Wellness (Mindfulness)
      let wellnessLogs = storageService.read<any>(`wellness_${dateStr}`, []);
      if (!Array.isArray(wellnessLogs)) wellnessLogs = wellnessLogs ? [wellnessLogs] : [];
      const mindfulnessMins = wellnessLogs.reduce((acc: number, log: any) => acc + (log.meditation || 0), 0);

      // Tasks
      const allTasks = storageService.read<Task[]>('tasks', []);
      const tasksCompleted = Array.isArray(allTasks) ? allTasks.filter(t => 
        t.completed && 
        t.completedAt && 
        t.completedAt.startsWith(dateStr)
      ).length : 0;

      history.push({
        date: dateStr,
        label: displayLabel,
        studyHours,
        workoutMins,
        sleepHours,
        distractionMins,
        mindfulnessMins,
        tasksCompleted
      });
    }

    return history;
  },

  /**
   * Analytics: Get Yearly History (Aggregated by Month)
   * Returns 12 data points (last 12 months)
   */
  getYearlyHistory: () => {
    // 1. Get raw daily data for 365 days
    const dailyData = storageService.getDailyHistory(365);
    
    // 2. Buckets for 12 months
    const monthlyBuckets: Record<string, any> = {};
    const monthOrder: string[] = [];

    dailyData.forEach(day => {
      const dateObj = new Date(day.date);
      const monthKey = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); // e.g., "Oct 23"
      
      if (!monthlyBuckets[monthKey]) {
        monthlyBuckets[monthKey] = {
          label: monthKey,
          studyHours: 0,
          workoutMins: 0,
          sleepHours: 0,
          distractionMins: 0,
          mindfulnessMins: 0,
          tasksCompleted: 0,
          count: 0
        };
        monthOrder.push(monthKey);
      }

      const bucket = monthlyBuckets[monthKey];
      bucket.studyHours += day.studyHours;
      bucket.workoutMins += day.workoutMins;
      bucket.sleepHours += day.sleepHours;
      bucket.distractionMins += day.distractionMins;
      bucket.mindfulnessMins += day.mindfulnessMins;
      bucket.tasksCompleted += day.tasksCompleted;
      bucket.count += 1;
    });

    return monthOrder.map(key => monthlyBuckets[key]);
  },

  /**
   * Analytics: Get Activity Heatmap Data
   * Returns array of { date, count, level } for the last N days (default 365)
   */
  getActivityHeatmap: (days: number = 365) => {
    const data = [];
    const allTasks = storageService.read<Task[]>('tasks', []);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      let score = 0;

      // 1. Study Sessions
      let studyLogs = storageService.read<any>(`study_${dateStr}`, []);
      if (!Array.isArray(studyLogs)) studyLogs = studyLogs ? [studyLogs] : [];
      score += studyLogs.length;

      // 2. Workouts
      let workoutLogs = storageService.read<any>(`workout_${dateStr}`, []);
      if (!Array.isArray(workoutLogs)) workoutLogs = workoutLogs ? [workoutLogs] : [];
      score += workoutLogs.length;

      // 3. Wellness (Meditation/Water)
      let wellnessLogs = storageService.read<any>(`wellness_${dateStr}`, []);
      if (!Array.isArray(wellnessLogs)) wellnessLogs = wellnessLogs ? [wellnessLogs] : [];
      score += wellnessLogs.filter((w: any) => (w.meditation || 0) > 0 || (w.water || 0) > 0).length;

      // 4. Tasks Completed
      const tasksDone = Array.isArray(allTasks) ? allTasks.filter(t => 
        t.completed && t.completedAt && t.completedAt.startsWith(dateStr)
      ).length : 0;
      score += tasksDone;

      let level = 0;
      if (score === 0) level = 0;
      else if (score <= 2) level = 1;
      else if (score <= 4) level = 2;
      else if (score <= 6) level = 3;
      else level = 4;

      data.push({ date: dateStr, count: score, level });
    }
    return data;
  },

  /**
   * Analytics: Get Study Topic Distribution
   * @param days Number of days to look back
   */
  getStudyTopicDistribution: (days: number = 7) => {
    const topicMap: Record<string, number> = {};
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      let studyLogs = storageService.read<any>(`study_${dateStr}`, []);
      if (!Array.isArray(studyLogs)) studyLogs = studyLogs ? [studyLogs] : [];
      
      studyLogs.forEach((log: any) => {
        if (log.topic) {
          topicMap[log.topic] = (topicMap[log.topic] || 0) + (log.hours || 0);
        }
      });
    }

    return {
      labels: Object.keys(topicMap),
      data: Object.values(topicMap)
    };
  },

  /**
   * Analytics: Get Distraction Distribution
   * @param days Number of days to look back
   */
  getDistractionDistribution: (days: number = 7) => {
    const distMap: Record<string, number> = {};
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      let logs = storageService.read<any>(`distractions_${dateStr}`, []);
      if (!Array.isArray(logs)) logs = logs ? [logs] : [];
      
      logs.forEach((log: any) => {
        if (log.name) {
          distMap[log.name] = (distMap[log.name] || 0) + (log.mins || 0);
        }
      });
    }

    return {
      labels: Object.keys(distMap),
      data: Object.values(distMap)
    };
  },

  saveProfile: (profile: UserProfile) => {
    storageService.write('profile', profile);
  },

  saveTheme: (theme: ThemeConfig) => {
    storageService.write('theme', theme);
  },

  addXP: (amount: number) => {
    const gameState = storageService.read<GamificationState>('gamification', { totalXP: 0, unlockedAchievements: [] });
    const newState = {
      ...gameState,
      totalXP: gameState.totalXP + amount
    };
    storageService.write('gamification', newState);
    return newState.totalXP;
  },

  getGamificationState: (): GamificationState => {
    return storageService.read<GamificationState>('gamification', { totalXP: 0, unlockedAchievements: [] });
  },

  getAIContext: () => {
    const profile = storageService.read<UserProfile>('profile', { name: 'User', age: '', primaryGoal: '' });
    const stats = storageService.read<DailyStats>('stats', DEFAULT_STATS);
    const tasks = storageService.read<Task[]>('tasks', []);
    const gamification = storageService.read<GamificationState>('gamification', { totalXP: 0, unlockedAchievements: [] });
    
    const activeTasks = Array.isArray(tasks) ? tasks.filter(t => !t.completed) : [];
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const completedTasksRecent = Array.isArray(tasks) ? tasks.filter(t => 
      t.completed && t.completedAt && new Date(t.completedAt) >= oneWeekAgo
    ) : [];

    const targets = storageService.read<Target[]>('targets', []);
    
    // Get learnings safely handling potential legacy structure
    const learningsRaw = storageService.read<any[]>('learnings', []);
    const recentLearnings = Array.isArray(learningsRaw) 
        ? learningsRaw.slice(0, 5).map(l => l.content || l.text || '') 
        : [];

    const weeklyHistory = storageService.getDailyHistory(7);

    const detailedHistory: Record<string, any> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      let study = storageService.read<any>(`study_${dateStr}`, []);
      if (!Array.isArray(study)) study = study ? [study] : [];

      let workout = storageService.read<any>(`workout_${dateStr}`, []);
      if (!Array.isArray(workout)) workout = workout ? [workout] : [];

      let distractions = storageService.read<any>(`distractions_${dateStr}`, []);
      if (!Array.isArray(distractions)) distractions = distractions ? [distractions] : [];

      if (study.length > 0 || workout.length > 0 || distractions.length > 0) {
        detailedHistory[dateStr] = {
          study: study.map((s: any) => `${s.topic} (${s.hours}h)`),
          workout: workout.map((w: any) => `${w.type} (${w.mins}m)`),
          distractions: distractions.map((d: any) => `${d.name} (${d.mins}m)`)
        };
      }
    }

    return {
      userProfile: {
        name: profile.name,
        primaryGoal: profile.primaryGoal,
        detailedGoal: profile.detailedGoal || 'None',
        education: profile.education || 'None',
      },
      gamification: {
        level: Math.floor(Math.sqrt(gamification.totalXP / 50)) + 1,
        xp: gamification.totalXP,
        achievements: gamification.unlockedAchievements
      },
      currentStats: stats,
      tasks: {
        active: activeTasks.map(t => ({ title: t.title, priority: t.priority, category: t.category })),
        recentlyCompleted: completedTasksRecent.map(t => ({ title: t.title, category: t.category, completedAt: t.completedAt }))
      },
      targets: Array.isArray(targets) ? targets.map(t => ({ text: t.text, period: t.period, completed: t.completed })) : [],
      recentLearnings,
      detailedActivityLog: detailedHistory,
      weeklyAggregates: weeklyHistory
    };
  },

  createBackup: (): string => {
    const backup: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        backup[key] = localStorage.getItem(key);
      }
    }
    return JSON.stringify(backup, null, 2);
  },

  restoreBackup: (jsonString: string): boolean => {
    try {
      const backup = JSON.parse(jsonString);
      let count = 0;
      Object.keys(backup).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          let value = backup[key];
          
          // --- MIGRATION LOGIC ---
          // Fix legacy learning entries (text -> content) before saving
          if (key === `${STORAGE_PREFIX}learnings`) {
            let rawData = value;
            // If value is string, parse it first
            if (typeof value === 'string') {
                try { rawData = JSON.parse(value); } catch(e) {}
            }
            
            if (Array.isArray(rawData)) {
                const migratedData = rawData.map((entry: any) => ({
                    ...entry,
                    content: entry.content || entry.text || '', // Rename text to content
                    tags: Array.isArray(entry.tags) ? entry.tags : [] // Ensure tags array
                }));
                // Update value to the migrated object
                value = migratedData;
            }
          }
          // -----------------------

          // Ensure value is stringified before saving to localStorage
          if (typeof value !== 'string') {
            value = JSON.stringify(value);
          }
          
          localStorage.setItem(key, value);
          count++;
        }
      });
      return count > 0;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
    }
  },

  exportCSV: (): void => {
    let csvContent = "data:text/csv;charset=utf-8,Date,Type,Details,Value,Unit\n";
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        // Check for activity logs
        const parts = key.replace(STORAGE_PREFIX, '').split('_');
        if (parts.length === 2 && ['study', 'workout', 'wellness', 'sleep', 'distractions'].includes(parts[0])) {
          const category = parts[0];
          const date = parts[1];
          try {
            let logs = JSON.parse(localStorage.getItem(key) || '[]');
            if (!Array.isArray(logs)) logs = logs ? [logs] : [];
            
            logs.forEach((log: any) => {
              let details = '';
              let value = '';
              let unit = '';

              if (category === 'study') {
                details = log.topic || 'General';
                value = log.hours;
                unit = 'hours';
              } else if (category === 'workout') {
                details = log.type || 'Exercise';
                value = log.mins;
                unit = 'mins';
              } else if (category === 'wellness') {
                if (log.water) {
                  csvContent += `${date},${category},Water,${log.water},litres\n`;
                }
                if (log.meditation) {
                  details = 'Meditation';
                  value = log.meditation;
                  unit = 'mins';
                }
              } else if (category === 'sleep') {
                details = (log.startTime && log.endTime) ? `${log.startTime} to ${log.endTime}` : 'Sleep Log';
                value = log.hours;
                unit = 'hours';
              } else if (category === 'distractions') {
                details = log.name || 'Unknown';
                value = log.mins;
                unit = 'mins';
              }

              if (value && category !== 'wellness') {
                csvContent += `${date},${category},${details},${value},${unit}\n`;
              } else if (value && category === 'wellness' && details === 'Meditation') {
                 csvContent += `${date},${category},${details},${value},${unit}\n`;
              }
            });
          } catch (e) {
            // ignore bad JSON
          }
        }
        
        // Export Tasks, Targets, Learnings, Profile separately or appended?
        // For simplicty, adding a section for global data
        if (key === `${STORAGE_PREFIX}tasks`) {
             const tasks = JSON.parse(localStorage.getItem(key) || '[]');
             tasks.forEach((t: any) => {
                 csvContent += `${t.createdAt.split('T')[0]},Task,${t.title} (${t.status}),${t.priority},priority\n`;
             });
        }
      }
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kortex_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
