import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ApprovalDetailClient from './ApprovalDetailClient';

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <ApprovalDetailClient id={id} userId={user.id} />;
}
