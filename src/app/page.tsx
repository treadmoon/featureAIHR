'use client';

import dynamic from 'next/dynamic';
import ChatProvider from './components/ChatProvider';

const HomeContent = dynamic(() => import('./HomeContent'), { ssr: false });

export default function Home() {
  return (
    <ChatProvider>
      <HomeContent />
    </ChatProvider>
  );
}
