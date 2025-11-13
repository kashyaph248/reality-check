"use client";

import React from "react";

/* ---------- Types ---------- */

type Mode = "quick" | "deep";

type Verdict =
  | "likely_true"
  | "likely_false"
  | "unsure"
  | "unknown"
  | "true"
  | "false"
  | string;

interface AnalysisResult {
  verdict: Verdict;
  confidence: number; // 0–100
  summary: string;
  reasoning: string;
  suggestions?: string;
}

type Star = {
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
};

/* ---------- Config from env ---------- */

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const QUICK_ENDPOINT =
  process.env.NEXT_PUBLIC_QUICK_ENDPOINT || "/api/verify";

const DEEP_ENDPOINT =
  process.env.NEXT_PUBLIC_DEEP_ENDPOINT || "/api/universal-check";

/* ---------- Demo example claims ---------- */

const examples = [
  `The earth is flat and NASA is hiding the truth.`,
  "This new coin will 100x next month, guaranteed.",
  "Drinking 8 liters of water a day will detox all diseases.",
];

/* ---------- Background helpers ---------- */

function createStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const top = `${Math.random() * 100}%`;
    const left = `${Math.random() * 100}%`;
    const size = Math.random() * 2 + 1; // 1–3px
    const delay = `${Math.random() * 4}s`;
    const duration = `${3 + Math.random() * 4}s`; // 3–7s
    stars.push({ top, left, size, delay, duration });
  }
  return stars;
}

/* ---------- Background component (stars + glow) ---------- */

function Background() {
  // Smaller star count so it’s smooth
  const [stars, setStars] = React.useState<Star[]>([]);

  React.useEffect(() => {
    const generated = createStars(80);
    setStars(generated);
  }, []);

  return (
    <>
      {/* Deep space gradient */}
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.35),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.5),transparent_60%),#020617]" />

      {/* Twinkling stars */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {stars.map((star, idx) => (
          <span
            key={idx}
            className="twinkle absolute rounded-full bg-white/90"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </div>

      {/* Soft top glow */}
      <div className="pointer-events-none fixed -top-44 left-1/2 -z-10 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.7),transparent_70%)] blur-3xl opacity-80" />

      {/* Bottom-right purple glow */}
      <div className="pointer-events-none fixed bottom-[-8rem] right-[-6rem] -z-10 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.75),transparent_70%)] blur-3xl opacity-80" />
    </>
  );
}

/* ---------- Result UI helpers ---------- */

const verdictLabels: Record<string, string> = {
  likely_true: "Likely True",
  true: "Likely True",
  likely_false: "Likely False",
  false: "Likely False",
  unsure: "Unclear / Mixed",
  unknown: "Unknown",
  uncertain: "Uncertain",
};

const verdictStyles: Record<string, string> = {
  likely_true:
    "bg-emerald-500/10 text-emerald-300 border-emerald-400/40",
  true: "bg-emerald-500/10 text-emerald-300 border-emerald-400/40",
  likely_false:
    "bg-rose-500/10 text-rose-200 border-rose-400/40",
  false: "bg-rose-500/10 text-rose-200 border-rose-400/40",
  unsure:
    "bg-amber-500/10 text-amber-200 border-amber-400/40",
  unknown:
    "bg-slate-500/10 text-slate-200 border-slate-400/40",
  uncertain:
    "bg-amber-500/10 text-amber-200 border-amber-400/40",
};

function friendlyVerdict(v: Verdict): string {
  const key = String(v || "unknown").toLowerCase();
  return verdictLabels[key] || String(v || "Unknown");
}

function verdictClass(v: Verdict): string {
  const key = String(v || "unknown").toLowerCase();
  return (
    verdictStyles[key] ||
    "bg-slate-500/10 text-slate-200 border-slate-400/40"
  );
}

function AnalysisResultCard({ result }: { result: AnalysisResult }) {
  const { verdict, confidence, summary, reasoning, suggestions } = result;

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-inner">
      {/* Verdict row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${verdictClass(
              verdict
            )}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {friendlyVerdict(verdict)}
          </span>
          <span className="text-xs text-slate-400">
            Confidence:{" "}
            <span className="font-semibold text-slate-100">
              {confidence.toFixed(0)}%
            </span>
          </span>
        </div>

        {/* Confidence bar */}
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-sky-400 transition-all"
            style={{
              width: `${Math.min(100, Math.max(0, confidence))}%`,
            }}
          />
        </div>
      </div>

      {/* Summary */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          Summary
        </p>
        <p className="mt-1 text-sm text-slate-100">
          {summary || "No summary available."}
        </p>
      </div>

      {/* Reasoning */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          Why this verdict?
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-200">
          {reasoning || "No reasoning provided."}
        </p>
      </div>

      {/* Suggestions */}
      {suggestions && suggestions.trim().length > 0 && (
        <div className="rounded-xl bg-slate-900/80 p-3 text-sm text-sky-100">
          <p className="text-[11px] uppercase tracking-wide text-sky-300">
            What you can do
          </p>
          <p className="mt-1 text-sm text-sky-50">{suggestions}</p>
        </div>
      )}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
      <span className="mt-0.5 text-lg">⚠️</span>
      <div>
        <p className="font-medium">Something went wrong analyzing this.</p>
        <p className="text-xs text-rose-100/80">
          {message || "Please try again in a moment or tweak the claim."}
        </p>
      </div>
    </div>
  );
}

function ExampleChips({ onSelect }: { onSelect: (value: string) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {examples.map((ex) => (
        <button
          key={ex}
          type="button"
          onClick={() => onSelect(ex)}
          className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-sky-500/60 hover:bg-slate-900/90 hover:text-sky-200"
        >
          {ex}
        </button>
      ))}
    </div>
  );
}

/* ---------- Main page component ---------- */

export default function HomePage() {
  const [mode, setMode] = React.useState<Mode>("quick");
  const [claim, setClaim] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
    } else {
      setFile(null);
    }
  };

  /** Helper: parse backend "analysis" field (string JSON) into our shape */
  function mapBackendResponse(data: any): AnalysisResult {
    let verdict: Verdict = "unknown";
    let summary = "";
    let reasoning = "";
    let suggestions = "";
    let confidence = 85;

    if (data.verdict) verdict = data.verdict;
    if (data.explanation) reasoning = data.explanation;
    if (data.summary) summary = data.summary;
    if (data.suggestions) suggestions = data.suggestions;

    const rawAnalysis = (data as any).analysis;
    if (typeof rawAnalysis === "string") {
      try {
        const parsed = JSON.parse(rawAnalysis);
        if (parsed.verdict) verdict = parsed.verdict;
        if (parsed.explanation) reasoning = parsed.explanation;
        if (parsed.summary) summary = parsed.summary;
        if (parsed.suggestions) suggestions = parsed.suggestions;
        if (typeof parsed.confidence === "number") {
          confidence = Math.round(
            parsed.confidence <= 1 ? parsed.confidence * 100 : parsed.confidence
          );
        }
      } catch {
        if (!reasoning) reasoning = rawAnalysis;
      }
    } else if (rawAnalysis && typeof rawAnalysis === "object") {
      if (rawAnalysis.verdict) verdict = rawAnalysis.verdict;
      if (rawAnalysis.explanation) reasoning = rawAnalysis.explanation;
      if (rawAnalysis.summary) summary = rawAnalysis.summary;
      if (rawAnalysis.suggestions) suggestions = rawAnalysis.suggestions;
      if (typeof rawAnalysis.confidence === "number") {
        confidence = Math.round(
          rawAnalysis.confidence <= 1
            ? rawAnalysis.confidence * 100
            : rawAnalysis.confidence
        );
      }
    }

    return {
      verdict,
      confidence,
      summary,
      reasoning,
      suggestions,
    };
  }

  async function handleAnalyze(e?: React.FormEvent) {
    if (e) e.preventDefault();

    const hasFile = !!file;
    const hasTextInput =
      claim.trim().length > 0 || url.trim().length > 0 || hasFile;

    if (!hasTextInput) {
      setError(
        "Please enter a claim or URL, or attach an image/video to analyze."
      );
      return;
    }

    if (!API_BASE_URL) {
      setError(
        "API base URL is not set. Check NEXT_PUBLIC_BACKEND_URL in .env.local."
      );
      return;
    }

    const claimToSend =
      claim.trim().length > 0
        ? claim.trim()
        : hasFile
        ? "Please analyze the attached media for authenticity and misleading content."
        : "";

    const urlToSend = url.trim() || null;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let res: Response;

      // 🔥 IMPORTANT:
      // If there is a file, ALWAYS send multipart/form-data to the DEEP endpoint.
      if (hasFile && file) {
        const fullUrl = `${API_BASE_URL}${DEEP_ENDPOINT}`;
        console.log("Calling backend (media):", fullUrl);

        const formData = new FormData();
        if (claimToSend) formData.append("claim", claimToSend);
        if (urlToSend) formData.append("url", urlToSend);

        // Send under several possible field names so backend definitely sees it
        formData.append("file", file);
        formData.append("media", file);
        formData.append("upload", file);
        formData.append("media_file", file);

        res = await fetch(fullUrl, {
          method: "POST",
          body: formData,
        });
      } else {
        // No file: normal JSON call to quick or deep endpoint
        const endpoint = mode === "quick" ? QUICK_ENDPOINT : DEEP_ENDPOINT;
        const fullUrl = `${API_BASE_URL}${endpoint}`;
        console.log("Calling backend (text-only):", fullUrl);

        res = await fetch(fullUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            claim: claimToSend || null,
            url: urlToSend,
          }),
        });
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Backend returned an error.");
      }

      const data = await res.json();
      console.log("Backend response:", data);

      const mapped = mapBackendResponse(data);
      setResult(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error while talking to backend.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) {
        void handleAnalyze();
      }
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Background />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-6 sm:px-8 sm:pt-10">
        {/* Top bar with logo + dark-mode pill */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20 text-sm font-semibold text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.7)]">
              RC
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] tracking-[0.18em] text-slate-400">
                REALITY CHECK AI
              </span>
              <span className="text-xs text-slate-500">
                Spot misinformation, fake news, and deepfakes.
              </span>
            </div>
          </div>

          <button className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 shadow-sm shadow-black/50 hover:border-sky-500/50 hover:text-sky-200">
            <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
            Dark mode
          </button>
        </header>

        {/* Hero title + subtitle */}
        <section className="mb-8 text-center sm:mb-10">
          <h1 className="text-shadow-xl text-3xl font-semibold tracking-tight text-slate-100 sm:text-5xl">
            <span className="text-slate-100">Reality Check</span>{" "}
            <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          <p className="mt-3 mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
            Paste a claim or link and let AI help you spot misinformation,
            fake news, and suspicious content.
          </p>
        </section>

        {/* Main card */}
        <section className="relative mx-auto w-full max-w-4xl">
          {/* Card glow */}
          <div className="pointer-events-none absolute inset-x-10 -bottom-10 h-32 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.6),transparent_70%)] blur-3xl opacity-80" />

          <div className="relative rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-[0_0_60px_rgba(15,23,42,0.95)] backdrop-blur-2xl sm:p-7">
            {/* Top row: tabs + small info chips */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-full border border-slate-800 bg-slate-900/80 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMode("quick")}
                  className={`flex-1 rounded-full px-4 py-1.5 transition ${
                    mode === "quick"
                      ? "bg-sky-500 text-slate-950 shadow shadow-sky-500/40"
                      : "text-slate-300 hover:text-sky-200"
                  }`}
                >
                  Quick Check
                </button>
                <button
                  type="button"
                  onClick={() => setMode("deep")}
                  className={`flex-1 rounded-full px-4 py-1.5 transition ${
                    mode === "deep"
                      ? "bg-fuchsia-500 text-slate-950 shadow shadow-fuchsia-500/40"
                      : "text-slate-300 hover:text-fuchsia-200"
                  }`}
                >
                  Deep / Universal Check
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Heavier check with URL + media support
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAnalyze}>
              {/* Claim */}
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Claim / statement
              </label>
              <textarea
                ref={textareaRef}
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-500/70 focus:bg-slate-950 focus:ring-2 focus:ring-sky-500/40"
                placeholder={`Example: "The earth is flat and NASA is hiding the truth."`}
              />

              <ExampleChips onSelect={setClaim} />

              {/* URL field */}
              <div className="mt-4">
                <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  OPTIONAL URL (ARTICLE / VIDEO)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/suspicious-article"
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-500/70 focus:bg-slate-950 focus:ring-2 focus:ring-sky-500/40"
                />
              </div>

              {/* File field */}
              <div className="mt-4">
                <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  OPTIONAL IMAGE / VIDEO FILE
                </label>
                <div
                  className="mt-2 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 px-3 py-3 text-xs text-slate-400 hover:border-sky-500/60 hover:bg-slate-900/80"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span>
                    {file
                      ? `Selected: ${file.name}`
                      : "Drop or click to attach an image or video (optional)"}
                  </span>
                  <span className="rounded-full border border-slate-600 bg-slate-900/70 px-2 py-0.5 text-[10px]">
                    Browse
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Footer row */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-xs text-[11px] text-slate-500">
                  Your text and media are sent only to the Reality Check
                  backend + OpenAI for analysis. No public sharing.
                </p>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-fuchsia-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:from-sky-400 hover:to-fuchsia-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300 disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border border-slate-900 border-t-slate-100" />
                      Analyzing…
                    </>
                  ) : (
                    <>Run Reality Check</>
                  )}
                </button>
              </div>
            </form>

            {/* Analysis section */}
            <div className="mt-6 rounded-2xl border border-slate-700/80 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-100">
                    Analysis Result
                  </span>
                  {result ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] ${verdictClass(
                        result.verdict
                      )}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {friendlyVerdict(result.verdict)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-900/80 px-2.5 py-0.5 text-[11px] text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      Unknown
                    </span>
                  )}
                </div>
              </div>

              {result && <AnalysisResultCard result={result} />}
              {error && <ErrorBanner message={error} />}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 text-center text-[11px] text-slate-500">
          Reality Check AI · © 2025 · Built for stronger reasoning, safer
          information, and deepfake awareness.
        </footer>
      </main>
    </div>
  );
}

