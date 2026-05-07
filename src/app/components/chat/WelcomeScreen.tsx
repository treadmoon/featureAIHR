'use client';

import React from 'react';
import { Bot } from 'lucide-react';

interface Props {
  role: 'employee' | 'manager' | 'admin';
  suggestions: string[];
  suggestionIcons: string[];
  greeting: string;
  greetingSub: string;
  onQuickSend: (text: string) => void;
  badgeText: string;
}

export default React.memo(function WelcomeScreen({ role, suggestions, suggestionIcons, greeting, greetingSub, onQuickSend, badgeText }: Props) {
  return (
    <div className="mt-16 md:mt-20 flex flex-col items-center text-center animate-fade-up">
      <div className="mb-4 rounded-full border px-3 py-1 text-[11px] font-medium ai-badge">
        {badgeText}
      </div>
      <div className="relative mb-8">
        <div
          className="absolute inset-0 rounded-2xl opacity-30 blur-xl animate-float"
          style={{ background: 'radial-gradient(circle at 30% 30%, #818cf8, #5e6ad2)' }}
        />
        <div className="relative flex items-center justify-center rounded-2xl w-16 h-16 ai-orb">
          <Bot size={32} color="#fff" />
        </div>
      </div>

      <h2
        className="mb-3 text-2xl md:text-3xl font-semibold tracking-tight"
        style={{ color: '#111827', letterSpacing: '-0.5px' }}
      >
        {greeting}
      </h2>
      <p className="max-w-md text-sm mb-10" style={{ color: '#9ca3af', lineHeight: 1.6 }}>
        {greetingSub}
      </p>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-2.5 md:grid-cols-2">
        {suggestions.map((s: string, i: number) => (
          <button
            key={i}
            onClick={() => onQuickSend(s)}
            className="group flex text-left items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 animate-fade-up ai-chip"
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.85)';
              e.currentTarget.style.borderColor = 'rgba(94,106,210,0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.65)';
              e.currentTarget.style.borderColor = 'rgba(94,106,210,0.16)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm"
              style={{ background: 'rgba(94,106,210,0.12)', color: '#5e6ad2' }}
            >
              {suggestionIcons[i] || '💬'}
            </span>
            <span className="text-[13px] leading-snug" style={{ color: '#374151' }}>{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
