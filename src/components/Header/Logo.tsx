
'use client';

import type { FC } from 'react';

const Logo: FC = () => {
  return (
    <svg width="100" height="30" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glowyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: "hsl(var(--primary))", stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: "hsl(var(--accent))", stopOpacity: 1}} />
        </linearGradient>
      </defs>
      <text x="5" y="22" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="url(#glowyGradient)">
        Glowy
      </text>
      {/* Simple Sparkle representation */}
      <path d="M95 10 L96 8 L97 10 L99 11 L97 12 L96 14 L95 12 L93 11 Z" fill="hsl(var(--primary))" opacity="0.8">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
      </path>
       <path d="M90 5 L91 3 L92 5 L94 6 L92 7 L91 9 L90 7 L88 6 Z" fill="hsl(var(--accent))" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.7s" begin="0.2s" repeatCount="indefinite" />
      </path>
    </svg>
  );
};

export default Logo;
