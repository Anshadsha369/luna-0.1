import React from 'react';

interface MicButtonProps {
  isListening: boolean;
  onClick: () => void;
}

export const MicButton: React.FC<MicButtonProps> = ({ isListening, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-24 h-24 flex flex-col items-center justify-center rounded-full 
        border-2 transition-all duration-300
        focus:outline-none focus:ring-4 focus:ring-primary/30
        ${isListening 
          ? 'bg-primary/20 border-accent-red text-accent-red animate-pulse shadow-[0_0_20px_#ff3b3b]' 
          : 'bg-transparent border-primary text-primary hover:bg-primary/10 hover:shadow-[0_0_30px_#00ffff]'
        }
      `}
    >
      {/* Outer glow ring animation when active */}
      {isListening && (
          <span className="absolute inset-0 rounded-full border-2 border-accent-red animate-ping opacity-75"></span>
      )}

      <span className="material-icons text-4xl">
        {isListening ? 'mic' : 'mic_none'}
      </span>
      <span className="text-[10px] tracking-[0.3em] mt-2 font-bold">
        {isListening ? 'ACTIVE' : 'LISTEN'}
      </span>
    </button>
  );
};