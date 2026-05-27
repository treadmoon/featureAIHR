'use client';

import { useEffect, useState, useCallback } from 'react';
import { trackPageView } from '@/lib/analytics';

export function useNotifications() {
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch('/api/approvals?tab=pending').then(r => r.json()).catch(() => []),
      fetch('/api/notifications').then(r => r.json()).catch(() => []),
    ]).then(([approvals, notifs]) => {
      if (Array.isArray(approvals)) setPendingItems(approvals);
      if (Array.isArray(notifs)) setNotifications(notifs);
    });
    trackPageView('home');
  }, []);

  const dismissNotif = useCallback((type: string) => {
    setDismissedNotifs(prev => new Set(prev).add(type));
  }, []);

  return { pendingItems, notifications, dismissedNotifs, dismissNotif };
}
