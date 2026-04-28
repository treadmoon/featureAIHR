'use client';

import { Bot, Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useChatContext } from './ChatProvider';

export default function ReturnToChatButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSuspended, setSuspended } = useChatContext();

  const handleReturn = () => {
    setSuspended(false);
    router.push('/');
  };

  if (pathname === '/') return null;

  return (
    <button
      onClick={handleReturn}
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg"
      style={{ background: 'linear-gradient(135deg, #5e6ad2, #6366f1)', color: '#ffffff' }}
    >
      {isSuspended ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
      <span className="text-[13px] font-medium">
        {isSuspended ? '继续对话' : '返回对话'}
      </span>
    </button>
  );
}
