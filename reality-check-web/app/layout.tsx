import type { Metadata } from "next";
import "./globals.css";
import StarField from "@/components/StarField";

export const metadata: Metadata = {
  title: "Reality Check AI",
  description: "AI-powered truth detection for claims, news, images and video.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#020617] text-white">
        {/* Starry animated background */}
        <StarField />

        {/* Main content sits above the stars */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}


