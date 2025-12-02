
import React, { useEffect, useState } from 'react';
import { Habit } from '../types';
import { storageService } from '../services/storageService';
import { HabitCard } from '../components/HabitCard';
import { HabitModal } from '../components/HabitModal';

interface HabitsProps {
  showToast: (msg: string, type: 'success' | 'info' | 'xp' | 'error') => void;
}

export const Habits: React.FC<HabitsProps> = ({ showToast }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = () => {
    const savedHabits = storageService.getHabits();
    setHabits(savedHabits);
  };

  const handleAddHabit = (title: string, description: string, category: string) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      title,
      description,
      category,
      createdAt: new Date().toISOString(),
      currentStreak: 0,
      longestStreak: 0,
    };
    const newHabits = [...habits, newHabit];
    setHabits(newHabits);
    storageService.saveHabits(newHabits);
    showToast('Habit added!', 'success');
  };

  const handleCompleteHabit = (id: string) => {
    const newHabits = habits.map(habit => {
      if (habit.id === id) {
        const today = new Date();
        const lastCompleted = habit.lastCompletedAt ? new Date(habit.lastCompletedAt) : null;
        let newStreak = habit.currentStreak;

        if (lastCompleted) {
          // Get dates at midnight to compare days correctly
          const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const lastCompletedDateOnly = new Date(lastCompleted.getFullYear(), lastCompleted.getMonth(), lastCompleted.getDate());
          
          const diffTime = todayDateOnly.getTime() - lastCompletedDateOnly.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            newStreak += 1; // Consecutive day
          } else if (diffDays > 1) {
            newStreak = 1; // Streak broken
          }
          // if diffDays is 0 or less, do nothing.
        } else {
          newStreak = 1; // First time
        }
        
        showToast(`+${newStreak * 2} XP Streak!`, 'xp');

        return {
          ...habit,
          currentStreak: newStreak,
          longestStreak: Math.max(habit.longestStreak, newStreak),
          lastCompletedAt: today.toISOString(),
        };
      }
      return habit;
    });
    setHabits(newHabits);
    storageService.saveHabits(newHabits);
  };

  const handleDeleteHabit = (id: string) => {
    const updatedHabits = habits.filter(h => h.id !== id);
    setHabits(updatedHabits);
    storageService.saveHabits(updatedHabits);
    showToast('Habit deleted', 'info');
  };

  return (
    <div className="pb-24 animate-fade-in relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-main">My Habits</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent-teal hover:bg-accent-hover text-dark-bg font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-teal-500/20 flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Add Habit
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <i className="fa-solid fa-seedling text-4xl mb-3 opacity-20"></i>
            <p>No habits defined yet. Start building a new streak!</p>
          </div>
        ) : (
          habits.map(habit => (
            <HabitCard 
              key={habit.id} 
              habit={habit}
              onComplete={handleCompleteHabit}
              onDelete={handleDeleteHabit} 
            />
          ))
        )}
      </div>

      <HabitModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddHabit}
      />
    </div>
  );
};
