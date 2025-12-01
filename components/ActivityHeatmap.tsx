
import React from 'react';

interface HeatmapDay {
  date: string;
  count: number;
  level: number;
}

interface ActivityHeatmapProps {
  data: HeatmapDay[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  
  // Helper to determine color based on level
  const getColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-white/5 border border-white/5';
      case 1: return 'bg-accent-teal/20 border border-accent-teal/30';
      case 2: return 'bg-accent-teal/40 border border-accent-teal/50';
      case 3: return 'bg-accent-teal/70 border border-accent-teal/80';
      case 4: return 'bg-accent-teal border border-accent-teal';
      default: return 'bg-white/5';
    }
  };

  // Generate months labels roughly
  // This is a simplified approach where we just show labels periodically
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return (
    <div className="glass-card p-5 rounded-2xl w-full overflow-hidden">
      <h3 className="text-sm font-semibold text-text-muted mb-4 flex items-center gap-2">
        <i className="fa-solid fa-calendar-days text-accent-teal"></i> Consistency Heatmap
      </h3>
      
      <div className="overflow-x-auto pb-2 custom-scrollbar">
        <div className="min-w-[700px]">
           {/* Heatmap Grid */}
           {/* 
              CSS Grid Logic: 
              - 7 Rows (Days)
              - Auto Columns
              - Flow Column to make dates fill vertically then horizontally
           */}
           <div 
             className="grid grid-rows-7 grid-flow-col gap-1" 
             style={{ 
               gridTemplateColumns: `repeat(${Math.ceil(data.length / 7)}, 1fr)` 
             }}
           >
             {data.map((day) => (
               <div
                 key={day.date}
                 className={`w-3 h-3 rounded-sm ${getColor(day.level)} transition-all hover:scale-125 hover:z-10 relative group`}
                 title={`${day.date}: ${day.count} activities`}
               >
                 {/* Tooltip on Hover */}
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-dark-bg text-text-main text-[10px] rounded border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-lg">
                   <span className="font-bold">{day.count}</span> on {new Date(day.date).toLocaleDateString()}
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-text-muted">
        <span>Less</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-white/5 border border-white/5"></div>
        <div className="w-2.5 h-2.5 rounded-sm bg-accent-teal/20 border border-accent-teal/30"></div>
        <div className="w-2.5 h-2.5 rounded-sm bg-accent-teal/40 border border-accent-teal/50"></div>
        <div className="w-2.5 h-2.5 rounded-sm bg-accent-teal/70 border border-accent-teal/80"></div>
        <div className="w-2.5 h-2.5 rounded-sm bg-accent-teal border border-accent-teal"></div>
        <span>More</span>
      </div>
    </div>
  );
};
