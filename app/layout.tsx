import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STAGE-FRONT",
  description: "Static mobile-first MVP scaffold for STAGE-FRONT.",
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
