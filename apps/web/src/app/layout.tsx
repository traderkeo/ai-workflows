import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Starter Next",
  description: "AI-powered application with Vercel Workflow SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="dark">{children}</body>
    </html>
  );
}
