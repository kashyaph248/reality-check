"use client";

import React, { useState } from "react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

type Mode = "claim" | "media";

type ClaimResult = {
  verdict: string;
  confidence: number;
  explanation?: string;
  sources?: { title: string; url: string }[];
};

type MediaResult = {
  verdict: string;
  confidence: number;
  media_type?: string;
  explanation?: string;
};

const STAR_COUNT = 120;

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("claim");
  const [claim, setClaim] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClaimResult | MediaResult | null>(null);

  // Generate stars once on first render so they don't move around
  const [stars] = useState(() =>
    Array.from({ length: STAR_COUNT }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() < 0.7 ? 1.5 : 2.5,
      delay: `${Math.random() * 4}s`,
      duration: `${2 + Math.random() * 3}s`,
    }))
  );

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setResult(null);
    setFile(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
    setError(null);

    if (selected) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    try {
      setLoading(true);

      if (mode === "claim") {
        if (!claim.trim()) {
          setError("Please enter a claim to check.");
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ claim }),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error("Verify error:", text);
          throw new Error("Backend returned an error for claim check.");
        }

        const data: ClaimResult = await response.json();
        setResult(data);
      } else {
        if (!file) {
          setError("Please upload an image or video file.");
          return;
        }

        const formData = new FormData();
        formData.append("media", file); // must match FastAPI param name

        const response = await fetch(`${BACKEND_URL}/api/universal-check`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const text = await response.text();
          console.error("Universal check error:", text);
          throw new Error("Backend returned an error for media check.");
        }

        const data: MediaResult = await response.json();
        setResult(data);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "Something went wrong talking to Reality Check API. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderConfidenceBar = (confidence?: number) => {
    if (confidence == null) return null;
    const percentage = Math.round(confidence * 100);
    let color = "bg-yellow-500";
    if (percentage >= 80) color = "bg-emerald-500";
    else if (percentage <= 40) color = "bg-rose-500";

    return (
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Confidence</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
          <div
            className={`${color} h-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    const verdict = (result as any).verdict || "Unknown";
    const explanation = (result as any).explanation;
    const sources = (result as any).sources;

    let verdictColor = "text-slate-100";
    if (/true/i.test(verdict)) verdictColor = "text-emerald-400";
    else if (/false|fake|misleading/i.test(verdict))
      verdictColor = "text-rose-400";
    else if (/uncertain|mixed/i.test(verdict)) verdictColor = "text-amber-300";

    return (
      <div className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 sm:p-5 shadow-xl shadow-black/40 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
          Result
        </p>

        <p className={`text-lg font-semibold ${verdictColor}`}>{verdict}</p>

        {renderConfidenceBar((result as any).confidence)}

        {explanation && (
          <div className="mt-4 space-y-1">
            <p className="text-xs font-medium text-slate-400">Why:</p>
            <p className="text-sm leading-relaxed text-slate-200/90">
              {explanation}
            </p>
          </div>
        )}

        {sources && Array.isArray(sources) && sources.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-400">
              Evidence &amp; sources:
            </p>
            <ul className="space-y-1 text-sm">
              {sources.map((src, idx) => (
                <li key={idx} className="text-sky-300 hover:text-sky-200">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-sky-500/60 decoration-dotted underline-offset-4"
                  >
                    {src.title || src.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-50 overflow-hidden">
      {/* Gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-30 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

      {/* Glow blobs */}
      <div className="pointer-events-none fixed inset-0 -z-20">
        <div className="absolute -top-40 left-0 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />
      </div>

      {/* Starfield layer */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        {stars.map((star) => (
          <span
            key={star.id}
            className="star"
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

      {/* Main content */}
      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {/* Top bar */}
        <header className="mb-8 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent">
                Reality Check
              </span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              AI-powered lie detector for news, photos, and videos.
            </p>
          </div>

          <div className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-[11px] text-slate-300 shadow shadow-black/30">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live • v0.1
          </div>
        </header>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Left: Input panel */}
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4 sm:p-6 shadow-2xl shadow-black/50 backdrop-blur-xl">
            {/* Tabs */}
            <div className="mb-4 flex gap-2 rounded-full bg-slate-900/80 p-1">
              <button
                type="button"
                onClick={() => handleModeChange("claim")}
                className={`flex-1 rounded-full px-3 py-2 text-xs sm:text-sm font-medium transition ${
                  mode === "claim"
                    ? "bg-sky-500 text-slate-950 shadow shadow-sky-500/40"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                Text Claim
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("media")}
                className={`flex-1 rounded-full px-3 py-2 text-xs sm:text-sm font-medium transition ${
                  mode === "media"
                    ? "bg-violet-500 text-slate-950 shadow shadow-violet-500/40"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                Photo / Video
              </button>
            </div>

            {/* Helper text */}
            <p className="mb-4 text-xs sm:text-[13px] text-slate-400">
              {mode === "claim" ? (
                <>
                  Paste a tweet, headline, or statement. We’ll check if it{" "}
                  <span className="text-sky-300">looks real</span> using web
                  evidence + reasoning.
                </>
              ) : (
                <>
                  Upload an{" "}
                  <span className="text-violet-300">image or short video</span>.
                  We’ll look for signs of AI generation and inconsistencies.
                </>
              )}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "claim" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    Claim / text to verify
                  </label>
                  <textarea
                    value={claim}
                    onChange={(e) => setClaim(e.target.value)}
                    rows={4}
                    placeholder='Example: "UAE is giving Golden Visas to everyone who stakes Toncoin."'
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/60"
                  />
                </div>
              )}

              {mode === "media" && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-300">
                    Upload image or video
                  </label>
                  <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-6 text-center text-xs text-slate-400 hover:border-sky-500/70 hover:bg-slate-900/60">
                    <span className="mb-2 text-sm font-medium text-slate-200">
                      Drop file here or click to browse
                    </span>
                    <span className="text-[11px] text-slate-500">
                      JPG, PNG, MP4, MOV • up to ~20 MB
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      onChange={handleFileChange}
                    />
                  </label>

                  {file && (
                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-300">
                          {file.type.startsWith("image") ? "IMG" : "VID"}
                        </div>
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                          setResult(null);
                        }}
                        className="ml-2 text-[11px] text-slate-400 hover:text-rose-300"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {previewUrl && file && file.type.startsWith("image") && (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-56 w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-violet-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-[2px] border-slate-900 border-t-transparent" />
                    Checking with Reality Check…
                  </>
                ) : (
                  <>
                    <span>Run Reality Check</span>
                    <span className="text-xs opacity-80">⏵</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Right: Result panel */}
          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4 sm:p-5 shadow-2xl shadow-black/50 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Analysis
              </p>

              {!result && !error && (
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>Reality Check will:</p>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-slate-400">
                    <li>Read your claim or media</li>
                    <li>Compare with web evidence &amp; patterns</li>
                    <li>Give a verdict + confidence score</li>
                    <li>Explain the reasoning in plain English</li>
                  </ul>
                  <p className="pt-1 text-xs text-slate-500">
                    Start with a wild claim or suspicious screenshot. 😈
                  </p>
                </div>
              )}

              {renderResult()}
            </div>

            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 text-xs text-slate-400 shadow shadow-black/40">
              <p className="mb-1 font-semibold text-slate-200 text-[11px] uppercase tracking-[0.18em]">
                Privacy note
              </p>
              <p className="text-[11px] leading-relaxed">
                Your text and media are sent to the Reality Check backend and
                OpenAI only for analysis. No public sharing, no training on your
                personal data.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Starfield animation CSS */}
      <style jsx global>{`
        .star {
          position: absolute;
          border-radius: 9999px;
          background: rgba(248, 250, 252, 0.9);
          box-shadow: 0 0 8px rgba(148, 163, 184, 0.8);
          opacity: 0;
          animation-name: twinkle;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }

        @keyframes twinkle {
          0% {
            opacity: 0.05;
            transform: scale(1);
          }
          25% {
            opacity: 0.9;
            transform: scale(1.35);
          }
          50% {
            opacity: 0.2;
            transform: scale(0.9);
          }
          75% {
            opacity: 0.7;
            transform: scale(1.15);
          }
          100% {
            opacity: 0.05;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

