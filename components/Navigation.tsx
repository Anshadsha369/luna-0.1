import React from 'react';

export const Navigation: React.FC = () => {
  const icons = ['person_outline', 'chat_bubble_outline', 'settings'];

  return (
    <>
      {icons.map((icon) => (
        <button
          key={icon}
          className="w-12 h-12 flex items-center justify-center rounded-full border border-primary/50 text-primary icon-glow hover:bg-primary/20 hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label={icon}
        >
          <span className="material-icons">{icon}</span>
        </button>
      ))}
    </>
  );
};