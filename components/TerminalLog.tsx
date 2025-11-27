import React, { useEffect, useRef } from 'react';

interface TerminalLogProps {
  isListening: boolean;
  logs: string[];
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ isListening, logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="border border-primary/50 rounded-md p-4 h-full flex flex-col justify-between text-sm text-primary/90 font-mono bg-black/20 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>
      
      <div className="flex flex-col space-y-2 h-full overflow-y-auto scrollbar-hide">
        {logs.map((log, i) => (
          <p key={i} className="animate-fade-in break-words">
            <span className="opacity-50 mr-2">{new Date().toLocaleTimeString('en-US', {hour12: false})}</span>
            {log}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 pt-4 border-t border-primary/20">
        <p className="animate-pulse text-accent-green">
           {isListening ? "> Active scanning..." : "> System ready."}
        </p>
      </div>
    </div>
  );
};