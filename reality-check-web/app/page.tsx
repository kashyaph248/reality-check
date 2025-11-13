"use client";

import React, { useEffect, useState } from "react";

type BackendConfig = {
  status: string;
  service: string;
  allowed_origins: string[];
};

type QuickCheckResponse = {
  ok: boolean;
  input: {
    claim: string | null;
    url: string | null;
  };
  analysis: string; // JSON string from backend
};

type ParsedQuickAnalysis = {
  verdict?: string;
  explanation?: string;
  sources?: string[];
};

type UniversalCheckResponse = {
  status: string;
  analysis_type?: string;
  source?: string;
  summary?: string;
  verdict?: string;
  confidence?: number;
  next_step?: string;
};

const DEFAULT_BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function Page() {
  // Backend / config state
  const [backendUrl, setBackendUrl] = useState<string>(DEFAULT_BACKEND);
  const [config, setConfig] = useState<BackendConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState<boolean>(false);

  // Quick claim check state
  const [claim, setClaim] = useState<string>("");
  const [quickUrl, setQuickUrl] = useState<string>("");
  const [quickLoading, setQuickLoading] = useState<boolean>(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickResponse, setQuickResponse] = useState<QuickCheckResponse | null>(
    null
  );
  const [parsedQuick, setParsedQuick] = useState<ParsedQuickAnalysis | null>(
    null
  );

  // Universal / deep check state
  const [universalClaim, setUniversalClaim] = useState<string>("");
  const [universalUrl, setUniversalUrl] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [universalLoading, setUniversalLoading] = useState<boolean>(false);
  const [universalError, setUniversalError] = useState<string | null>(null);
  const [universalResponse, setUniversalResponse] =
    useState<UniversalCheckResponse | null>(null);

  // ──────────────────────────────────────────
  // Load backend config from /api/config
  // ──────────────────────────────────────────
  useEffect(() => {
    const loadConfig = async () => {
      setConfigLoading(true);
      setConfigError(null);
      try {
        const res = await fetch(`${backendUrl}/api/config`);
        if (!res.ok) {
          throw new Error(`Config error: ${res.status}`);
        }
        const data = (await res.json()) as BackendConfig;
        setConfig(data);
      } catch (err: any) {
        console.error("Config fetch failed:", err);
        setConfigError("Config fetch failed: " + (err?.message ?? "Unknown"));
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
  }, [backendUrl]);

  // ──────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────
  function parseAnalysisString(analysis: string): ParsedQuickAnalysis | null {
    try {
      const parsed = JSON.parse(analysis);
      return parsed as ParsedQuickAnalysis;
    } catch {
      // not valid JSON, just ignore
      return null;
    }
  }

  // ──────────────────────────────────────────
  // Quick Claim Check handler
  // ──────────────────────────────────────────
  const handleQuickCheck = async () => {
    setQuickError(null);
    setQuickResponse(null);
    setParsedQuick(null);

    const trimmedClaim = claim.trim();
    const trimmedUrl = quickUrl.trim();

    if (!trimmedClaim && !trimmedUrl) {
      setQuickError("Either 'claim' or 'url' must be provided.");
      return;
    }

    setQuickLoading(true);
    try {
      const res = await fetch(`${backendUrl}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: trimmedClaim || null,
          url: trimmedUrl || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Verify failed: ${res.status} – ${text}`);
      }

      const data = (await res.json()) as QuickCheckResponse;
      setQuickResponse(data);

      const parsed = parseAnalysisString(data.analysis);
      if (parsed) {
        setParsedQuick(parsed);
      }
    } catch (err: any) {
      console.error("Quick verify error:", err);
      setQuickError(err?.message ?? "Failed to fetch verification result.");
    } finally {
      setQuickLoading(false);
    }
  };

  // ──────────────────────────────────────────
  // Universal / Deep Check handler
  // ──────────────────────────────────────────
  const handleUniversalCheck = async () => {
    setUniversalError(null);
    setUniversalResponse(null);

    const trimmedClaim = universalClaim.trim();
    const trimmedUrl = universalUrl.trim();

    if (!trimmedClaim && !trimmedUrl && !file) {
      setUniversalError(
        "Provide a claim, URL, or upload a file to run Universal Check."
      );
      return;
    }

    setUniversalLoading(true);
    try {
      const formData = new FormData();
      if (trimmedClaim) formData.append("claim", trimmedClaim);
      if (trimmedUrl) formData.append("url", trimmedUrl);
      if (file) formData.append("file", file);
      formData.append("deep", "true");

      const res = await fetch(`${backendUrl}/universal-check`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Universal check failed: ${res.status} – ${text}`);
      }

      const data = (await res.json()) as UniversalCheckResponse;
      setUniversalResponse(data);
    } catch (err: any) {
      console.error("Universal check error:", err);
      setUniversalError(err?.message ?? "Failed to fetch universal check result.");
    } finally {
      setUniversalLoading(false);
    }
  };

  // ──────────────────────────────────────────
  // UI
  // ──────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold">
            Reality Check <span className="text-sky-400">AI</span>
          </h1>
          <p className="text-sm md:text-base text-gray-300 max-w-3xl">
            AI-assisted verification for claims, links, images, and video. Quick
            checks for fast answers. Deep / Universal Check for stronger
            reasoning and AI-generated &amp; deepfake detection.
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Backend:{" "}
            <span className="font-mono text-sky-300">{backendUrl}</span> | CORS
            allowed:{" "}
            {configLoading ? (
              <span className="text-yellow-300">loading…</span>
            ) : config ? (
              <span className="font-mono text-emerald-300">
                {config.allowed_origins.join(", ")}
              </span>
            ) : configError ? (
              <span className="text-red-400">{configError}</span>
            ) : (
              <span className="text-gray-500">unknown</span>
            )}
          </p>
        </header>

        {/* Quick Claim Check */}
        <section className="bg-[#0b1120] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Quick Claim Check</h2>
              <p className="text-xs text-gray-400">
                Fast factual screening of a short claim or URL.
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-wide text-gray-400">
              Fast factual screening
            </span>
          </div>

          <div className="space-y-3">
            <label className="block text-xs text-gray-300">
              Claim
              <input
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="e.g. the earth is flat"
                className="mt-1 w-full rounded-lg bg-[#020617] border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>

            <div className="text-center text-[10px] text-gray-500 font-mono">
              — or —
            </div>

            <label className="block text-xs text-gray-300">
              News / Tweet / Video URL
              <input
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="mt-1 w-full rounded-lg bg-[#020617] border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
          </div>

          {quickError && (
            <p className="text-xs text-red-400 font-medium">{quickError}</p>
          )}

          <button
            onClick={handleQuickCheck}
            disabled={quickLoading}
            className="w-full mt-2 rounded-full bg-sky-500 hover:bg-sky-400 disabled:opacity-60 disabled:hover:bg-sky-500 transition-colors py-2.5 text-sm font-semibold"
          >
            {quickLoading ? "Checking…" : "Run Reality Check"}
          </button>

          {/* Quick result */}
          {quickResponse && (
            <div className="mt-4 bg-black/40 rounded-xl border border-white/10 p-4 space-y-2">
              <h3 className="text-sm font-semibold">Quick Check Result</h3>

              {parsedQuick && (
                <div className="space-y-1 text-sm">
                  {parsedQuick.verdict && (
                    <p>
                      <span className="font-semibold">Verdict:</span>{" "}
                      <span
                        className={
                          parsedQuick.verdict.toLowerCase() === "true"
                            ? "text-emerald-400"
                            : parsedQuick.verdict.toLowerCase() === "false"
                            ? "text-red-400"
                            : "text-yellow-300"
                        }
                      >
                        {parsedQuick.verdict}
                      </span>
                    </p>
                  )}
                  {parsedQuick.explanation && (
                    <p className="text-gray-200">
                      <span className="font-semibold">Explanation:</span>{" "}
                      {parsedQuick.explanation}
                    </p>
                  )}
                  {parsedQuick.sources && parsedQuick.sources.length > 0 && (
                    <div className="text-gray-300 text-xs space-y-1 mt-1">
                      <p className="font-semibold">Sources:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {parsedQuick.sources.map((src, i) => (
                          <li key={i} className="break-all">
                            {src}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Raw JSON fallback */}
              {!parsedQuick && (
                <pre className="mt-2 text-[11px] leading-snug bg-black/40 rounded-lg p-3 overflow-x-auto">
                  {JSON.stringify(quickResponse, null, 2)}
                </pre>
              )}
            </div>
          )}
        </section>

        {/* Deep / Universal Check */}
        <section className="bg-[#020617] border border-violet-500/40 rounded-2xl p-5 space-y-4 shadow-[0_0_40px_rgba(139,92,246,0.25)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Deep / Universal Check</h2>
              <p className="text-xs text-gray-400">
                Analyze claims, URLs, and uploaded media for AI-generation,
                deepfakes, and suspicious patterns.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-violet-300">
              <span className="inline-flex h-5 items-center rounded-full bg-violet-500/20 px-2">
                Deep Check
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs text-gray-300">
              Claim / Script / Suspicious content
              <textarea
                value={universalClaim}
                onChange={(e) => setUniversalClaim(e.target.value)}
                rows={3}
                placeholder="Paste any claim, script, or suspicious content..."
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </label>

            <label className="block text-xs text-gray-300">
              URL to inspect
              <input
                value={universalUrl}
                onChange={(e) => setUniversalUrl(e.target.value)}
                placeholder="https://example.com/video-or-article"
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              />
            </label>

            <div className="space-y-1 text-xs text-gray-300">
              <span>Or upload an image / video</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                }}
                className="block w-full text-xs text-gray-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-500 file:text-white hover:file:bg-violet-400"
              />
              {file && (
                <p className="text-[11px] text-gray-400">
                  Selected: <span className="font-mono">{file.name}</span>
                </p>
              )}
            </div>
          </div>

          {universalError && (
            <p className="text-xs text-red-400 font-medium">
              {universalError}
            </p>
          )}

          <button
            onClick={handleUniversalCheck}
            disabled={universalLoading}
            className="w-full mt-2 rounded-full bg-violet-500 hover:bg-violet-400 disabled:opacity-60 disabled:hover:bg-violet-500 transition-colors py-2.5 text-sm font-semibold"
          >
            {universalLoading ? "Analyzing…" : "Run Universal Check"}
          </button>

          {universalResponse && (
            <div className="mt-4 bg-black/40 rounded-xl border border-violet-500/40 p-4 space-y-2">
              <h3 className="text-sm font-semibold">Universal Check Result</h3>

              <div className="space-y-1 text-sm">
                {universalResponse.analysis_type && (
                  <p className="text-xs text-gray-400">
                    Type: {universalResponse.analysis_type}
                  </p>
                )}
                {universalResponse.summary && (
                  <p className="text-gray-200">
                    <span className="font-semibold">Summary:</span>{" "}
                    {universalResponse.summary}
                  </p>
                )}
                {typeof universalResponse.confidence === "number" && (
                  <p className="text-gray-200">
                    <span className="font-semibold">Confidence:</span>{" "}
                    {universalResponse.confidence}%
                  </p>
                )}
                {universalResponse.verdict && (
                  <p className="text-gray-200">
                    <span className="font-semibold">Verdict:</span>{" "}
                    {universalResponse.verdict}
                  </p>
                )}
                {universalResponse.next_step && (
                  <p className="text-gray-200">
                    <span className="font-semibold">Next step:</span>{" "}
                    {universalResponse.next_step}
                  </p>
                )}
                {universalResponse.source && (
                  <p className="text-xs text-gray-400 break-all">
                    Source: {universalResponse.source}
                  </p>
                )}
              </div>

              {/* Raw JSON */}
              <pre className="mt-2 text-[11px] leading-snug bg-black/40 rounded-lg p-3 overflow-x-auto">
                {JSON.stringify(universalResponse, null, 2)}
              </pre>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

