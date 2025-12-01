
import React, { useState } from 'react';
import { TaskPriority, TaskRepetition } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, description: string, priority: TaskPriority, category: string, repeating: TaskRepetition) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [category, setCategory] = useState('General');
  const [repeating, setRepeating] = useState<TaskRepetition>('None');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title, description, priority, category, repeating);
    // Reset form
    setTitle('');
    setDescription('');
    setPriority(TaskPriority.MEDIUM);
    setCategory('General');
    setRepeating('None');
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

        <h2 className="text-xl font-bold text-text-main mb-6">Add New Task</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
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
              placeholder="Add details..."
              rows={3}
              className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-accent-teal transition-all appearance-none"
              >
                <option value="General">General</option>
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-glass-surface border border-glass-border rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-accent-teal transition-all appearance-none"
              >
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
              </select>
            </div>
          </div>

          {/* Repeating */}
          <div>
             <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Repeating</label>
             <div className="flex bg-glass-surface border border-glass-border rounded-lg p-1">
                {(['None', 'Daily', 'Weekly', 'Weekdays'] as TaskRepetition[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setRepeating(opt)}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                      repeating === opt 
                        ? 'bg-accent-teal text-dark-bg shadow-sm' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
             </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-accent-teal hover:bg-accent-hover text-dark-bg font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95"
          >
            Create Task
          </button>
        </form>
      </div>
    </div>
  );
};
