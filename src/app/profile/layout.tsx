import ReturnToChatButton from '../components/ReturnToChatButton';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ReturnToChatButton />
    </>
  );
}