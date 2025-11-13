"use client";

import StarField from "@/components/StarField";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="relative min-h-screen text-white overflow-hidden">

      {/* STAR BACKGROUND */}
      <StarField />

      {/* CENTER HERO */}
      <div className="flex flex-col items-center justify-center text-center px-6 pt-32 md:pt-40">

        <motion.h1
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-7xl font-bold"
        >
          Reality Check <span className="text-blue-400">AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="text-gray-300 text-xl md:text-2xl mt-6 max-w-2xl"
        >
          Verify claims. Detect misinformation. Analyze images, videos, and text
          using AI-powered truth detection.
        </motion.p>

        {/* BUTTONS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-10 flex flex-col md:flex-row gap-5"
        >
          <a
            href="/quick"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold transition-all"
          >
            Quick Check
          </a>

          <a
            href="/deep"
            className="px-8 py-4 bg-gray-800 hover:bg-gray-900 rounded-xl text-lg font-semibold transition-all"
          >
            Deep Analysis
          </a>
        </motion.div>
      </div>
    </div>
  );
}

