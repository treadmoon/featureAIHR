import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import KnowledgeClient from './KnowledgeClient';

export default async function KnowledgePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/');
  return <KnowledgeClient />;
}
