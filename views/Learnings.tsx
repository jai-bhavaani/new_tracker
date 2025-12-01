
import React, { useState, useEffect } from 'react';
import { Target, TargetPeriod, LearningEntry } from '../types';
import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';

export const Learnings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'targets' | 'journal'>('targets');
  
  // Targets State
  const [targets, setTargets] = useState<Target[]>([]);
  const [newTargetText, setNewTargetText] = useState('');
  const [newTargetPeriod, setNewTargetPeriod] = useState<TargetPeriod>('Weekly');

  // Journal State
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [journalContent, setJournalContent] = useState('');
  const [journalTags, setJournalTags] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTagging, setIsTagging] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTargets(storageService.read<Target[]>('targets', []));
    
    // Robust load for learnings to handle legacy data
    const rawEntries = storageService.read<any[]>('learnings', []);
    const normalizedEntries: LearningEntry[] = Array.isArray(rawEntries) 
      ? rawEntries.map(e => ({
          ...e,
          // Fallback to 'text' if 'content' is missing (legacy support)
          content: e.content || e.text || '',
          // Ensure tags is an array
          tags: Array.isArray(e.tags) ? e.tags : []
        }))
      : [];
      
    setEntries(normalizedEntries);
  };

  // --- Targets Logic ---
  const addTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetText.trim()) return;

    const newTarget: Target = {
      id: crypto.randomUUID(),
      text: newTargetText,
      period: newTargetPeriod,
      completed: false
    };

    const updated = [...targets, newTarget];
    setTargets(updated);
    storageService.write('targets', updated);
    setNewTargetText('');
  };

  const toggleTarget = (id: string) => {
    const updated = targets.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTargets(updated);
    storageService.write('targets', updated);
  };

  const deleteTarget = (id: string) => {
    const updated = targets.filter(t => t.id !== id);
    setTargets(updated);
    storageService.write('targets', updated);
  };

  // --- Journal Logic ---
  const addEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent.trim()) return;

    // Process tags: split by comma, trim, remove empty
    const tagsArray = journalTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`);

    const newEntry: LearningEntry = {
      id: crypto.randomUUID(),
      content: journalContent,
      tags: tagsArray,
      createdAt: new Date().toISOString()
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    storageService.write('learnings', updated);
    
    setJournalContent('');
    setJournalTags('');
  };

  const handleAutoTag = async () => {
    if (!journalContent.trim() || isTagging) return;
    
    setIsTagging(true);
    try {
      const suggestedTags = await aiService.generateJournalTags(journalContent);
      if (suggestedTags && suggestedTags.length > 0) {
        // Append to existing tags if any
        const currentTags = journalTags ? journalTags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const uniqueTags = [...new Set([...currentTags, ...suggestedTags])];
        setJournalTags(uniqueTags.join(', '));
      }
    } catch (error) {
      console.error("Auto-tag failed");
    } finally {
      setIsTagging(false);
    }
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    storageService.write('learnings', updated);
  };

  const filteredEntries = entries.filter(entry => {
    const query = searchQuery.toLowerCase();
    // Safe access with fallbacks
    const content = (entry.content || entry.text || '').toLowerCase();
    const contentMatch = content.includes(query);
    
    const tags = Array.isArray(entry.tags) ? entry.tags : [];
    const tagMatch = tags.some(tag => (tag || '').toLowerCase().includes(query));
    
    return contentMatch || tagMatch;
  });

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-main">Knowledge Base</h2>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-glass-surface rounded-xl mb-6 backdrop-blur-sm border border-glass-border">
        <button 
          onClick={() => setActiveTab('targets')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'targets' ? 'bg-glass-highlight text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
        >
          <i className="fa-solid fa-bullseye mr-2"></i>Targets
        </button>
        <button 
          onClick={() => setActiveTab('journal')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'journal' ? 'bg-glass-highlight text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
        >
          <i className="fa-solid fa-book-journal-whills mr-2"></i>Journal
        </button>
      </div>

      {activeTab === 'targets' && (
        <div className="space-y-8 animate-slide-up">
          {/* Add Target Input */}
          <div className="glass-card p-4 rounded-xl border border-glass-border">
            <form onSubmit={addTarget} className="flex flex-col gap-3">
              <input 
                type="text" 
                value={newTargetText}
                onChange={(e) => setNewTargetText(e.target.value)}
                placeholder="Set a new goal..."
                className="bg-transparent border-b border-glass-border px-2 py-2 text-text-main placeholder-text-muted focus:outline-none focus:border-accent-teal transition-all"
              />
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {(['Weekly', 'Monthly', 'Yearly'] as TargetPeriod[]).map(period => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setNewTargetPeriod(period)}
                      className={`text-[10px] px-3 py-1 rounded-full border transition-all ${
                        newTargetPeriod === period 
                          ? 'bg-accent-teal/10 border-accent-teal text-accent-teal' 
                          : 'border-glass-border text-text-muted hover:text-text-main'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
                <button 
                  type="submit"
                  disabled={!newTargetText.trim()}
                  className="bg-accent-teal text-dark-bg w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </form>
          </div>

          {/* Render Sections */}
          {(['Weekly', 'Monthly', 'Yearly'] as TargetPeriod[]).map(period => {
            const periodTargets = targets.filter(t => t.period === period);
            if (periodTargets.length === 0 && period !== 'Weekly') return null;

            return (
              <div key={period} className="relative">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 pl-1">{period} Goals</h3>
                <div className="space-y-2">
                  {periodTargets.length === 0 ? (
                    <div className="text-text-muted text-sm italic pl-1">No {period.toLowerCase()} goals set.</div>
                  ) : (
                    periodTargets.map(target => (
                      <div key={target.id} className="glass-card p-3 rounded-lg flex items-center gap-3 group border border-glass-border">
                        <button 
                          onClick={() => toggleTarget(target.id)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            target.completed ? 'bg-accent-teal border-accent-teal' : 'border-text-muted hover:border-accent-teal'
                          }`}
                        >
                          {target.completed && <i className="fa-solid fa-check text-dark-bg text-xs"></i>}
                        </button>
                        <span className={`flex-1 text-sm ${target.completed ? 'text-text-muted line-through' : 'text-text-main'}`}>
                          {target.text}
                        </span>
                        <button 
                          onClick={() => deleteTarget(target.id)}
                          className="text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all px-2"
                        >
                          <i className="fa-solid fa-times"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'journal' && (
        <div className="space-y-6 animate-slide-up">
          {/* Search */}
          <div className="relative">
            <i className="fa-solid fa-search absolute left-4 top-3.5 text-text-muted text-sm"></i>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search learnings or #tags..."
              className="w-full bg-glass-surface border border-glass-border rounded-xl pl-10 pr-4 py-3 text-sm text-text-main focus:outline-none focus:border-accent-teal transition-all placeholder-text-muted"
            />
          </div>

          {/* Add Entry */}
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-purple-500 border-y border-r border-glass-border">
            <form onSubmit={addEntry} className="space-y-3">
              <textarea
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder="What did you learn today?"
                rows={2}
                className="w-full bg-transparent border-none p-0 text-text-main placeholder-text-muted focus:ring-0 resize-none text-sm"
              />
              <div className="flex items-center gap-3 pt-2 border-t border-glass-border relative">
                <i className="fa-solid fa-hashtag text-text-muted text-xs"></i>
                <input 
                  type="text" 
                  value={journalTags}
                  onChange={(e) => setJournalTags(e.target.value)}
                  placeholder="tags, comma, separated"
                  className="flex-1 bg-transparent border-none p-0 text-xs text-purple-400 placeholder-text-muted focus:ring-0"
                />
                
                {/* Auto Tag Button */}
                <button
                  type="button" 
                  onClick={handleAutoTag}
                  disabled={!journalContent.trim() || isTagging}
                  className="text-accent-teal hover:text-accent-hover transition-colors px-2 disabled:opacity-50"
                  title="Auto-generate tags with AI"
                >
                  <i className={`fa-solid ${isTagging ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                </button>

                <button 
                  type="submit"
                  disabled={!journalContent.trim()}
                  className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>

          {/* Entry List */}
          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-10 text-text-muted">
                <p>No entries found.</p>
              </div>
            ) : (
              filteredEntries.map(entry => (
                <div key={entry.id} className="glass-card p-4 rounded-xl relative group border border-glass-border">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-text-muted font-mono">
                      {new Date(entry.createdAt).toLocaleDateString()} • {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button 
                      onClick={() => deleteEntry(entry.id)}
                      className="text-text-muted hover:text-red-400 transition-colors"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                  <p className="text-text-main text-sm whitespace-pre-wrap mb-3 leading-relaxed">
                    {entry.content || entry.text}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(entry.tags || []).map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
