import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureGate — Secure Authentication Gateway",
  description: "Secure, production-ready, and OWASP-compliant self-hostable authentication portal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="referrer" content="no-referrer" />
      </head>
      <body>
        <main id="app-main-content">{children}</main>
      </body>
    </html>
  );
}
export const dynamic = "force-dynamic";
