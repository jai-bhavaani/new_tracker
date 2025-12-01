
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  iconClass: string;
  trend?: 'up' | 'down' | 'neutral';
  colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  unit, 
  iconClass, 
  colorClass = 'text-accent-teal' 
}) => {
  // Helper to extract base color for bg opacity
  const bgClass = colorClass.replace('text-', 'bg-');

  return (
    <div className="glass-card rounded-3xl p-5 flex flex-col justify-between min-h-[140px] relative overflow-hidden group hover:bg-glass-highlight transition-all duration-300 border border-glass-border hover:border-glass-border shadow-lg shadow-black/5">
      {/* Ambient Glow - Adjusted for light mode compatibility */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl transition-opacity ${bgClass}`}></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-text-muted text-[11px] font-extrabold uppercase tracking-widest leading-none mt-1">{label}</h3>
        {/* Icon Bubble - Always visible and colorful */}
        <div className={`w-10 h-10 rounded-2xl ${bgClass}/10 flex items-center justify-center border border-glass-border shadow-inner`}>
           <i className={`${iconClass} text-lg ${colorClass} drop-shadow-md`}></i>
        </div>
      </div>
      
      <div className="relative z-10 mt-auto">
        <div className="flex flex-col items-start">
          <span className="text-3xl font-black text-text-main tracking-tighter leading-tight drop-shadow-sm">{value}</span>
          {unit && <span className="text-[11px] text-text-muted font-semibold mt-1 uppercase tracking-wide">{unit}</span>}
        </div>
      </div>
    </div>
  );
};
