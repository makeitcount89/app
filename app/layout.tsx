import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Property Finder",
  description: "Your top new listings, checked automatically.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
