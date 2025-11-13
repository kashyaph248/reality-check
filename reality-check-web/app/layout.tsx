import type { Metadata } from "next";
import "./globals.css";
import StarField from "@/components/StarField";

export const metadata: Metadata = {
  title: "Reality Check AI",
  description: "AI-powered lie detector for news, photos, and videos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#020617] text-white">
        {/* Starfield background behind everything */}
        <StarField />

        {/* All your existing pages sit above the stars */}
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}

