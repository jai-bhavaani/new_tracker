
import React from 'react';
import { AppSection } from '../types';
import { NAV_ITEMS, APP_NAME } from '../constants';

interface SidebarProps {
  currentSection: AppSection;
  onNavigate: (section: AppSection) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onNavigate, className = '' }) => {
  return (
    <aside className={`w-64 glass-panel border-r border-glass-border flex-col ${className}`}>
      {/* Sidebar Header */}
      <div className="h-20 flex items-center px-6 border-b border-glass-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-teal to-blue-500 flex items-center justify-center shadow-lg shadow-teal-500/20 mr-3">
          <i className="fa-solid fa-bolt text-white text-sm"></i>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-text-main">{APP_NAME}</h1>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-accent-teal/10 text-text-main border border-accent-teal/20 shadow-sm' 
                  : 'text-text-muted hover:text-text-main hover:bg-glass-highlight border border-transparent'
              }`}
            >
              <div className={`w-8 flex justify-center transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                <i className={`${item.iconClass} text-lg ${isActive ? 'text-accent-teal' : 'text-text-muted group-hover:text-text-main'}`}></i>
              </div>
              <span className={`ml-3 text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-teal shadow-sm shadow-teal-500/50"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Caption */}
      <div className="p-6 border-t border-glass-border">
        <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-glass-border">
           <p className="text-[10px] text-text-muted font-medium text-center">
             "Quality is not an act, it is a habit."
           </p>
        </div>
      </div>
    </aside>
  );
};
