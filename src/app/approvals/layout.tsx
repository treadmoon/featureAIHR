import ReturnToChatButton from '../components/ReturnToChatButton';

export default function ApprovalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ReturnToChatButton />
    </>
  );
}
