import type { Metadata } from "next";
import "./globals.css";
import StarField from "@/components/StarField";
import NebulaGlow from "@/components/NebulaGlow";

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
      <body className="bg-[#020617] text-white antialiased">
        {/* Background layers */}
        <StarField />
        <NebulaGlow />

        {/* App content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}

