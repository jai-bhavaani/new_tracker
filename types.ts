

export enum AppSection {
  HOME = 'HOME',
  TASKS = 'TASKS',
  HABITS = 'HABITS',
  ANALYTICS = 'ANALYTICS',
  LEARNINGS = 'LEARNINGS',
  CHAT = 'CHAT'
}

export interface DailyStats {
  studyHours: number;
  workoutMins: number;
  waterLitres: number;
  mindfulnessMins: number;
  sleepHours: number;
  distractionMins: number;
  tasksCompleted: number;
  streakDays: number;
  lastUpdated: string; // ISO Date string
}

export interface Quote {
  text: string;
  author: string;
}

export interface NavItem {
  id: AppSection;
  label: string;
  iconClass: string;
}

export enum TaskPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export type TaskRepetition = 'None' | 'Daily' | 'Weekly' | 'Weekdays';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  category: string;
  completed: boolean;
  createdAt: string; // ISO Date string
  completedAt?: string; // ISO Date string
  repeating?: TaskRepetition;
  dueDate?: string; // YYYY-MM-DD
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: string;
  createdAt: string; // ISO Date string
  lastCompletedAt?: string; // ISO Date string
  currentStreak: number;
  longestStreak: number;
}


export type TargetPeriod = 'Weekly' | 'Monthly' | 'Yearly';

export interface Target {
  id: string;
  text: string;
  period: TargetPeriod;
  completed: boolean;
}

export interface LearningEntry {
  id: string;
  content: string;
  text?: string; // Legacy support for older backups
  tags: string[];
  createdAt: string; // ISO Date string
}

export interface UserProfile {
  name: string;
  age: number | '';
  primaryGoal: string;
  education?: string;
  detailedGoal?: string;
}

export interface ThemeConfig {
  mode: 'dark' | 'light';
  accentColor: string; // Hex code
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'xp' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

// Gamification
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface GamificationState {
  totalXP: number;
  unlockedAchievements: string[];
}