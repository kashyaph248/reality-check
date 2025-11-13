"use client";

import React, {
  useCallback,
  useState,
  FormEvent,
  ChangeEvent,
} from "react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

type VerifyResult = any;

interface UniversalResult {
  status?: string;
  analysis_type?: string;
  media_kind?: string;
  summary?: string;
  verdict?: string;
  confidence?: number;
  key_signals?: string[];
  cautions?: string[];
  source?: string;
  raw?: any;
  error?: string;
}

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function HomePage() {
  // Quick claim state
  const [claim, setClaim] = useState("the earth is flat");
  const [url, setUrl] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  // Universal / media state
  const [uniClaim, setUniClaim] = useState("");
  const [uniUrl, setUniUrl] = useState("");
  const [uniFile, setUniFile] = useState<File | null>(null);
  const [deepCheck, setDeepCheck] = useState(true);
  const [universalLoading, setUniversalLoading] = useState(false);
  const [universalError, setUniversalError] = useState<string | null>(null);
  const [universalResult, setUniversalResult] = useState<UniversalResult | null>(
    null
  );
  const [showRawUniversal, setShowRawUniversal] = useState(false);

  // Quick claim submit
  const handleQuickSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!claim && !url) {
        setVerifyError("Please provide a claim or a URL.");
        return;
      }

      setVerifyLoading(true);
      setVerifyError(null);
      setVerifyResult(null);

      try {
        const res = await fetch(`${BACKEND_URL}/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            claim: claim || null,
            url: url || null,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Verify failed (${res.status}): ${text || res.statusText}`
          );
        }

        const data = await res.json();
        setVerifyResult(data);
      } catch (err: any) {
        console.error("Verify error:", err);
        setVerifyError(err.message || "Failed to verify claim.");
      } finally {
        setVerifyLoading(false);
      }
    },
    [claim, url]
  );

  // File change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUniFile(file);
  };

  // Universal submit
  const handleUniversalSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!uniClaim && !uniUrl && !uniFile) {
        setUniversalError("Please provide a claim, URL, or upload a file.");
        return;
      }

      setUniversalLoading(true);
      setUniversalError(null);
      setUniversalResult(null);
      setShowRawUniversal(false);

      try {
        const formData = new FormData();
        if (uniClaim) formData.append("claim", uniClaim);
        if (uniUrl) formData.append("url", uniUrl);
        if (uniFile) formData.append("file", uniFile);
        // Backend treats this as a toggle, OK if it ignores it
        formData.append("deep", deepCheck ? "true" : "false");

        const res = await fetch(`${BACKEND_URL}/universal-check`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Universal check failed (${res.status}): ${
              text || res.statusText
            }`
          );
        }

        const data: UniversalResult = await res.json();
        setUniversalResult(data);
      } catch (err: any) {
        console.error("Universal check error:", err);
        setUniversalError(err.message || "Failed to run universal check.");
      } finally {
        setUniversalLoading(false);
      }
    },
    [uniClaim, uniUrl, uniFile, deepCheck]
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:pt-8">
        {/* NAVBAR */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/40">
              RC
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-slate-100">
                Reality Check AI
              </div>
              <div className="text-xs text-slate-400">
                Built by Himanshu • AI + Web + Media Forensics
              </div>
            </div>
          </div>
          <nav className="hidden gap-6 text-xs font-medium text-slate-300 sm:flex">
            <a href="#playground" className="hover:text-cyan-400">
              Playground
            </a>
            <a href="#features" className="hover:text-cyan-400">
              Features
            </a>
            <a href="#faq" className="hover:text-cyan-400">
              FAQ
            </a>
          </nav>
        </header>

        {/* HERO */}
        <section className="mt-10 grid gap-10 md:grid-cols-[1.2fr,0.9fr] md:items-start">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              AI-assisted verification for{" "}
              <span className="text-cyan-400">claims, links, images & video</span>.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-300 md:text-base">
              Reality Check AI helps you quickly screen misinformation, AI-generated
              media, and sus content. Use the quick claim check for fast answers,
              or the deep / universal check to analyze files, URLs, and scripts.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-300">
              <span className="rounded-full bg-slate-800/70 px-3 py-1">
                ✅ Fast factual screening
              </span>
              <span className="rounded-full bg-slate-800/70 px-3 py-1">
                🎥 Image & video forensics (demo)
              </span>
              <span className="rounded-full bg-slate-800/70 px-3 py-1">
                🔐 No login required
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#playground"
                className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 hover:bg-cyan-400"
              >
                Try a live check
              </a>
              <p className="text-xs text-slate-400">
                Backend:{" "}
                <span className="font-mono text-[11px] text-cyan-300">
                  {BACKEND_URL}
                </span>
              </p>
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl shadow-black/40">
            <h2 className="text-sm font-semibold text-slate-100">
              How it works
            </h2>
            <ol className="space-y-3 text-xs text-slate-300">
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/10 text-[11px] text-cyan-400 ring-1 ring-cyan-500/40">
                  1
                </span>
                <div>
                  <div className="font-medium text-slate-100">
                    Send a claim, URL, or file
                  </div>
                  <p className="text-slate-400">
                    Paste text for fact-checking, or upload an image / video for
                    media analysis.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/10 text-[11px] text-cyan-400 ring-1 ring-cyan-500/40">
                  2
                </span>
                <div>
                  <div className="font-medium text-slate-100">
                    Reality Check API analyzes it
                  </div>
                  <p className="text-slate-400">
                    The backend uses AI plus rules to generate a verdict, confidence,
                    sources, and key signals.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/10 text-[11px] text-cyan-400 ring-1 ring-cyan-500/40">
                  3
                </span>
                <div>
                  <div className="font-medium text-slate-100">
                    You get a clear summary
                  </div>
                  <p className="text-slate-400">
                    See a human-readable summary, verdict, confidence, plus optional
                    raw JSON for developers.
                  </p>
                </div>
              </li>
            </ol>
            <p className="mt-2 text-[11px] text-slate-500">
              ⚠️ For elections, legal evidence, or real-world harm, always combine
              Reality Check with professional forensics & multiple tools.
            </p>
          </div>
        </section>

        {/* PLAYGROUND */}
        <section id="playground" className="mt-12 space-y-10">
          {/* QUICK CLAIM CHECK */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Quick Claim Check
                </h2>
                <p className="text-xs text-slate-400">
                  Fast factual screening for short claims or tweets.
                </p>
              </div>
              <span className="text-[11px] font-medium text-emerald-400">
                Fast factual screening
              </span>
            </div>

            <form
              onSubmit={handleQuickSubmit}
              className="mt-4 space-y-3 text-sm"
            >
              <div>
                <label className="mb-1 block text-xs text-slate-300">
                  Claim
                </label>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-cyan-500/40 focus:border-cyan-500 focus:ring-1"
                  placeholder='e.g. "The earth is flat"'
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300">
                  News / Tweet / Video URL (optional)
                </label>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-cyan-500/40 focus:border-cyan-500 focus:ring-1"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              {verifyError && (
                <p className="text-xs text-rose-400">Verify error: {verifyError}</p>
              )}

              <button
                type="submit"
                disabled={verifyLoading}
                className={classNames(
                  "mt-2 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold shadow-md",
                  verifyLoading
                    ? "bg-slate-600 text-slate-200"
                    : "bg-cyan-500 text-slate-950 shadow-cyan-500/40 hover:bg-cyan-400"
                )}
              >
                {verifyLoading ? "Checking..." : "Run Reality Check"}
              </button>
            </form>

            {/* Quick result */}
            {verifyResult && (
              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <h3 className="text-xs font-semibold text-slate-100">
                  Quick Check Result
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  This raw output comes directly from the Reality Check API
                  /verify endpoint.
                </p>
                <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-slate-950 px-3 py-2 text-[11px] leading-relaxed text-slate-100">
                  {JSON.stringify(verifyResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* UNIVERSAL / MEDIA CHECK */}
          <div className="rounded-2xl border border-violet-700/60 bg-slate-900/80 p-5 shadow-xl shadow-violet-900/50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Deep / Universal Check
                </h2>
                <p className="text-xs text-slate-400">
                  Analyze claims, URLs, and uploaded media for AI-generation,
                  deepfakes, and suspicious patterns.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-medium text-violet-200">
                <span>Deep Check</span>
                <button
                  type="button"
                  onClick={() => setDeepCheck((v) => !v)}
                  className={classNames(
                    "h-5 w-9 rounded-full border border-violet-500/60 bg-slate-900 px-[2px] transition",
                    deepCheck ? "bg-violet-500/60" : "bg-slate-900"
                  )}
                >
                  <span
                    className={classNames(
                      "block h-4 w-4 rounded-full bg-white transition",
                      deepCheck ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </label>
            </div>

            <form
              onSubmit={handleUniversalSubmit}
              className="mt-4 space-y-3 text-sm"
            >
              <div>
                <label className="mb-1 block text-xs text-slate-300">
                  Claim / Script / Suspicious content (optional)
                </label>
                <textarea
                  className="min-h-[70px] w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-violet-500/40 focus:border-violet-500 focus:ring-1"
                  placeholder="Paste any claim, script, or suspicious content..."
                  value={uniClaim}
                  onChange={(e) => setUniClaim(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300">
                  URL to inspect (optional)
                </label>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-violet-500/40 focus:border-violet-500 focus:ring-1"
                  placeholder="https://example.com/video-or-article"
                  value={uniUrl}
                  onChange={(e) => setUniUrl(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-300">
                    Or upload an image / video
                  </label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="block text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-violet-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950 hover:file:bg-violet-400"
                  />
                  {uniFile && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Selected: <span className="font-medium">{uniFile.name}</span>
                    </p>
                  )}
                </div>
              </div>

              {universalError && (
                <p className="text-xs text-rose-400">
                  Universal check error: {universalError}
                </p>
              )}

              <button
                type="submit"
                disabled={universalLoading}
                className={classNames(
                  "mt-3 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold shadow-md",
                  universalLoading
                    ? "bg-slate-600 text-slate-200"
                    : "bg-violet-500 text-slate-50 shadow-violet-500/40 hover:bg-violet-400"
                )}
              >
                {universalLoading ? "Analyzing..." : "Run Universal Check"}
              </button>
            </form>

            {/* Universal result */}
            {universalResult && (
              <div className="mt-5 space-y-4 rounded-xl border border-violet-700/60 bg-slate-950/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-100">
                      Universal Check Result
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Type:{" "}
                      <span className="font-medium text-violet-200">
                        {universalResult.analysis_type || "unknown"}
                      </span>{" "}
                      {universalResult.media_kind && (
                        <>
                          • Media:{" "}
                          <span className="font-medium text-violet-200">
                            {universalResult.media_kind}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  {typeof universalResult.confidence === "number" && (
                    <div className="rounded-full bg-slate-900 px-3 py-1 text-right text-[11px]">
                      <div className="uppercase tracking-wide text-slate-400">
                        Confidence
                      </div>
                      <div className="font-semibold text-emerald-400">
                        {(universalResult.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {universalResult.summary && (
                    <p className="text-sm text-slate-200">
                      <span className="font-semibold text-slate-100">
                        Summary:{" "}
                      </span>
                      {universalResult.summary}
                    </p>
                  )}

                  {universalResult.verdict && (
                    <p className="text-sm">
                      <span className="font-semibold text-slate-100">
                        Verdict:{" "}
                      </span>
                      <span
                        className={classNames(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          universalResult.verdict.includes("ai")
                            ? "bg-amber-500/20 text-amber-300"
                            : universalResult.verdict.includes("real")
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-700/60 text-slate-100"
                        )}
                      >
                        {universalResult.verdict}
                      </span>
                    </p>
                  )}
                </div>

                {universalResult.key_signals && (
                  <div className="space-y-1 text-sm">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Key signals
                    </div>
                    <ul className="list-disc space-y-1 pl-5 text-xs text-slate-300">
                      {universalResult.key_signals.map((signal, i) => (
                        <li key={i}>{signal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {universalResult.cautions && (
                  <div className="space-y-1 text-sm">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Cautions
                    </div>
                    <ul className="list-disc space-y-1 pl-5 text-xs text-slate-300">
                      {universalResult.cautions.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {universalResult.source && (
                  <p className="text-[11px] text-slate-500">
                    Source:{" "}
                    <span className="font-mono text-[11px] text-slate-300">
                      {universalResult.source}
                    </span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setShowRawUniversal((v) => !v)}
                  className="mt-2 text-[11px] font-medium text-violet-300 hover:text-violet-200"
                >
                  {showRawUniversal ? "Hide raw JSON" : "Show raw JSON"}
                </button>

                {showRawUniversal && (
                  <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-slate-950 px-3 py-2 text-[11px] leading-relaxed text-slate-100">
                    {JSON.stringify(universalResult, null, 2)}
                  </pre>
                )}
              </div>
            )}

            <p className="mt-3 text-[11px] text-slate-500">
              For humans: Use this result as a signal, not absolute proof. For
              elections, legal evidence, or real-world harm, always combine Reality
              Check with professional forensics and multiple tools.
            </p>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="mt-14 space-y-6">
          <h2 className="text-sm font-semibold text-slate-100">
            Why Reality Check AI?
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
              <h3 className="text-xs font-semibold text-slate-100">
                Built for misinformation
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                Quickly screen viral claims, political tweets, or YouTube titles.
                Catch red flags before they spread.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
              <h3 className="text-xs font-semibold text-slate-100">
                Media forensics demo
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                Upload AI-style images & videos to experiment with AI generation
                detection and risk scoring.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
              <h3 className="text-xs font-semibold text-slate-100">
                Developer-friendly
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                Raw JSON is always available, so you can plug Reality Check into
                your own dashboards or moderation tools.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mt-14 space-y-4">
          <h2 className="text-sm font-semibold text-slate-100">FAQ</h2>
          <div className="space-y-3 text-xs text-slate-300">
            <div>
              <p className="font-semibold text-slate-100">
                Is this production-grade detection?
              </p>
              <p className="text-slate-400">
                Right now this is a demo / prototype. It’s useful as a signal, but
                not a replacement for professional fact-checking or forensic labs.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-100">
                What happens to uploaded media?
              </p>
              <p className="text-slate-400">
                Files are sent to the Reality Check backend for analysis. In a
                production setup you would add encryption, storage policies, and
                deletion windows.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-100">
                Can I plug this into my own app?
              </p>
              <p className="text-slate-400">
                Yes. The backend exposes simple REST endpoints (/verify and
                /universal-check) that you can call from any language or platform.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-10 border-t border-slate-900 pt-4 text-center text-[11px] text-slate-500">
          Reality Check AI &copy; {new Date().getFullYear()} • Built by Himanshu ·
          AI + Web + Media Forensics
        </footer>
      </div>
    </main>
  );
}

