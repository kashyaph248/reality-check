"use client";

export default function NebulaGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Top-left glow */}
      <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl animate-float-slow" />

      {/* Bottom-right glow */}
      <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-violet-600/18 blur-3xl animate-float-slower" />

      {/* Center soft glow */}
      <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl animate-float-slowest" />
    </div>
  );
}

