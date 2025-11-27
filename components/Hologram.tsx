import React from 'react';

interface HologramProps {
  isActive: boolean;
}

export const Hologram: React.FC<HologramProps> = ({ isActive }) => {
  // Using the image provided in the prompt
  const hologramSrc = "https://lh3.googleusercontent.com/aida-public/AB6AXuAAJELo0RsJ6dFljFltXZvasmKDBXm5GEc9wCkpgbOVXFdxpMijJyaOqI1vu0Aq1l-TAwrX-XRtZEXmFJEU1Cpt7W_T9IGnajwaO2-58w99eRg2cmEeHzgp5i_GnFZEO_tYzReooD28g39p0hJGiilMNWPB_MCZbbo3NbYOa-_p_LfCMQ7-c4lXNzOpY2Mi8dW2WpG5jkHe2M3FBERt49no1hNlVnCnnLlrGNNhMFwgyTzvb6hIAS161jEDkLJUMHr4aO5t5SWz8Bc";

  return (
    <div className="relative group w-full flex items-center justify-center">
      <style>{`
        @keyframes holo-shimmer {
          0%, 100% { 
            opacity: 0.8; 
            filter: drop-shadow(0 0 15px #00ffff) brightness(1.2); 
            transform: scale(1.05); 
          }
          50% { 
            opacity: 1; 
            filter: drop-shadow(0 0 30px #00ffff) brightness(1.5) hue-rotate(-15deg); 
            transform: scale(1.08); 
          }
        }
      `}</style>

      {/* Spinning Rings Decoration (CSS Borders) */}
      <div className={`absolute w-64 h-64 md:w-80 md:h-80 rounded-full border border-primary/20 border-t-primary/60 transition-all duration-1000 ${isActive ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}></div>
      <div className={`absolute w-56 h-56 md:w-72 md:h-72 rounded-full border border-dashed border-primary/30 transition-all duration-1000 ${isActive ? 'animate-spin' : ''}`} style={{ animationDirection: 'reverse', animationDuration: '7s' }}></div>
      
      <img
        src={hologramSrc}
        alt="AI Hologram"
        className={`max-w-[250px] md:max-w-xs w-full h-auto opacity-80 transition-all duration-500 ${isActive ? '' : 'scale-100 filter drop-shadow-[0_0_15px_#00ffff]'}`}
        style={{ 
             maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
             WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
             animation: isActive ? 'holo-shimmer 2.5s infinite ease-in-out' : 'none'
        }}
      />
      
    </div>
  );
};