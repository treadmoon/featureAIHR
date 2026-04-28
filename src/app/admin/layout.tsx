import ReturnToChatButton from '../components/ReturnToChatButton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ReturnToChatButton />
    </>
  );
}
