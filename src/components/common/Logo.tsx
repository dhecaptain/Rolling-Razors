import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  size = 'md',
  showTagline = true,
  className = '',
  onClick
}) => {
  const sizeClasses = {
    sm: {
      icon: 'w-7 h-7',
      title: 'text-base font-extrabold tracking-wider',
      tagline: 'text-xs',
      spacing: 'gap-2'
    },
    md: {
      icon: 'w-9 h-9',
      title: 'text-lg md:text-xl font-black tracking-wider',
      tagline: 'text-xs md:text-sm',
      spacing: 'gap-2.5'
    },
    lg: {
      icon: 'w-12 h-12',
      title: 'text-2xl font-black tracking-wider',
      tagline: 'text-sm md:text-base',
      spacing: 'gap-3'
    },
    xl: {
      icon: 'w-16 h-16',
      title: 'text-3xl md:text-4xl font-black tracking-widest',
      tagline: 'text-lg',
      spacing: 'gap-4'
    }
  }[size];

  const colors = {
    light: {
      title: 'text-[#F5F1E8]',
      subtitle: 'text-[#D6A62E]',
      tagline: 'text-[#D6A62E]',
      iconBg: 'bg-[#0B4035] border border-[#D6A62E]/40',
      iconGold: '#D6A62E',
      iconWhite: '#F5F1E8'
    },
    dark: {
      title: 'text-[#073B32]',
      subtitle: 'text-[#D6A62E]',
      tagline: 'text-[#0B4035]',
      iconBg: 'bg-[#073B32] border border-[#D6A62E]',
      iconGold: '#D6A62E',
      iconWhite: '#F5F1E8'
    },
    gold: {
      title: 'text-[#D6A62E]',
      subtitle: 'text-[#F5F1E8]',
      tagline: 'text-[#F5F1E8]/90',
      iconBg: 'bg-[#D6A62E] border border-[#073B32]',
      iconGold: '#073B32',
      iconWhite: '#073B32'
    }
  }[variant];

  return (
    <div 
      id="brand-logo" 
      onClick={onClick}
      className={`flex items-center ${sizeClasses.spacing} cursor-pointer select-none group ${className}`}
    >
      {/* Brand Icon Badge with Crossed Scissors & Razor motif */}
      <div className={`relative flex items-center justify-center rounded-lg p-1.5 shadow-sm transition-transform duration-300 group-hover:scale-105 ${sizeClasses.icon} ${colors.iconBg}`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Outer diamond frame */}
          <rect x="2" y="2" width="36" height="36" rx="4" stroke={colors.iconGold} strokeWidth="1.5" strokeOpacity="0.6"/>
          
          {/* Stylized Double R Monogram + Crossed Craft Scissors & Razor */}
          {/* Scissors Left Handle & Blade */}
          <circle cx="12" cy="28" r="4" stroke={colors.iconGold} strokeWidth="1.8" />
          <path d="M15 25L28 10" stroke={colors.iconGold} strokeWidth="2.2" strokeLinecap="round"/>
          
          {/* Scissors Right Handle & Blade */}
          <circle cx="28" cy="28" r="4" stroke={colors.iconGold} strokeWidth="1.8" />
          <path d="M25 25L12 10" stroke={colors.iconGold} strokeWidth="2.2" strokeLinecap="round"/>
          
          {/* Center Pivot Stud / Diamond */}
          <polygon points="20,16 23,20 20,24 17,20" fill={colors.iconGold} />
          
          {/* Subtle Sewing Needle & Thread curve */}
          <path d="M9 13C12 9 28 9 31 13" stroke={colors.iconWhite} strokeWidth="1.2" strokeDasharray="2 2" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-display uppercase tracking-tight ${sizeClasses.title} ${colors.title}`}>
            ROLLING RAZORS
          </span>
          <span className={`font-display text-xs md:text-sm font-extrabold tracking-widest ${colors.subtitle}`}>
            CUSTOMS
          </span>
        </div>

        {showTagline && (
          <span className={`font-signature italic tracking-wide mt-0.5 ${sizeClasses.tagline} ${colors.tagline}`}>
            "Your Vision, Our Craftsmanship."
          </span>
        )}
      </div>
    </div>
  );
};
