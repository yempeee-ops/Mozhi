import React from 'react';

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
}

const GlassContainer: React.FC<GlassContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl ${className}`}>
      {children}
    </div>
  );
};

export default GlassContainer;