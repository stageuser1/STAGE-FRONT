import type { Metadata } from "next";
import { ReviewerSessionBar } from "@/components/reviewer/ReviewerSessionBar";
import { AuthProvider } from "@/lib/directus-auth";
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
      <body>
        <AuthProvider>
          <ReviewerSessionBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
