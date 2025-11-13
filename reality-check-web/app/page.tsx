"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ScanSearch,
  Sparkles,
  SunMedium,
  Moon,
  CircleCheck,
  CircleX,
  AlertTriangle,
  HelpCircle,
  Link2,
  UploadCloud,
  XCircle,
} from "lucide-react";

type Tab = "quick" | "deep";

type CheckResult = {
  verdict?: string;
  confidence?: number;
  summary?: string;
  notes?: string;
  url?: string | null;
};

// injected at build time; on client it's just a string literal
const API_BASE = "https://reality-check-oh5g.onrender.com";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("quick");
  const [claim, setClaim] = useState("");
  const [url, setUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const [result, setResult] = useState<CheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDarkCard, setIsDarkCard] = useState(true);

  const canRunQuick = !!claim.trim();
  const canRunDeep = !!claim.trim() || !!url.trim() || !!mediaFile;
  const isDisabled =
    isLoading || (activeTab === "quick" ? !canRunQuick : !canRunDeep);

  async function handleRunCheck() {
    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const endpointPath =
        activeTab === "quick" ? "/verify" : "/universal-check";
      const endpoint = `${API_BASE}${endpointPath}`;

      let res: Response;

      if (activeTab === "deep" && mediaFile) {
        // multipart request when media is attached
        const form = new FormData();
        if (claim.trim()) form.append("claim", claim.trim());
        if (url.trim()) form.append("url", url.trim());
        form.append("media", mediaFile);

        res = await fetch(endpoint, {
          method: "POST",
          body: form,
        });
      } else {
        // JSON-only request
        const body =
          activeTab === "quick"
            ? { claim: claim.trim() }
            : {
                claim: claim.trim() || undefined,
                url: url.trim() || undefined,
              };

        res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
      }

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

  const verdictStyle = useMemo(() => {
    const v = (result?.verdict || "").toLowerCase();
    if (!v)
      return {
        label: "Unknown",
        color: "bg-slate-700/70",
        text: "text-slate-100",
      };

    if (["true", "accurate", "supported"].includes(v)) {
      return {
        label: "Likely True",
        color: "bg-emerald-500/15 border border-emerald-400/40",
        text: "text-emerald-200",
      };
    }
    if (["false", "fake", "incorrect"].includes(v)) {
      return {
        label: "Likely False",
        color: "bg-rose-500/15 border border-rose-400/40",
        text: "text-rose-200",
      };
    }
    if (["mixed", "misleading", "unclear"].includes(v)) {
      return {
        label: "Mixed / Misleading",
        color: "bg-amber-500/15 border border-amber-400/40",
        text: "text-amber-200",
      };
    }
    return {
      label: result?.verdict || "Unknown",
      color: "bg-slate-700/70 border border-slate-500/40",
      text: "text-slate-100",
    };
  }, [result?.verdict]);

  const confidencePct = useMemo(() => {
    if (result?.confidence === undefined || result.confidence === null)
      return null;
    const raw = Number(result.confidence);
    if (Number.isNaN(raw)) return null;
    return Math.round(Math.min(Math.max(raw, 0), 1) * 100);
  }, [result?.confidence]);

  const cardBase =
    "w-full max-w-4xl rounded-3xl p-6 md:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.95)] border backdrop-blur-xl transition-colors duration-300";
  const cardVariant = isDarkCard
    ? "bg-slate-950/85 border-white/10 text-slate-50"
    : "bg-slate-100/90 border-slate-300 text-slate-900";

  return (
    <div className="flex flex-col min-h-screen items-center px-4 pt-20 pb-10">
      {/* Top bar */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="hidden sm:flex items-center gap-2 text-xs text-slate-300/80"
        >
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-[10px] font-bold shadow-lg shadow-blue-500/40">
            RC
          </div>
          <span className="uppercase tracking-[0.2em] text-[11px] text-slate-400">
            Reality Check AI
          </span>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          onClick={() => setIsDarkCard((prev) => !prev)}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-black/60 transition-colors"
        >
          {isDarkCard ? (
            <>
              <Moon className="w-3.5 h-3.5" />
              <span>Dark mode</span>
            </>
          ) : (
            <>
              <SunMedium className="w-3.5 h-3.5 text-yellow-300" />
              <span>Light mode</span>
            </>
          )}
        </motion.button>
      </div>

      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="text-center max-w-3xl mb-6"
      >
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-3">
          <span className="relative inline-block">
            <span className="absolute -inset-1 blur-md bg-gradient-to-r from-blue-500/40 via-cyan-400/40 to-violet-500/40 opacity-60" />
            <span className="relative">
              Reality Check{" "}
              <span className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                AI
              </span>
            </span>
          </span>
        </h1>
        <p className="text-slate-200/90 text-base md:text-lg">
          Paste a claim or link and let AI help you spot misinformation, fake
          news, and suspicious content.
        </p>
      </motion.div>

      {/* MAIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.8 }}
        className={cardBase + " " + cardVariant}
      >
        {/* TABS */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex gap-2 rounded-full bg-black/30 p-1 border border-white/10">
            <button
              onClick={() => setActiveTab("quick")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                activeTab === "quick"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Quick Check
            </button>
            <button
              onClick={() => setActiveTab("deep")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                activeTab === "deep"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/50"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <ScanSearch className="w-4 h-4" />
              Deep / Universal Check
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
            <Sparkles className="w-3 h-3 text-blue-300" />
            <span>
              {activeTab === "quick"
                ? "Fast single-claim screening."
                : "Heavier check with URL + media support."}
            </span>
          </div>
        </div>

        {/* INPUTS */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Claim / statement
            </label>
            <textarea
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              rows={3}
              className={`w-full rounded-2xl px-3 py-2 text-sm md:text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/80 border ${
                isDarkCard
                  ? "bg-slate-900/80 border-white/10 text-slate-50 placeholder:text-slate-500"
                  : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
              }`}
              placeholder='Example: "The earth is flat and NASA is hiding the truth."'
            />
          </div>

          {activeTab === "deep" && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Optional URL (article / video)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                      <Link2 className="w-3.5 h-3.5" />
                    </div>
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className={`w-full rounded-2xl pl-8 pr-3 py-2 text-sm md:text-[15px] focus:outline-none focus:ring-2 focus:ring-violet-500/80 border ${
                        isDarkCard
                          ? "bg-slate-900/80 border-white/10 text-slate-50 placeholder:text-slate-500"
                          : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                      }`}
                      placeholder="https://example.com/suspicious-article"
                    />
                  </div>
                </div>
              </div>

              {/* MEDIA UPLOAD */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Optional image / video file
                </label>
                <div
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-xs cursor-pointer transition ${
                    isDarkCard
                      ? "border-dashed border-slate-600/70 bg-slate-900/70 hover:border-violet-400/70 hover:bg-slate-900/90"
                      : "border-dashed border-slate-300 bg-slate-100 hover:border-violet-400 hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    const input = document.getElementById(
                      "media-input",
                    ) as HTMLInputElement | null;
                    input?.click();
                  }}
                >
                  <div className="flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-sky-300" />
                    {mediaFile ? (
                      <span className="truncate max-w-[180px]">
                        {mediaFile.name}
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Drop or click to attach an image or video (optional)
                      </span>
                    )}
                  </div>
                  {mediaFile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaFile(null);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-300"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}
                  <input
                    id="media-input"
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setMediaFile(file);
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* CTA Row */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Sparkles className="w-3 h-3 text-blue-300" />
            <span>
              Your text and media are sent only to the Reality Check backend +
              OpenAI for analysis. No public sharing.
            </span>
          </div>

          <button
            onClick={handleRunCheck}
            disabled={isDisabled}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-violet-500 text-sm font-semibold shadow-[0_0_25px_rgba(56,189,248,0.75)] hover:shadow-[0_0_40px_rgba(124,58,237,0.9)] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
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

        {/* ERROR PANEL */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <p>{errorMsg}</p>
          </motion.div>
        )}

        {/* RESULT PANEL */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm md:text-[15px] space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {(() => {
                  const v = (result.verdict || "").toLowerCase();
                  if (["true", "accurate", "supported"].includes(v)) {
                    return (
                      <CircleCheck className="w-4 h-4 text-emerald-300" />
                    );
                  }
                  if (["false", "fake", "incorrect"].includes(v)) {
                    return <CircleX className="w-4 h-4 text-rose-300" />;
                  }
                  if (["mixed", "misleading", "unclear"].includes(v)) {
                    return (
                      <AlertTriangle className="w-4 h-4 text-amber-300" />
                    );
                  }
                  return <HelpCircle className="w-4 h-4 text-slate-300" />;
                })()}
                <span className="font-semibold text-slate-100">
                  Analysis Result
                </span>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-[11px] font-medium flex items-center gap-1 ${verdictStyle.color} ${verdictStyle.text}`}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                {verdictStyle.label}
              </div>
            </div>

            {confidencePct !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Confidence</span>
                  <span>{confidencePct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-700/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400"
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
              </div>
            )}

            {result.summary && (
              <p className="text-slate-100 leading-relaxed">
                {result.summary}
              </p>
            )}

            {result.notes && (
              <p className="text-[12px] text-slate-400 whitespace-pre-line">
                {result.notes}
              </p>
            )}

            {result.url && (
              <div className="pt-1 border-t border-white/5 mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                <Link2 className="w-3 h-3" />
                <span className="truncate">
                  Checked URL:{" "}
                  <span className="text-sky-300">{result.url}</span>
                </span>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* FOOTER */}
      <motion.footer
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-8 text-[11px] text-slate-500 text-center"
      >
        <div>Reality Check AI · © {new Date().getFullYear()}</div>
        <div className="text-slate-500/80">
          Built for stronger reasoning, safer information, and deepfake
          awareness.
        </div>
      </motion.footer>
    </div>
  );
}

