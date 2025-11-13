import "./globals.css";
import StarField from "@/components/StarField";

export const metadata = {
  title: "Reality Check AI",
  description: "AI-powered lie detector for news, photos, and videos.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#020617] text-white">
        <StarField />
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}


