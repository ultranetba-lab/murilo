
import React from 'react';

interface LogoProps {
  variant?: 'full' | 'compact' | 'white';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ variant = 'full', className = "" }) => {
  const isCompact = variant === 'compact';
  const isWhite = variant === 'white';
  const primaryColor = isWhite ? '#ffffff' : '#710087';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative flex items-center justify-center ${isCompact ? 'w-8 h-8' : 'w-12 h-12'}`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          <path d="M10 30V70L50 90L90 70V30L50 10L10 30Z" fill={primaryColor} />
          <path d="M30 45C30 45 40 55 50 55C60 55 70 45 70 45" stroke={isWhite ? '#710087' : 'white'} strokeWidth="8" strokeLinecap="round" />
          <path d="M50 25V55" stroke={isWhite ? '#710087' : 'white'} strokeWidth="8" strokeLinecap="round" />
        </svg>
        <div className={`absolute inset-0 rounded-xl bg-current opacity-0 hover:opacity-10 transition-opacity`} />
      </div>
      
      {!isCompact && (
        <div className="flex flex-col">
          <span className={`font-black text-2xl tracking-tighter uppercase leading-none ${isWhite ? 'text-white' : 'text-[#710087]'}`}>
            UltraNet
          </span>
          <span className={`text-[8px] font-bold uppercase tracking-[3px] ${isWhite ? 'text-purple-200' : 'text-slate-400'}`}>
            Provedor de Internet
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
