
import React from 'react';
import { Habit } from '../types';

interface HabitCardProps {
  habit: Habit;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onComplete, onDelete }) => {
  const isCompletedToday = () => {
    if (!habit.lastCompletedAt) return false;
    const today = new Date().toISOString().split('T')[0];
    const lastCompleted = habit.lastCompletedAt.split('T')[0];
    return today === lastCompleted;
  };

  const completed = isCompletedToday();

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'Health':
        return 'fa-heart-pulse';
      case 'Mindfulness':
        return 'fa-peace';
      case 'Productivity':
        return 'fa-rocket';
      case 'Learning':
        return 'fa-book-open';
      case 'Personal':
        return 'fa-user-check';
      default:
        return 'fa-brain';
    }
  };

  return (
    <div className="glass-card p-4 rounded-xl flex items-center gap-4 group relative animate-slide-up border border-glass-border">
      <button
        onClick={() => onComplete(habit.id)}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all text-2xl ${
          completed ? 'bg-accent-teal text-dark-bg' : 'bg-glass-surface border border-glass-border hover:bg-glass-highlight'
        }`}
        disabled={completed}
      >
        <i className={`fa-solid ${getIconForCategory(habit.category)}`}></i>
      </button>
      <div className="flex-1">
        <h3 className={`font-medium ${completed ? 'text-text-muted line-through' : 'text-text-main'}`}>
          {habit.title}
        </h3>
        <p className="text-sm text-text-muted">{habit.category}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-2xl text-accent-teal">{habit.currentStreak}</p>
        <p className="text-xs text-text-muted">Current Streak</p>
      </div>
      <button
        onClick={() => onDelete(habit.id)}
        className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-red-400 transition-all absolute top-2 right-2"
      >
        <i className="fa-regular fa-trash-can"></i>
      </button>
    </div>
  );
};
