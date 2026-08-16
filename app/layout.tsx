import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next Token",
  description: "A fast game about how language models choose what comes next.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
