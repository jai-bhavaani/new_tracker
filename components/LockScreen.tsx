import React, { useState, useEffect } from 'react';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === '0000') {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 500);
      }
    }
  }, [pin, onUnlock]);

  const handlePress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-dark-bg/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 text-text-main animate-fade-in">
      
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent-teal to-blue-500 flex items-center justify-center shadow-lg shadow-teal-500/20 mb-2">
          <i className="fa-solid fa-lock text-3xl text-white"></i>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">KorteX Locked</h1>
        <p className="text-sm text-text-muted">Enter PIN to access (Default: 0000)</p>
      </div>

      <div className="flex gap-4 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              pin.length > i 
                ? error ? 'bg-red-500 border-red-500 animate-pulse' : 'bg-accent-teal border-accent-teal'
                : 'border-text-muted/20 bg-transparent'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-xs w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handlePress(num.toString())}
            className="w-16 h-16 rounded-full glass-card border-white/10 text-xl font-medium hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center mx-auto text-text-main"
          >
            {num}
          </button>
        ))}
        <div className="w-16 h-16"></div>
        <button
          onClick={() => handlePress('0')}
          className="w-16 h-16 rounded-full glass-card border-white/10 text-xl font-medium hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center mx-auto text-text-main"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 rounded-full text-text-muted hover:text-text-main hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center mx-auto"
        >
          <i className="fa-solid fa-backspace"></i>
        </button>
      </div>
    </div>
  );
};