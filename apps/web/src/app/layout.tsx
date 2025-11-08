import type { Metadata } from "next";
import "./globals.css";
import "./output.css";

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
      <head>
  
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link href="./output.css" rel="stylesheet"/>
      </head>
      <body className="dark">{children}</body>
    </html>
  );
}
