import React from 'react';

/** SVG-only deck / flip-back; card faces use `getCardImageUrl` in TarotCardArtImage or modal fronts. */
export default function TarotCardBack() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border-2 border-[#e8dfcf] bg-gradient-to-br from-[#fdfbf7] to-[#f4f0e6] shadow-sm">
      <svg
        viewBox="0 0 100 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full text-[#c8bfae] opacity-90 transition-opacity"
      >
        <rect x="5" y="5" width="90" height="140" rx="2" stroke="currentColor" strokeWidth="1" />
        <rect
          x="9"
          y="9"
          width="82"
          height="132"
          rx="1"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        <circle cx="50" cy="75" r="24" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="75" r="18" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 2" />
        <path d="M 28 75 Q 50 58 72 75 Q 50 92 28 75 Z" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="75" r="5" fill="currentColor" />
        <circle cx="50" cy="75" r="8" stroke="currentColor" strokeWidth="0.5" />
        <path d="M 45 35 A 8 8 0 1 1 55 35 A 10 10 0 1 0 45 35 Z" fill="currentColor" />
        <path d="M 45 115 A 8 8 0 1 0 55 115 A 10 10 0 1 1 45 115 Z" fill="currentColor" />
        <path
          d="M 15 25 L 18 30 L 23 33 L 18 36 L 15 41 L 12 36 L 7 33 L 12 30 Z"
          fill="currentColor"
          opacity="0.6"
          transform="scale(0.8) translate(5, 5)"
        />
        <path
          d="M 85 125 L 88 130 L 93 133 L 88 136 L 85 141 L 82 136 L 77 133 L 82 130 Z"
          fill="currentColor"
          opacity="0.6"
          transform="scale(0.8) translate(20, -5)"
        />
        <circle cx="82" cy="30" r="1" fill="currentColor" />
        <circle cx="18" cy="120" r="1" fill="currentColor" />
        <line x1="50" y1="51" x2="50" y2="44" stroke="currentColor" strokeWidth="0.5" />
        <line x1="50" y1="99" x2="50" y2="106" stroke="currentColor" strokeWidth="0.5" />
        <line x1="26" y1="75" x2="19" y2="75" stroke="currentColor" strokeWidth="0.5" />
        <line x1="74" y1="75" x2="81" y2="75" stroke="currentColor" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
