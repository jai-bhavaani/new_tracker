import React from 'react';

interface MorningBriefingModalProps {
  isOpen: boolean;
  isLoading: boolean;
  content: string;
  onClose: () => void;
}

export const MorningBriefingModal: React.FC<MorningBriefingModalProps> = ({ isOpen, isLoading, content, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-dark-bg/90 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-8 relative animate-slide-up shadow-2xl border border-accent-teal/20">
        
        {/* Header with Sun Icon */}
        <div className="flex flex-col items-center mb-6">
           <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4 animate-bounce-in">
             <i className="fa-solid fa-sun text-3xl text-white"></i>
           </div>
           <h2 className="text-2xl font-black text-text-main tracking-tight text-center">Morning Briefing</h2>
        </div>

        {/* Content Area */}
        <div className="min-h-[150px] flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-text-muted">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl text-accent-teal"></i>
              <p className="text-sm font-medium animate-pulse">Preparing your daily strategy...</p>
            </div>
          ) : (
            <div className="text-text-main text-sm leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isLoading && (
          <button 
            onClick={onClose}
            className="w-full mt-8 bg-accent-teal hover:bg-accent-hover text-dark-bg font-bold py-4 rounded-2xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
          >
            Let's Go <i className="fa-solid fa-arrow-right"></i>
          </button>
        )}
      </div>
    </div>
  );
};