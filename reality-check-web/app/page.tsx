"use client";

import { useState } from "react";

type VerifyResult = {
  verdict: string;
  confidence: number;
  supporting_sources?: string[];
  contradicting_sources?: string[];
  reasoning?: string[];
};

type CandidateSource = {
  title?: string;
  url: string;
};

type UniversalResult = {
  type?: string;
  verdict?: string;
  confidence?: number;
  ai_style_likelihood?: number;
  signals?: string[];
  caveats?: string[];
  provider?: string;
  candidate_sources?: CandidateSource[];
};

type QuickHistoryItem = {
  inputText: string;
  inputUrl: string;
  result: VerifyResult;
  ts: number;
};

type UniversalHistoryItem = {
  inputText: string;
  inputUrl: string;
  fileName?: string | null;
  mode: "standard" | "deep";
  result: UniversalResult;
  ts: number;
};

const verdictLabel: Record<string, string> = {
  true: "Likely True",
  false: "Likely False",
  mixed: "Partially True",
  unclear: "Unclear / Not Enough Data",
};

const verdictColor: Record<string, string> = {
  true: "bg-emerald-500/90 text-emerald-50",
  false: "bg-rose-500/90 text-rose-50",
  mixed: "bg-amber-500/90 text-amber-950",
  unclear: "bg-slate-600/90 text-slate-50",
};

const verdictIcon: Record<string, string> = {
  true: "🟢",
  false: "🔴",
  mixed: "🟠",
  unclear: "❔",
};

const universalVerdictLabel: Record<string, string> = {
  ai_generated: "AI-Generated",
  likely_real: "Likely Real",
  deepfake: "Possible Deepfake",
  suspicious: "Suspicious",
  likely_trustworthy: "Likely Trustworthy",
  unclear: "Unclear",
};

const universalVerdictColor: Record<string, string> = {
  ai_generated: "bg-rose-500/90 text-rose-50",
  deepfake: "bg-orange-500/90 text-orange-50",
  likely_real: "bg-emerald-500/90 text-emerald-50",
  likely_trustworthy: "bg-emerald-500/90 text-emerald-50",
  suspicious: "bg-amber-500/90 text-amber-950",
  unclear: "bg-slate-600/90 text-slate-50",
};

const universalVerdictIcon: Record<string, string> = {
  ai_generated: "🧪",
  likely_real: "🟢",
  deepfake: "🕵️",
  suspicious: "⚠️",
  likely_trustworthy: "✅",
  unclear: "❔",
};

function getDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function Home() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Quick / standard verify
  const [inputText, setInputText] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [quickHistory, setQuickHistory] = useState<QuickHistoryItem[]>([]);

  // Universal / deep
  const [deepMode, setDeepMode] = useState(false);
  const [universalText, setUniversalText] = useState("");
  const [universalUrl, setUniversalUrl] = useState("");
  const [universalFile, setUniversalFile] = useState<File | null>(null);
  const [universalLoading, setUniversalLoading] = useState(false);
  const [universalError, setUniversalError] = useState("");
  const [universalResult, setUniversalResult] =
    useState<UniversalResult | null>(null);
  const [universalHistory, setUniversalHistory] = useState<
    UniversalHistoryItem[]
  >([]);

  // --- Quick Claim Check (uses /api/verify) ---
  const runVerify = async () => {
    setVerifyError("");
    setVerifyResult(null);

    if (!inputText && !inputUrl) {
      setVerifyError("Enter a claim or a URL to verify.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText || null,
          url: inputUrl || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Verification failed.");
      }

      const data: VerifyResult = await res.json();
      setVerifyResult(data);

      const item: QuickHistoryItem = {
        inputText,
        inputUrl,
        result: data,
        ts: Date.now(),
      };
      setQuickHistory((prev) => [item, ...prev].slice(0, 5));
    } catch (e: any) {
      setVerifyError(
        e?.message?.includes("Failed to fetch")
          ? "Cannot reach Reality Check API. Is the backend running?"
          : e.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Universal / Deep Check (uses /api/universal-check) ---
  const runUniversal = async () => {
    setUniversalError("");
    setUniversalResult(null);

    if (!universalText && !universalUrl && !universalFile) {
      setUniversalError("Provide text, URL, or upload an image/video.");
      return;
    }

    try {
      setUniversalLoading(true);
      const form = new FormData();
      form.append("mode", deepMode ? "deep" : "standard");
      if (universalText) form.append("text", universalText);
      if (universalUrl) form.append("url", universalUrl);
      if (universalFile) form.append("file", universalFile);

      const res = await fetch(`${apiBase}/universal-check`, {
        method: "POST",
        body: form,
      });

      const data: UniversalResult = await res.json();

      if (!res.ok) {
        throw new Error((data as any).error || "Universal check failed.");
      }

      setUniversalResult(data);

      const item: UniversalHistoryItem = {
        inputText: universalText,
        inputUrl: universalUrl,
        fileName: universalFile?.name || null,
        mode: deepMode ? "deep" : "standard",
        result: data,
        ts: Date.now(),
      };
      setUniversalHistory((prev) => [item, ...prev].slice(0, 5));
    } catch (e: any) {
      setUniversalError(
        e?.message?.includes("Failed to fetch")
          ? "Cannot reach Reality Check API. Is the backend running?"
          : e.message || "Something went wrong."
      );
    } finally {
      setUniversalLoading(false);
    }
  };

  // Quick verdict styling + TL;DR
  const quickKey = (verifyResult?.verdict || "").toLowerCase();
  const quickLabel =
    verdictLabel[quickKey] || verifyResult?.verdict?.toUpperCase() || "";
  const quickClass = verdictColor[quickKey] || verdictColor["unclear"];
  const quickIcon = verdictIcon[quickKey] || "❔";
  const quickConfidence = verifyResult
    ? Math.round((verifyResult.confidence || 0) * 100)
    : 0;

  const quickSummary =
    verifyResult &&
    (() => {
      switch (quickKey) {
        case "true":
          return "This looks reliable based on cross-checked information.";
        case "false":
          return "This appears incorrect or misleading. Do not rely on it.";
        case "mixed":
          return "Parts are true, but important details are wrong or missing.";
        case "unclear":
        default:
          return "Not enough solid evidence. Treat with caution.";
      }
    })();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">
            Reality Check
          </h1>
          <p className="text-slate-400 text-sm max-w-3xl">
            AI-assisted verification for claims, links, images, and video. Quick
            checks for fast answers. Deep / Universal Check for stronger
            reasoning and AI-generated & deepfake detection.
          </p>
        </header>

        {/* Quick Claim Check */}
        <section className="space-y-3 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-200">
              Quick Claim Check
            </h2>
            <span className="text-[10px] text-slate-500">
              Fast factual screening
            </span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder='Example: "The Earth is flat."'
            className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70"
          />

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] text-slate-500">or</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Paste a news / tweet / video URL"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70"
          />

          <button
            onClick={runVerify}
            disabled={loading}
            className="w-full mt-2 py-2 rounded-xl text-sm font-semibold bg-sky-500 hover:bg-sky-400 disabled:opacity-60 transition"
          >
            {loading ? "Checking..." : "Run Reality Check"}
          </button>

          {verifyError && (
            <p className="mt-1 text-[10px] text-rose-400 text-center">
              {verifyError}
            </p>
          )}

          {verifyResult && (
            <>
              {/* For Humans TL;DR */}
              {quickSummary && (
                <p className="mt-3 text-[10px] text-slate-100 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
                  <span className="font-semibold text-sky-400">
                    For humans:
                  </span>{" "}
                  {quickSummary}
                </p>
              )}

              {/* Detailed card */}
              <div className="mt-2 space-y-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-[10px]">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-semibold ${quickClass}`}
                    >
                      {quickIcon} {quickLabel}
                    </span>
                    <span className="text-[8px] text-slate-500 uppercase tracking-wide">
                      Quick Verdict
                    </span>
                  </div>
                  <div className="w-32">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[8px] text-slate-500">
                        Confidence
                      </span>
                      <span className="text-[9px] text-slate-200 font-semibold">
                        {quickConfidence}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500"
                        style={{
                          width: `${Math.max(5, quickConfidence)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {verifyResult.reasoning && (
                  <ul className="text-[10px] text-slate-300 list-disc list-inside space-y-1">
                    {verifyResult.reasoning.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}

                {verifyResult.supporting_sources &&
                  verifyResult.supporting_sources.length > 0 && (
                    <div>
                      <h3 className="text-[9px] font-semibold text-slate-300">
                        Supporting Sources
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {verifyResult.supporting_sources.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] text-emerald-300 hover:bg-emerald-500/20 transition"
                          >
                            {getDomain(url)}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </>
          )}

          {/* Quick History */}
          {quickHistory.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[8px] uppercase text-slate-500">
                  Recent quick checks
                </span>
                <button
                  onClick={() => {
                    setQuickHistory([]);
                    setVerifyResult(null);
                  }}
                  className="text-[8px] text-slate-500 hover:text-rose-400"
                >
                  Clear
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {quickHistory.map((h) => {
                  const key = (h.result.verdict || "").toLowerCase();
                  const icon = verdictIcon[key] || "❔";
                  const label =
                    verdictLabel[key] ||
                    h.result.verdict?.toUpperCase() ||
                    "Check";
                  const preview =
                    h.inputText?.slice(0, 30) ||
                    h.inputUrl?.slice(0, 30) ||
                    "No input";
                  return (
                    <button
                      key={h.ts}
                      onClick={() => setVerifyResult(h.result)}
                      className="px-2 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[8px] text-slate-300 hover:bg-slate-800 transition"
                    >
                      {icon} {label} • {preview}
                      {preview.length >= 30 ? "…" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Deep / Universal Check */}
        <section className="space-y-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-200">
              Deep / Universal Check
            </h2>
            <label className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>Deep Check</span>
              <button
                onClick={() => setDeepMode((v) => !v)}
                className={`w-9 h-4 rounded-full flex items-center px-0.5 transition ${
                  deepMode ? "bg-sky-500" : "bg-slate-600"
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    deepMode ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          </div>
          <p className="text-[10px] text-slate-500">
            Analyze claims, URLs, and uploaded media for AI-generation,
            deepfakes, and suspicious patterns. Includes suggested source links
            for images & video.
          </p>

          <textarea
            value={universalText}
            onChange={(e) => setUniversalText(e.target.value)}
            placeholder="Paste any claim, script, or suspicious content..."
            className="w-full h-18 bg-slate-950 border border-slate-800 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70"
          />

          <input
            type="url"
            value={universalUrl}
            onChange={(e) => setUniversalUrl(e.target.value)}
            placeholder="Or paste a URL to inspect"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70"
          />

          <div className="flex flex-col gap-1 text-[10px] text-slate-400">
            <label>Or upload an image / video</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) =>
                setUniversalFile(e.target.files?.[0] || null)
              }
              className="text-[10px] text-slate-300"
            />
          </div>

          <button
            onClick={runUniversal}
            disabled={universalLoading}
            className="w-full mt-2 py-2 rounded-xl text-sm font-semibold bg-violet-500 hover:bg-violet-400 disabled:opacity-60 transition"
          >
            {universalLoading
              ? "Running Deep / Universal Check..."
              : "Run Universal Check"}
          </button>

          {universalError && (
            <p className="mt-1 text-[10px] text-rose-400 text-center">
              {universalError}
            </p>
          )}

          {universalResult && (() => {
            const rawVerdict = (universalResult.verdict || "").toLowerCase();
            const uLabel =
              universalVerdictLabel[rawVerdict] ||
              universalResult.verdict ||
              "Result";
            const uClass =
              universalVerdictColor[rawVerdict] ||
              universalVerdictColor["unclear"];
            const uIcon =
              universalVerdictIcon[rawVerdict] ||
              universalVerdictIcon["unclear"];

            const uConf =
              typeof universalResult.confidence === "number"
                ? Math.round(universalResult.confidence * 100)
                : null;

            const aiStyle =
              typeof universalResult.ai_style_likelihood === "number"
                ? Math.round(universalResult.ai_style_likelihood * 100)
                : null;

            const candidates = universalResult.candidate_sources || [];

            const humanSummary = (() => {
              if (universalResult.type === "image") {
                if (rawVerdict === "ai_generated") {
                  return "Looks AI-generated. Don’t treat this as photographic proof.";
                }
                if (rawVerdict === "likely_real") {
                  return "Nothing obviously synthetic detected, but still verify context.";
                }
                return "Unclear from pixels alone. Cross-check with trusted sources.";
              }
              if (universalResult.type === "video") {
                if (rawVerdict === "deepfake" || rawVerdict === "ai_generated") {
                  return "High risk of synthetic/deepfake content. Do not trust this as real evidence.";
                }
                if (rawVerdict === "likely_real") {
                  return "Appears natural, but deepfakes can evade detection. Verify origin.";
                }
                return "Inconclusive. Use multiple tools and official sources.";
              }
              if (universalResult.type === "url") {
                if (rawVerdict === "likely_trustworthy") {
                  return "Domain looks reasonably credible, but always read critically.";
                }
                if (rawVerdict === "suspicious") {
                  return "Be careful. This source has risk signals; double-check elsewhere.";
                }
                return "Credibility unclear. Prefer well-known, verifiable outlets.";
              }
              if (universalResult.type === "text") {
                if (rawVerdict === "false") {
                  return "Content appears false or misleading. Do not rely on it.";
                }
                if (rawVerdict === "true") {
                  return "Generally consistent with known facts, but still verify key claims.";
                }
                if (rawVerdict === "mixed") {
                  return "Contains both accurate and misleading elements. Fact-check specifics.";
                }
                return "Unclear factual grounding. Treat with caution.";
              }
              return "Use this result as a signal, not absolute proof.";
            })();

            return (
              <div className="mt-3 space-y-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-[10px]">
                {/* For Humans TL;DR */}
                <p className="text-[10px] text-slate-100 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
                  <span className="font-semibold text-violet-400">
                    For humans:
                  </span>{" "}
                  {humanSummary}
                </p>

                {/* Top row */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-semibold ${uClass}`}
                    >
                      {uIcon} {uLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-[8px] text-slate-300">
                      {deepMode ? "Deep Check" : "Universal Check"}
                    </span>
                    {universalResult.type && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[8px] text-slate-400">
                        Type: {universalResult.type}
                      </span>
                    )}
                  </div>

                  {uConf !== null && (
                    <div className="w-32">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[8px] text-slate-500">
                          Confidence
                        </span>
                        <span className="text-[9px] text-slate-200 font-semibold">
                          {uConf}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500"
                          style={{
                            width: `${Math.max(5, uConf)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* AI-style likelihood bar (for text) */}
                {aiStyle !== null && (
                  <div>
                    <span className="text-[8px] text-slate-500">
                      AI-style likelihood (text)
                    </span>
                    <div className="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500"
                        style={{ width: `${aiStyle}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Signals */}
                {universalResult.signals &&
                  universalResult.signals.length > 0 && (
                    <div>
                      <h3 className="text-[9px] font-semibold text-slate-300">
                        Signals
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {universalResult.signals.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Caveats */}
                {universalResult.caveats &&
                  universalResult.caveats.length > 0 && (
                    <div>
                      <h3 className="text-[9px] font-semibold text-slate-300">
                        Caveats
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-slate-500">
                        {universalResult.caveats.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Candidate sources from reverse search */}
                {candidates.length > 0 && (
                  <div>
                    <h3 className="text-[9px] font-semibold text-slate-300">
                      Possible Source Matches (experimental)
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {candidates.map((c, i) => (
                        <a
                          key={i}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[9px] text-slate-200 hover:bg-slate-800 transition"
                        >
                          {c.title
                            ? `${c.title.slice(0, 40)}…`
                            : getDomain(c.url)}
                        </a>
                      ))}
                    </div>
                    <p className="mt-1 text-[8px] text-slate-500">
                      Suggested automatically from search. Always open and check
                      manually.
                    </p>
                  </div>
                )}

                <p className="pt-1 text-[8px] text-slate-500">
                  Results are probabilistic. For elections, legal evidence, or
                  real-world harm, always combine Reality Check with
                  professional forensics and multiple tools.
                </p>
              </div>
            );
          })()}

          {/* Universal History */}
          {universalHistory.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[8px] uppercase text-slate-500">
                  Recent deep / universal checks
                </span>
                <button
                  onClick={() => {
                    setUniversalHistory([]);
                    setUniversalResult(null);
                  }}
                  className="text-[8px] text-slate-500 hover:text-rose-400"
                >
                  Clear
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {universalHistory.map((h) => {
                  const rv = (h.result.verdict || "").toLowerCase();
                  const icon =
                    universalVerdictIcon[rv] || universalVerdictIcon["unclear"];
                  const label =
                    universalVerdictLabel[rv] ||
                    h.result.verdict ||
                    "Result";
                  const preview =
                    h.fileName ||
                    h.inputText?.slice(0, 24) ||
                    h.inputUrl?.slice(0, 24) ||
                    "Check";
                  return (
                    <button
                      key={h.ts}
                      onClick={() => setUniversalResult(h.result)}
                      className="px-2 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[8px] text-slate-300 hover:bg-slate-800 transition"
                    >
                      {icon} {label} • {preview}
                      {preview.length >= 24 ? "…" : ""} • {h.mode}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <footer className="text-center text-[9px] text-slate-600 pb-4">
          Reality Check © 2025 • Built by Himanshu • AI + Web + Media Forensics
        </footer>
      </div>
    </main>
  );
}

