
import React, { useState } from 'react';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, description: string, category: string) => void;
}

export const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Health');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title, description, category);
    // Reset form
    setTitle('');
    setDescription('');
    setCategory('Health');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative animate-slide-up shadow-2xl border border-glass-border">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
        >
          <i className="fa-solid fa-times text-xl"></i>
        </button>

        <h2 className="text-xl font-bold text-text-main mb-6">Add New Habit</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Read for 15 minutes"
              className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this habit important?"
              rows={3}
              className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all resize-none"
            />
          </div>

          {/* Category */}
          <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-accent-teal transition-all appearance-none"
              >
                <option value="Health">Health</option>
                <option value="Mindfulness">Mindfulness</option>
                <option value="Productivity">Productivity</option>
                <option value="Learning">Learning</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

          <button
            type="submit"
            className="w-full mt-4 bg-accent-teal hover:bg-accent-hover text-dark-bg font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95"
          >
            Create Habit
          </button>
        </form>
      </div>
    </div>
  );
};
