import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QueryForge — 跨境电商经营分析工具",
  description: "本地优先的电商经营分析工具。面向小微跨境电商经营者，用自然语言提问，生成只读 SQL、图表和经营建议。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="dark" style={{ colorScheme: "dark" }}>
      <body>{children}</body>
    </html>
  );
}
