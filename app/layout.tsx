import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ongoing Health Check",
  description:
    "A personal, first-principles health dashboard — see where you're green, where you're amber, and what's genuinely worth doing.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
