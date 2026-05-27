'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export interface AuthUser {
  id?: string;
  email?: string;
  role?: string;
  effectiveRole?: string;
}

export function useAuth() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) {
        supabase.auth.getSession().then(({ data: { session } }: any) => {
          if (session?.user) fetchProfile(session.user.id, session.user.email);
        });
        return;
      }
      fetchProfile(user.id, user.email);
    });

    async function fetchProfile(uid: string, email?: string | null) {
      setAuthUser({ id: uid, email: email || '' });
      const { data: profile } = await supabase.from('profiles').select('role, name').eq('id', uid).single();
      if (!profile) return;
      let effectiveRole = profile.role;
      if (profile.role !== 'admin') {
        const { data: managed } = await supabase.from('departments').select('id').eq('manager_id', uid).limit(1);
        const { data: subordinates } = await supabase.from('profiles').select('id').eq('report_to', uid).limit(1);
        effectiveRole = (managed && managed.length > 0) || (subordinates && subordinates.length > 0) ? 'manager' : 'employee';
      }
      setAuthUser({ id: uid, email: email || '', role: profile.role, effectiveRole });
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }, [supabase, router]);

  return { authUser, handleLogout };
}
