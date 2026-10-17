"use client";
import { useEffect, useRef } from "react";

/** A slowly rotating dotted globe with glowing nodes linked by moving data pulses: a decentralized world. */
export default function WorldBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, rot = 0;
    const N = window.innerWidth < 700 ? 420 : 900, golden = Math.PI * (3 - Math.sqrt(5));
    const dots = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
      return { x: Math.cos(th) * r, y, z: Math.sin(th) * r };
    });
    const rand = (s: number) => { const x = Math.sin(s * 999.1) * 10000; return x - Math.floor(x); };
    const nodes = Array.from({ length: 34 }, (_, i) => {
      const lat = (rand(i + 1) - 0.5) * Math.PI * 0.9, lon = rand(i + 50) * Math.PI * 2;
      return { x: Math.cos(lat) * Math.cos(lon), y: Math.sin(lat), z: Math.cos(lat) * Math.sin(lon), p: rand(i + 9) * 6 };
    });
    const links: [number, number][] = [];
    nodes.forEach((a, i) => nodes.forEach((b, j) => { if (j > i) { const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); if (d < 0.75) links.push([i, j]); } }));
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr; c.style.width = w + "px"; c.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const project = (p: { x: number; y: number; z: number }, R: number, cx: number, cy: number) => {
      const cs = Math.cos(rot), sn = Math.sin(rot), tilt = 0.35, ct = Math.cos(tilt), st = Math.sin(tilt);
      const x1 = p.x * cs + p.z * sn, z1 = -p.x * sn + p.z * cs;
      const y2 = p.y * ct - z1 * st, z2 = p.y * st + z1 * ct;
      return { sx: cx + x1 * R, sy: cy + y2 * R, z: z2 };
    };
    let t0 = performance.now();
    const draw = (now: number) => {
      const dt = Math.min((now - t0) / 1000, 0.05); t0 = now;
      if (!reduce) rot += dt * 0.08;
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * (w < 700 ? 0.62 : 0.5), cx = w * (w < 700 ? 0.5 : 0.72), cy = h * (w < 700 ? 0.3 : 0.5);
      const glow = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.25);
      glow.addColorStop(0, "rgba(25,230,193,0.10)"); glow.addColorStop(0.7, "rgba(47,123,255,0.05)"); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.25, 0, 7); ctx.fill();
      for (const d of dots) {
        const p = project(d, R, cx, cy);
        if (p.z < -0.05) continue;
        ctx.fillStyle = `rgba(120,200,255,${0.1 + 0.38 * Math.max(p.z, 0)})`;
        ctx.fillRect(p.sx, p.sy, 1.4, 1.4);
      }
      const P = nodes.map((n) => project(n, R, cx, cy));
      const time = now / 1000;
      for (const [i, j] of links) {
        const a = P[i], b = P[j];
        if (a.z < 0 || b.z < 0) continue;
        ctx.strokeStyle = "rgba(25,230,193,0.16)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.sx, a.sy);
        const mx = (a.sx + b.sx) / 2, my = (a.sy + b.sy) / 2 - 18;
        ctx.quadraticCurveTo(mx, my, b.sx, b.sy); ctx.stroke();
        const u = (time * 0.35 + (i * 7 + j) * 0.13) % 1;
        const qx = (1 - u) * (1 - u) * a.sx + 2 * (1 - u) * u * mx + u * u * b.sx;
        const qy = (1 - u) * (1 - u) * a.sy + 2 * (1 - u) * u * my + u * u * b.sy;
        ctx.fillStyle = "rgba(160,255,235,0.9)"; ctx.beginPath(); ctx.arc(qx, qy, 1.8, 0, 7); ctx.fill();
      }
      P.forEach((p, i) => {
        if (p.z < 0) return;
        const pulse = 0.5 + 0.5 * Math.sin(time * 1.6 + nodes[i].p);
        ctx.fillStyle = `rgba(25,230,193,${0.12 + 0.2 * pulse})`; ctx.beginPath(); ctx.arc(p.sx, p.sy, 6 + 4 * pulse, 0, 7); ctx.fill();
        ctx.fillStyle = "#b8fff0"; ctx.beginPath(); ctx.arc(p.sx, p.sy, 2.2, 0, 7); ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="world" aria-hidden />;
}
