import React from 'react';

interface HeaderProps {
  status: 'ONLINE' | 'OFFLINE' | 'PROCESSING';
}

export const Header: React.FC<HeaderProps> = ({ status }) => {
  return (
    <header className="absolute top-6 left-1/2 -translate-x-1/2 text-center w-full z-20 pointer-events-none">
      <h1 className="text-4xl md:text-5xl font-bold tracking-[0.3em] text-glow select-none">
        LUNA
      </h1>
      <div className="mt-2 flex items-center justify-center space-x-2 text-sm tracking-widest">
        <span className="text-accent-red font-bold">STATUS:</span>
        <span className="flex items-center space-x-2 text-accent-green">
          <span 
            className={`w-2 h-2 rounded-full bg-accent-green transition-all duration-300 ${status === 'PROCESSING' ? 'animate-ping' : ''}`} 
            style={{ boxShadow: "0 0 6px #3bffa7" }}
          ></span>
          <span>{status}</span>
        </span>
      </div>
    </header>
  );
};