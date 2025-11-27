import React from 'react';

interface VoiceVisualizerProps {
  isActive: boolean;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isActive }) => {
  return (
    <div className="w-full max-w-[200px] border border-primary/50 p-4 rounded-md backdrop-blur-sm bg-black/40">
      <h2 className="text-center text-sm tracking-widest text-primary/80 mb-4">
        VOICE ANALYSIS
      </h2>
      <div className="flex items-end justify-center space-x-2 h-16">
        {[0, 0.2, 0.4, 0.6].map((delay, index) => (
          <div
            key={index}
            className={`w-4 bg-primary transition-all duration-300 ${isActive ? 'bar' : 'h-[10%] opacity-50'}`}
            style={{ 
              height: isActive ? `${[45, 75, 90, 60][index]}%` : '10%',
              animationDelay: `${delay}s`,
              boxShadow: isActive ? '0 0 10px #00ffff' : 'none'
            }}
          ></div>
        ))}
      </div>
      <p className="text-center text-xs tracking-[0.2em] text-primary/60 mt-2">
        {isActive ? 'PROCESSING' : 'IDLE'}
      </p>
    </div>
  );
};