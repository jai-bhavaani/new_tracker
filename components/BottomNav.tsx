
import React from 'react';
import { AppSection } from '../types';
import { NAV_ITEMS } from '../constants';

interface BottomNavProps {
  currentSection: AppSection;
  onNavigate: (section: AppSection) => void;
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentSection, onNavigate, className = '' }) => {
  return (
    <nav className={`fixed bottom-0 left-0 w-full z-50 bg-dark-bg/80 backdrop-blur-xl border-t border-glass-border pb-safe ${className}`}>
      <div className="flex justify-around items-center h-20 max-w-md mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 group relative ${
                isActive ? 'text-accent-teal' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {isActive && (
                 <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-accent-teal shadow-[0_0_10px_rgba(45,212,191,0.7)] rounded-full"></div>
              )}
              
              <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-accent-teal/10 -translate-y-1' : ''}`}>
                <i className={`${item.iconClass} text-xl mb-0.5 transition-transform ${isActive ? 'scale-110 drop-shadow-sm' : ''}`}></i>
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 scale-0'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
