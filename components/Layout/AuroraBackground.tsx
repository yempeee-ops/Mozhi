import React from 'react';

const AuroraBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Deep Purple Base */}
      <div className="absolute inset-0 bg-[#0f0720]" />
      
      {/* Aurora Blob 1 - Top Left - Pink/Purple */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[120px] opacity-40 animate-pulse" />
      
      {/* Aurora Blob 2 - Bottom Right - Blue/Violet */}
      <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-[140px] opacity-30" />
      
      {/* Aurora Blob 3 - Center - Fuchsia */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-fuchsia-600 rounded-full blur-[100px] opacity-20 mix-blend-screen" />

      {/* Noise Texture Overlay for grain effect */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
    </div>
  );
};

export default AuroraBackground;