"use client";

import { useEffect, useRef } from "react";

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 250 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      alpha: Math.random(),
      delta: Math.random() * 0.02 + 0.005,
    }));

    function animate() {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        s.alpha += s.delta;
        if (s.alpha <= 0 || s.alpha >= 1) s.delta = -s.delta;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
        ctx.fill();
      }

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: "#020617" }}
    />
  );
}

