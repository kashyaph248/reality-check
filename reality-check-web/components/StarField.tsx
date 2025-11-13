"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  twinkleSpeed: number;
};

type Layer = {
  stars: Star[];
  speedY: number;
  parallax: number;
  blur: number;
};

const LAYER_CONFIGS = [
  // Far background: smaller, slower, subtle
  { count: 170, speedY: 0.06, parallax: 0.3, blur: 1 },
  // Mid layer
  { count: 170, speedY: 0.10, parallax: 0.6, blur: 2 },
  // Foreground: larger, faster, more glow
  { count: 140, speedY: 0.18, parallax: 1.0, blur: 3 },
];

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const layers: Layer[] = LAYER_CONFIGS.map((cfg) => ({
      stars: [],
      speedY: cfg.speedY,
      parallax: cfg.parallax,
      blur: cfg.blur,
    }));

    const createStars = () => {
      if (!canvas) return;
      const width = window.innerWidth;
      const height = window.innerHeight;

      layers.forEach((layer, i) => {
        const cfg = LAYER_CONFIGS[i];
        layer.stars = [];

        for (let s = 0; s < cfg.count; s++) {
          const depthFactor =
            i === 0 ? 0.7 : i === 1 ? 1 : 1.4; // foreground a bit bigger
          const r = (Math.random() * 1.2 + 0.3) * depthFactor;

          layer.stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r,
            alpha: Math.random() * 0.8 + 0.2,
            twinkleSpeed: (Math.random() * 0.010 + 0.002) * depthFactor,
          });
        }
      });
    };

    const resize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createStars();
    };

    resize();

    let animationFrameId: number;
    let t = 0; // time for “flying through space”

    const animate = () => {
      if (!canvas) return;
      const width = window.innerWidth;
      const height = window.innerHeight;

      t += 16; // ~16ms per frame

      // subtle camera drift / parallax (feels like moving through stars)
      const baseParallaxX = Math.sin(t * 0.0001) * 25; // left-right drift
      const baseParallaxY = Math.cos(t * 0.00008) * 18; // up-down drift

      // space background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(3,10,28,1)");
      gradient.addColorStop(0.5, "rgba(2,6,23,1)");
      gradient.addColorStop(1, "rgba(1,4,15,1)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      layers.forEach((layer, i) => {
        const cfg = LAYER_CONFIGS[i];
        const parallaxMultiplier = layer.parallax;

        ctx.save();
        ctx.translate(
          baseParallaxX * parallaxMultiplier,
          baseParallaxY * parallaxMultiplier,
        );

        ctx.shadowBlur = layer.blur;
        ctx.shadowColor = "rgba(148, 163, 253, 0.9)"; // soft indigo glow

        for (const star of layer.stars) {
          // move “downwards” to simulate flying forward
          star.y += layer.speedY;
          if (star.y > height + 10) {
            star.y = -10;
            star.x = Math.random() * width;
          }

          // soft twinkling
          star.alpha += star.twinkleSpeed;
          if (star.alpha > 1 || star.alpha < 0.15) {
            star.twinkleSpeed = -star.twinkleSpeed;
          }

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-20 pointer-events-none"
      aria-hidden="true"
    />
  );
}
