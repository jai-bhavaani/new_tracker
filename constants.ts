import { AppSection, NavItem, Quote } from './types';

export const APP_NAME = 'KorteX';
export const STORAGE_PREFIX = 'prodtrk_';

export const NAV_ITEMS: NavItem[] = [
  { id: AppSection.HOME, label: 'Home', iconClass: 'fa-solid fa-house' },
  { id: AppSection.TASKS, label: 'Tasks', iconClass: 'fa-solid fa-list-check' },
  { id: AppSection.HABITS, label: 'Habits', iconClass: 'fa-solid fa-seedling' },
  { id: AppSection.ANALYTICS, label: 'Analytics', iconClass: 'fa-solid fa-chart-line' },
  { id: AppSection.LEARNINGS, label: 'Learnings', iconClass: 'fa-solid fa-book-open' },
  { id: AppSection.CHAT, label: 'Chat', iconClass: 'fa-solid fa-comments' },
];

export const QUOTES: Quote[] = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" }
];

export const DEFAULT_STATS = {
  studyHours: 0,
  workoutMins: 0,
  waterLitres: 0,
  mindfulnessMins: 0,
  sleepHours: 0,
  distractionMins: 0,
  tasksCompleted: 0,
  streakDays: 0,
  lastUpdated: new Date().toISOString()
};