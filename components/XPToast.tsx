import React, { useEffect } from 'react';

interface XPToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export const XPToast: React.FC<XPToastProps> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-24 right-4 z-[60] animate-bounce-in">
      <div className="glass-card bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg shadow-emerald-500/10">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
          <i className="fa-solid fa-trophy text-sm"></i>
        </div>
        <div>
          <h4 className="font-bold text-emerald-400 text-sm">Level Up!</h4>
          <p className="text-white text-xs font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};