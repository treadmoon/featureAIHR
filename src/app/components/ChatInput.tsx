'use client';

import { Send } from 'lucide-react';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  shortcuts: Array<{ emoji: string; text: string; shortLabel: string; bg: string; border: string; color: string }>;
  onQuickSend: (text: string) => void;
  pendingDraft: { onConfirm: () => void; onModify: () => void } | null;
  confirmSubmitText: string;
  modifyText: string;
  placeholder: string;
  poweredByText: string;
  onAutoResize: () => void;
}

export default function ChatInput({
  input, onInputChange, onSend, isLoading, textareaRef, shortcuts, onQuickSend,
  pendingDraft, confirmSubmitText, modifyText, placeholder, poweredByText, onAutoResize,
}: ChatInputProps) {
  return (
    <footer className="fixed bottom-0 w-full" style={{ background: 'linear-gradient(to top, #ffffff 60%, transparent)', paddingTop: '48px' }}>
      {!isLoading && (
        <div className="mx-auto max-w-3xl px-4 pb-2 flex flex-wrap gap-2 justify-center">
          {pendingDraft && (
            <>
              <button
                onClick={pendingDraft.onConfirm}
                className="text-[13px] px-4 py-1.5 rounded-md font-medium transition-all"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
              >
                ✅ {confirmSubmitText}
              </button>
              <button
                onClick={pendingDraft.onModify}
                className="text-[13px] px-4 py-1.5 rounded-md transition-all"
                style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: '#6b7280' }}
              >
                ✏️ {modifyText}
              </button>
            </>
          )}
          {shortcuts.map((s, i) => (
            <button
              key={i}
              onClick={() => onQuickSend(s.text)}
              className="text-[12px] px-3 py-1.5 rounded-md transition-all font-medium"
              style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
            >
              {s.emoji} {s.shortLabel}
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4">
        <form
          onSubmit={(e) => { e.preventDefault(); onSend(); }}
          className="flex items-end gap-2 rounded-xl px-3 py-2.5 mb-2 ai-glass"
          style={{ border: '1px solid rgba(94,106,210,0.16)', boxShadow: '0 10px 40px rgba(94,106,210,0.16)' }}
        >
          <textarea
            ref={textareaRef}
            className="max-h-32 min-h-[44px] w-full resize-none border-0 bg-transparent py-2 pl-2 text-[14px]"
            style={{ color: '#111827', outline: 'none' }}
            placeholder={placeholder}
            value={input}
            onChange={(e) => { onInputChange(e.target.value); onAutoResize(); }}
            rows={1}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-all"
            style={{
              background: 'linear-gradient(135deg, #5e6ad2, #7c8bff)',
              color: '#fff',
              opacity: (isLoading || !input.trim()) ? 0.4 : 1,
              cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            <Send size={15} />
          </button>
        </form>
        <div className="pb-3 pt-1 text-center text-[11px]" style={{ color: '#d1d5db' }}>{poweredByText}</div>
      </div>
    </footer>
  );
}
