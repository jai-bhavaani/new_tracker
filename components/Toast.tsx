import React, { useEffect } from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const getStyles = () => {
    switch (toast.type) {
      case 'xp':
        return {
          bg: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20',
          border: 'border-emerald-500/30',
          iconBg: 'bg-emerald-500/20',
          iconColor: 'text-emerald-400',
          titleColor: 'text-emerald-400',
          icon: 'fa-trophy',
          title: 'Level Up!'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500/20 to-orange-500/20',
          border: 'border-red-500/30',
          iconBg: 'bg-red-500/20',
          iconColor: 'text-red-400',
          titleColor: 'text-red-400',
          icon: 'fa-circle-exclamation',
          title: 'Error'
        };
      case 'info':
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
          border: 'border-blue-500/30',
          iconBg: 'bg-blue-500/20',
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-400',
          icon: 'fa-circle-info',
          title: 'Info'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed top-24 right-4 z-[60] animate-bounce-in max-w-xs w-full">
      <div className={`glass-card ${styles.bg} border ${styles.border} px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg backdrop-blur-md`}>
        <div className={`w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center ${styles.iconColor} flex-shrink-0`}>
          <i className={`fa-solid ${styles.icon} text-sm`}></i>
        </div>
        <div>
          <h4 className={`font-bold ${styles.titleColor} text-sm`}>{styles.title}</h4>
          <p className="text-text-main text-xs font-medium">{toast.message}</p>
        </div>
      </div>
    </div>
  );
};