import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Łysy Trener App",
  description: "Panel trenera, atlas ćwiczeń i plany treningowe online",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}