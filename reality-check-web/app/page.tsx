"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ScanSearch, Sparkles } from "lucide-react";

type Tab = "quick" | "deep";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("quick");
  const [claim, setClaim] = useState("");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRunCheck() {
    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const endpoint =
        activeTab === "quick" ? "/verify" : "/universal-check";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          activeTab === "quick"
            ? { claim }
            : { claim: claim || undefined, url: url || undefined },
        ),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Backend error (${res.status}): ${text || res.statusText}`,
        );
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center px-4 pt-24 pb-16">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="text-center max-w-3xl"
      >
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          Reality Check <span className="text-blue-400">AI</span>
        </h1>
        <p className="text-gray-300 text-lg md:text-xl">
          Paste a claim or link and let AI help you spot misinformation, fake
          news, and suspicious content.
        </p>
      </motion.div>

      {/* MAIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="mt-10 w-full max-w-4xl bg-black/50 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-lg"
      >
        {/* TABS */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab("quick")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === "quick"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Quick Check
          </button>
          <button
            onClick={() => setActiveTab("deep")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === "deep"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/40"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            <ScanSearch className="w-4 h-4" />
            Deep / Universal Check
          </button>
        </div>

        {/* INPUTS */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Claim / statement
            </label>
            <textarea
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              rows={3}
              className="w-full rounded-2xl bg-slate-900/70 border border-white/10 px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Example: The earth is flat and NASA is hiding the truth."
            />
          </div>

          {activeTab === "deep" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Optional URL (article / video)
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-2xl bg-slate-900/70 border border-white/10 px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="https://example.com/suspicious-article"
              />
            </div>
          )}
        </div>

        {/* RUN BUTTON */}
        <div className="mt-6 flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Sparkles className="w-3 h-3 text-blue-300" />
            <span>
              {activeTab === "quick"
                ? "Fast single-claim check using your verify endpoint."
                : "Heavier multi-signal analysis via universal-check."}
            </span>
          </div>

          <button
            onClick={handleRunCheck}
            disabled={isLoading || (!claim && activeTab === "quick")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-sm font-semibold shadow-lg shadow-blue-500/40 hover:shadow-violet-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Checking…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run Reality Check
              </>
            )}
          </button>
        </div>

        {/* ERROR */}
        {errorMsg && (
          <div className="mt-4 rounded-2xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        {/* RESULT */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm md:text-base space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-gray-100">Result</span>
              {result.confidence !== undefined && (
                <span className="text-xs text-gray-400">
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>

            {result.verdict && (
              <div className="text-sm">
                <span className="font-semibold">Verdict: </span>
                <span className="uppercase tracking-wide text-blue-300">
                  {result.verdict}
                </span>
              </div>
            )}

            {result.summary && (
              <p className="text-gray-200 leading-relaxed">
                {result.summary}
              </p>
            )}

            {result.notes && (
              <p className="text-xs text-gray-400">{result.notes}</p>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

