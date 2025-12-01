
import React, { useEffect, useState } from 'react';
import { Task, TaskPriority, TaskRepetition } from '../types';
import { storageService } from '../services/storageService';
import { TaskModal } from '../components/TaskModal';
import { aiService } from '../services/aiService';

// Declare external confetti library
declare const confetti: any;

interface TasksProps {
  showToast: (msg: string, type: 'success' | 'info' | 'xp' | 'error') => void;
}

export const Tasks: React.FC<TasksProps> = ({ showToast }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // AI Planner State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [dailyPlan, setDailyPlan] = useState('');

  // Smart Add State
  const [isSmartAddOpen, setIsSmartAddOpen] = useState(false);
  const [smartTaskInput, setSmartTaskInput] = useState('');
  const [isProcessingSmartTask, setIsProcessingSmartTask] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = () => {
    const savedTasks = storageService.read<Task[]>('tasks', []);
    setTasks(savedTasks);
  };

  const addNewTask = (title: string, description: string, priority: TaskPriority, category: string, repeating: TaskRepetition = 'None') => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      priority,
      category,
      completed: false,
      createdAt: new Date().toISOString(),
      repeating
    };
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    storageService.write('tasks', updatedTasks);
    showToast('Task added successfully', 'success');
  };

  const toggleTaskCompletion = (id: string) => {
    let tasksClone = [...tasks];
    const taskIndex = tasksClone.findIndex(t => t.id === id);
    
    if (taskIndex === -1) return;

    const task = tasksClone[taskIndex];
    const newStatus = !task.completed;
    
    // Update the targeted task
    const updatedTask = {
      ...task,
      completed: newStatus,
      completedAt: newStatus ? new Date().toISOString() : undefined
    };
    
    tasksClone[taskIndex] = updatedTask;

    // Handle Recurring Logic
    if (newStatus && task.repeating && task.repeating !== 'None') {
      // Create a clone for the next cycle
      const nextTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        completed: false,
        createdAt: new Date().toISOString(), // In a robust app, calculate exact next due date
        completedAt: undefined,
        // Keep description, priority, category, repeating
      };
      
      // Insert the new task at the top (or bottom)
      tasksClone.push(nextTask);
      showToast(`Recurring task (${task.repeating}) renewed!`, 'info');
    }

    if (newStatus) {
      // Trigger Gamification & Confetti
      showToast('+8 XP Task Completed', 'xp');
      
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2dd4bf', '#a855f7', '#fb923c']
        });
      }
      
      // Trigger Notification
      if (task.priority === TaskPriority.HIGH && Notification.permission === 'granted') {
          new Notification("🔥 Task Conquered!", {
              body: `You smashed "${task.title}"! Keep the momentum!`,
              icon: "https://cdn-icons-png.flaticon.com/512/9662/9662656.png"
          });
      }

      // Increment global stats for "Tasks Completed"
      const stats = storageService.read('stats', { tasksCompleted: 0 });
      storageService.write('stats', { ...stats, tasksCompleted: (stats.tasksCompleted || 0) + 1 });
    }

    setTasks(tasksClone);
    storageService.write('tasks', tasksClone);
  };

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    storageService.write('tasks', updatedTasks);
    showToast('Task deleted', 'info');
  };

  // Sorting Logic
  const getSortedTasks = () => {
    const filtered = tasks.filter(t => activeTab === 'active' ? !t.completed : t.completed);
    
    if (activeTab === 'active') {
      // Sort by Priority (High > Med > Low)
      const priorityWeight = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
      return filtered.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    } else {
      // Sort by Date (Newest first)
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };

  const priorityColor = (p: TaskPriority) => {
    switch (p) {
      // Ensure colors are visible on light backgrounds
      case TaskPriority.HIGH: return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
      case TaskPriority.MEDIUM: return 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20';
      case TaskPriority.LOW: return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  const handlePlanMyDay = async () => {
    setIsPlanModalOpen(true);
    if (dailyPlan) return; // Don't regenerate if exists

    setIsGeneratingPlan(true);
    try {
      const context = storageService.getAIContext();
      const plan = await aiService.generateDailyPlan(context);
      setDailyPlan(plan);
    } catch (e) {
      setDailyPlan("Sorry, could not generate a plan at this time.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSmartAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartTaskInput.trim() || isProcessingSmartTask) return;

    setIsProcessingSmartTask(true);
    try {
      const result = await aiService.parseTaskInput(smartTaskInput);
      if (result) {
        addNewTask(
          result.title,
          result.description || '',
          result.priority as TaskPriority,
          result.category,
          result.repeating as TaskRepetition
        );
        setIsSmartAddOpen(false);
        setSmartTaskInput('');
      } else {
        showToast("Couldn't understand the task.", 'error');
      }
    } catch (e) {
      showToast("AI Error.", 'error');
    } finally {
      setIsProcessingSmartTask(false);
    }
  };

  const currentList = getSortedTasks();

  return (
    <div className="pb-24 animate-fade-in relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-main">My Tasks</h2>
        <div className="flex gap-2">
           <button 
            onClick={() => setIsSmartAddOpen(true)}
            className="group flex items-center gap-2 px-3 py-2 bg-glass-surface hover:bg-glass-highlight border border-glass-border rounded-lg transition-all active:scale-95"
            title="Smart Add"
          >
             <i className="fa-solid fa-wand-magic-sparkles text-accent-teal"></i>
          </button>
          <button 
            onClick={handlePlanMyDay}
            className="bg-glass-surface hover:bg-glass-highlight border border-glass-border text-text-main px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-robot text-accent-teal"></i> Plan
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-accent-teal hover:bg-accent-hover text-dark-bg font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-teal-500/20 flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Add
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-glass-surface rounded-xl mb-6 backdrop-blur-sm border border-glass-border">
        <button 
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'active' ? 'bg-glass-highlight text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
        >
          Active <span className="ml-1 text-xs opacity-60 bg-glass-highlight px-1.5 py-0.5 rounded-full">{tasks.filter(t => !t.completed).length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'completed' ? 'bg-glass-highlight text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
        >
          Completed
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {currentList.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <i className="fa-solid fa-clipboard-check text-4xl mb-3 opacity-20"></i>
            <p>No {activeTab} tasks found.</p>
          </div>
        ) : (
          currentList.map(task => (
            <div key={task.id} className="glass-card p-4 rounded-xl flex items-start gap-3 group relative animate-slide-up border border-glass-border">
              <button 
                onClick={() => toggleTaskCompletion(task.id)}
                className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${task.completed ? 'bg-accent-teal border-accent-teal' : 'border-text-muted hover:border-accent-teal'}`}
              >
                {task.completed && <i className="fa-solid fa-check text-dark-bg text-xs"></i>}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-medium truncate ${task.completed ? 'text-text-muted line-through' : 'text-text-main'}`}>
                    {task.title}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${priorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.repeating && task.repeating !== 'None' && (
                     <span className="text-[10px] px-2 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-400 flex items-center gap-1">
                        <i className="fa-solid fa-rotate-right text-[8px]"></i> {task.repeating}
                     </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-text-muted mb-2 line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <i className="fa-regular fa-folder"></i> {task.category}
                  </span>
                  {task.completed && (
                    <span className="text-emerald-500/70">
                      <i className="fa-solid fa-check-double mr-1"></i> Done {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''}
                    </span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-red-400 transition-all absolute top-2 right-2"
              >
                <i className="fa-regular fa-trash-can"></i>
              </button>
            </div>
          ))
        )}
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={(t, d, p, c, r) => addNewTask(t, d, p, c, r)} 
      />

      {/* Smart Add Task Modal */}
      {isSmartAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 relative animate-slide-up shadow-2xl border border-glass-border">
            <button onClick={() => setIsSmartAddOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors">
              <i className="fa-solid fa-times text-xl"></i>
            </button>
            <h2 className="text-2xl font-black text-text-main mb-2 flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-accent-teal"></i> Smart Task
            </h2>
            <p className="text-xs text-text-muted mb-6 font-medium">Example: "Finish report every Friday high priority"</p>
            
            <form onSubmit={handleSmartAdd}>
              <textarea
                value={smartTaskInput}
                onChange={(e) => setSmartTaskInput(e.target.value)}
                rows={3}
                placeholder="Describe your task..."
                className="w-full bg-glass-surface border border-glass-border rounded-2xl p-4 text-text-main focus:outline-none focus:border-accent-teal transition-all mb-4 resize-none text-sm"
                disabled={isProcessingSmartTask}
              />
              <button
                type="submit"
                disabled={isProcessingSmartTask || !smartTaskInput.trim()}
                className="w-full bg-accent-teal hover:bg-accent-hover text-dark-bg font-bold py-4 rounded-2xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
              >
                {isProcessingSmartTask ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Processing...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plus"></i> Create Task
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Plan My Day Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 relative animate-slide-up shadow-2xl h-[80vh] flex flex-col border border-glass-border">
            <button 
              onClick={() => setIsPlanModalOpen(false)} 
              className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
            
            <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
              <i className="fa-solid fa-calendar-check text-accent-teal"></i> AI Daily Plan
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {isGeneratingPlan ? (
                <div className="flex flex-col items-center justify-center h-full text-text-muted gap-3">
                  <i className="fa-solid fa-circle-notch fa-spin text-3xl text-accent-teal"></i>
                  <p className="text-sm">Analyzing your tasks & goals...</p>
                </div>
              ) : (
                <div className="text-text-main text-sm leading-relaxed whitespace-pre-wrap">
                  {dailyPlan}
                </div>
              )}
            </div>
            
            {!isGeneratingPlan && (
               <button 
               onClick={() => {
                 setDailyPlan('');
                 handlePlanMyDay();
               }}
               className="mt-4 w-full bg-glass-surface hover:bg-glass-highlight text-text-main font-medium py-3 rounded-xl transition-colors border border-glass-border"
             >
               Regenerate Plan
             </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
