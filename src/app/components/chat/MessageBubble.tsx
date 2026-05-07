'use client';

import React, { lazy, Suspense } from 'react';
import { Bot, User } from 'lucide-react';
import ToolCards from '../tool-cards/ToolCards';

const ReactMarkdown = lazy(() => import('react-markdown'));

interface Props {
  message: any;
  isLast: boolean;
  isLoading: boolean;
  confirmedDrafts: Set<string>;
  setConfirmedDrafts: (fn: (prev: Set<string>) => Set<string>) => void;
  quickSend: (text: string) => void;
  onApprovalClick: (id: string, title: string, status: string) => void;
  feedbackSent: Set<string>;
  onFeedback: (id: string) => void;
  onGoodFeedback: (id: string) => void;
  fmtTime: (id: string) => string;
  t: any;
}

export default React.memo(function MessageBubble({
  message, isLast, isLoading, confirmedDrafts, setConfirmedDrafts,
  quickSend, onApprovalClick, feedbackSent, onFeedback, onGoodFeedback, fmtTime, t,
}: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 animate-fade-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: isUser ? 'rgba(0,0,0,0.08)' : 'linear-gradient(135deg, #5e6ad2, #5e6ad2)',
          color: '#fff',
          boxShadow: isUser ? 'none' : '0 2px 8px rgba(94,106,210,0.3)',
        }}
      >
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      <div className="flex flex-col gap-1 max-w-[78%]">
        <div
          className="rounded-lg px-4 py-3"
          style={{
            background: isUser ? 'rgba(94,106,210,0.15)' : 'rgba(0,0,0,0.02)',
            border: isUser ? '1px solid rgba(94,106,210,0.25)' : '1px solid rgba(0,0,0,0.08)',
            borderRadius: isUser ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
          }}
        >
          {message.parts?.filter((p: any) => p.type === 'text' && p.text?.trim())
            .filter((p: any) => {
              if (isUser) return true;
              const txt = p.text.trim();
              return !txt.startsWith('🤔') && !txt.includes('(Reasoning)') && !txt.includes('思考流') && !/^[\s\S]{0,20}workflowType:/m.test(txt);
            })
            .map((part: any, index: number) => (
              <div key={`text-${index}`} className="prose text-[14px] max-w-none mb-2 last:mb-0">
                <Suspense fallback={<div className="h-4 w-32 animate-pulse rounded bg-gray-100" />}>
                  <ReactMarkdown>{part.text}</ReactMarkdown>
                </Suspense>
              </div>
            ))}
          <ToolCards
            message={message}
            confirmedDrafts={confirmedDrafts}
            setConfirmedDrafts={setConfirmedDrafts}
            isLoading={isLoading}
            quickSend={quickSend}
            onApprovalClick={onApprovalClick}
          />
          {(!message.parts || message.parts.length === 0) && (
            <p className="leading-relaxed whitespace-pre-wrap" style={{ color: '#374151' }}>{message.content}</p>
          )}
        </div>

        <div
          className="flex items-center gap-1.5 px-1"
          style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}
        >
          <span className="text-[11px]" style={{ color: '#d1d5db' }}>{fmtTime(message.id)}</span>
          {!isUser && !(isLast && isLoading) && (
            feedbackSent.has(message.id)
              ? <span className="text-[11px]" style={{ color: '#10b981' }}>✓ {t.feedback}</span>
              : <>
                  <button
                    onClick={() => onGoodFeedback(message.id)}
                    className="text-[11px] transition-all"
                    style={{ color: '#d1d5db' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#10b981')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
                  >👍 {t.helpful}</button>
                  <button
                    onClick={() => onFeedback(message.id)}
                    className="text-[11px] transition-all"
                    style={{ color: '#d1d5db' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
                  >👎 {t.dissatisfied}</button>
                </>
          )}
        </div>
      </div>
    </div>
  );
});
