import type { Metadata } from "next";
import "./globals.css";
import ChatProvider from "./components/ChatProvider";

export const metadata: Metadata = {
  title: "AI 智能秘书 — HR & IT Copilot",
  description: "企业级 AI 智能秘书，涵盖 HR 与 IT 专长，为员工提供意图驱动的零页面交互体验。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
