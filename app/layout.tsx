import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "API Spend Guard",
  description: "Stop surprise API bills before they happen."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
