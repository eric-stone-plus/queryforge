import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QueryForge — 受治理的自助式商业分析层",
  description: "自然语言驱动的商业分析平台。用中文提问，生成受控 SQL 查询、实时图表和分析师级解释。",
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
