"use client";
import { useEffect, useRef } from "react";

/**
 * Hero scene: the OXYLON gold coin (your logo) spinning on a glowing platform in front of a slowly turning
 * dotted globe, with small coins and glass cubes orbiting, joined by gold lines that carry data blocks.
 * Plain canvas 2D, no libraries. Frame cost is capped, it pauses in hidden tabs and stays still for visitors
 * who ask for reduced motion.
 */
type V = [number, number, number];
const TAU = Math.PI * 2;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
const gold = (t: number, a = 1) => {
  t = Math.max(0, Math.min(1, t));
  const r = t < 0.6 ? mix(46, 232, t / 0.6) : mix(232, 255, (t - 0.6) / 0.4);
  const g = t < 0.6 ? mix(30, 170, t / 0.6) : mix(170, 233, (t - 0.6) / 0.4);
  const b = t < 0.6 ? mix(8, 52, t / 0.6) : mix(52, 160, (t - 0.6) / 0.4);
  return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
};

const CUBE_FACES: V[][] = [
  [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]],
  [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]],
  [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]],
];

export default function WorldBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d", { alpha: true })!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, running = true, low = false, lastNow = 0, slow = 0, dprCap = 1.6;
    const mobile = () => window.innerWidth < 700;
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    const t0 = performance.now();

    const img = new Image();
    img.src = "/logo.png";

    // soft round glow sprite, reused for every glow so no gradients are built per frame
    const glow = document.createElement("canvas");
    glow.width = glow.height = 128;
    {
      const g = glow.getContext("2d")!, gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, "rgba(255,226,140,1)"); gr.addColorStop(0.25, "rgba(246,196,83,.45)"); gr.addColorStop(1, "rgba(246,196,83,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    }

    // globe: land-like blobs of dots on a sphere
    const globe: { lat: number; lon: number }[] = [];
    const GN = mobile() ? 520 : 900, golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < GN; i++) {
      const lat = Math.asin(1 - (i / (GN - 1)) * 2), lon = (golden * i) % TAU;
      const n = Math.sin(lon * 2 + lat * 1.3) + Math.sin(lon * 3.7 - lat * 2.1) * 0.7 + Math.sin(lat * 5 + lon * 0.8) * 0.5;
      if (n > 0.1) globe.push({ lat, lon });
    }
    const sparks = Array.from({ length: mobile() ? 40 : 90 }, () => ({ x: Math.random(), y: Math.random(), s: 0.6 + Math.random() * 1.8, ph: Math.random() * TAU, v: 0.006 + Math.random() * 0.02 }));
    const pulses = Array.from({ length: mobile() ? 8 : 18 }, (_, i) => ({ i, t: Math.random(), sp: 0.1 + Math.random() * 0.18 }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, mobile() ? 1.25 : dprCap);
      w = window.innerWidth; h = window.innerHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      c.style.width = w + "px"; c.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) frame(performance.now());
    };
    const onMove = (e: PointerEvent) => { tmx = e.clientX / w - 0.5; tmy = e.clientY / h - 0.5; };
    const onVis = () => { running = !document.hidden; if (running && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } };

    const glowAt = (x: number, y: number, r: number, a: number) => {
      ctx.globalAlpha = a; ctx.drawImage(glow, x - r, y - r, r * 2, r * 2);
    };

    /** a coin turned by theta about its vertical axis; its thickness shows on the side as it turns */
    function coin(x: number, y: number, R: number, theta: number, thick: number, shine: number, alpha: number) {
      const cs = Math.cos(theta), sn = Math.sin(theta), rx = Math.max(0.5, R * Math.abs(cs));
      const sgn = cs >= 0 ? 1 : -1, off = sgn * sn * thick * 0.5;
      const nx = x + off, fx = x - off;
      ctx.globalAlpha = alpha;
      // far face + edge band (the rim, with milled ridges)
      ctx.fillStyle = gold(0.22);
      ctx.beginPath(); ctx.ellipse(fx, y, rx, R, 0, 0, TAU); ctx.fill();
      const x0 = Math.min(fx, nx), x1 = Math.max(fx, nx);
      if (x1 - x0 > 0.4) {
        const gr = ctx.createLinearGradient(x0, 0, x1, 0);
        gr.addColorStop(0, gold(0.28)); gr.addColorStop(0.45, gold(0.82)); gr.addColorStop(1, gold(0.3));
        ctx.fillStyle = gr; ctx.fillRect(x0, y - R, x1 - x0, R * 2);
        if (x1 - x0 > 6) {
          ctx.strokeStyle = "rgba(60,38,6,.45)"; ctx.lineWidth = 1; ctx.beginPath();
          for (let k = 0; k < 26; k++) { const yy = y - R + (k / 25) * R * 2; ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); }
          ctx.stroke();
        }
      }
      // near face with the logo
      ctx.save();
      ctx.translate(nx, y); ctx.scale(cs, 1);
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
      if (img.complete && img.naturalWidth) ctx.drawImage(img, -R, -R, R * 2, R * 2);
      else { ctx.fillStyle = gold(0.6); ctx.fillRect(-R, -R, R * 2, R * 2); }
      ctx.restore();
      // shading as it turns away, moving sheen, rim line
      ctx.save();
      ctx.translate(nx, y); ctx.scale(Math.abs(cs), 1);
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
      ctx.fillStyle = `rgba(0,0,0,${(1 - Math.abs(cs)) * 0.55})`; ctx.fillRect(-R, -R, R * 2, R * 2);
      if (shine > 0) {
        ctx.globalCompositeOperation = "lighter";
        const sp = shine * 3.2 - 1.1, gr = ctx.createLinearGradient(sp * R - R * 0.45, -R, sp * R + R * 0.45, R);
        gr.addColorStop(0, "rgba(255,230,150,0)"); gr.addColorStop(0.5, "rgba(255,236,170,.34)"); gr.addColorStop(1, "rgba(255,230,150,0)");
        ctx.fillStyle = gr; ctx.fillRect(-R, -R, R * 2, R * 2);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.restore();
      ctx.strokeStyle = gold(0.9, 0.95); ctx.lineWidth = Math.max(1, R * 0.02);
      ctx.beginPath(); ctx.ellipse(nx, y, rx, R, 0, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /** small glass cube */
    function glass(x: number, y: number, s: number, ay: number, ax: number, alpha: number) {
      const sy = Math.sin(ay), cy = Math.cos(ay), sx = Math.sin(ax), cx = Math.cos(ax);
      const faces = CUBE_FACES.map((f) => {
        const pts = f.map((v) => {
          const x1 = v[0] * cy + v[2] * sy, z1 = -v[0] * sy + v[2] * cy;
          const y2 = v[1] * cx - z1 * sx, z2 = v[1] * sx + z1 * cx;
          return [x + x1 * s, y - y2 * s, z2] as V;
        });
        return { pts, z: (pts[0][2] + pts[1][2] + pts[2][2] + pts[3][2]) / 4 };
      }).sort((a, b) => a.z - b.z);
      ctx.globalAlpha = alpha;
      for (const f of faces) {
        ctx.beginPath(); ctx.moveTo(f.pts[0][0], f.pts[0][1]);
        for (let i = 1; i < 4; i++) ctx.lineTo(f.pts[i][0], f.pts[i][1]);
        ctx.closePath();
        ctx.fillStyle = gold(0.45 + f.z * 0.12, 0.14); ctx.fill();
        ctx.strokeStyle = gold(0.9, 0.55 + f.z * 0.2); ctx.lineWidth = 1.1; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function frame(now: number) {
      // adaptive quality: if frames are slow for ~2 seconds, drop to a lighter scene and a smaller canvas
      if (lastNow && !low) {
        const dt = now - lastNow;
        slow = dt > 30 ? slow + 1 : Math.max(0, slow - 2);
        if (slow > 45) { low = true; dprCap = 1; resize(); }
      }
      lastNow = now;
      const t = (now - t0) / 1000;
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      const intro = ease(t / 1.6);
      ctx.clearRect(0, 0, w, h);

      const mob = w < 700;
      const scroll = Math.min(window.scrollY, 1000);
      const R = (mob ? w * 0.17 : Math.min(w * 0.115, h * 0.215)) * (0.8 + 0.2 * intro);
      const cx = (mob ? w * 0.74 : w * 0.73) + mx * 18;
      const cy = (mob ? h * 0.15 : h * 0.3) - scroll * 0.2 + Math.sin(t * 0.9) * 5 + my * 10;
      const fade = intro * (mob ? 0.55 : 1) * (1 - Math.min(0.55, scroll / 1400));

      // warm light behind everything
      glowAt(cx, cy, R * 5.2, 0.5 * fade);

      // globe
      const G = R * 1.62, gx = cx - mx * 10, gy = cy - R * 0.08;
      ctx.globalAlpha = 0.5 * fade;
      ctx.strokeStyle = gold(0.7, 0.5); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(gx, gy, G, 0, TAU); ctx.stroke();
      glowAt(gx, gy, G * 1.25, 0.14 * fade);
      const rot = t * 0.14;
      for (let gi = 0; gi < globe.length; gi += low ? 2 : 1) {
        const d = globe[gi];
        const lon = d.lon + rot, x = Math.cos(d.lat) * Math.sin(lon), z = Math.cos(d.lat) * Math.cos(lon), y = Math.sin(d.lat);
        if (z < -0.05) continue;
        ctx.globalAlpha = (0.5 + z * 0.5) * fade;
        ctx.fillStyle = gold(0.62 + z * 0.3);
        const s = 1.6 + z * 1.5;
        ctx.fillRect(gx + x * G, gy - y * G, s, s);
      }
      ctx.globalAlpha = 1;

      // platform with rings
      const py = cy + R * 1.12;
      const pulse = (t * 0.45) % 1;
      for (let i = 0; i < 4; i++) {
        const rr = R * (1.25 + i * 0.5 + (i === 3 ? pulse * 0.4 : 0));
        ctx.globalAlpha = (i === 3 ? (1 - pulse) * 0.5 : 0.45 - i * 0.08) * fade;
        ctx.strokeStyle = gold(0.85); ctx.lineWidth = i === 0 ? 2 : 1.2;
        ctx.beginPath(); ctx.ellipse(cx, py, rr, rr * 0.2, 0, 0, TAU); ctx.stroke();
      }
      ctx.globalAlpha = fade;
      const disc = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
      disc.addColorStop(0, "#1a1206"); disc.addColorStop(0.5, "#5a3e0d"); disc.addColorStop(1, "#1a1206");
      ctx.fillStyle = disc; ctx.beginPath(); ctx.ellipse(cx, py, R * 1.18, R * 0.25, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = gold(0.95); ctx.lineWidth = 2; ctx.stroke();
      glowAt(cx, py, R * 1.8, 0.35 * fade);
      // light column from the platform up to the coin
      const beam = ctx.createLinearGradient(0, py, 0, cy);
      beam.addColorStop(0, "rgba(255,214,120,.22)"); beam.addColorStop(1, "rgba(255,214,120,0)");
      ctx.globalAlpha = fade;
      ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(cx - R * 0.9, py); ctx.lineTo(cx - R * 0.5, cy); ctx.lineTo(cx + R * 0.5, cy); ctx.lineTo(cx + R * 0.9, py); ctx.fill();
      ctx.globalAlpha = 1;

      // orbiting things (positions first so lines can join them)
      type Item = { x: number; y: number; z: number; kind: "coin" | "cube"; r: number; a: number };
      const items: Item[] = [];
      const NC = mob ? 2 : 3, NK = mob ? 4 : 7;
      for (let i = 0; i < NC; i++) {
        const a = t * 0.28 + i * (TAU / NC) + 0.6;
        items.push({ kind: "coin", x: cx + Math.cos(a) * R * 2.15 + mx * 30, y: cy + Math.sin(a) * R * 0.55 - R * 0.35 + Math.sin(t + i) * 8, z: Math.sin(a), r: R * (0.2 + 0.07 * Math.sin(a)), a: t * (0.9 + i * 0.25) + i });
      }
      for (let i = 0; i < NK; i++) {
        const a = -t * 0.2 + i * (TAU / NK), rr = R * (1.9 + (i % 3) * 0.45);
        items.push({ kind: "cube", x: cx + Math.cos(a) * rr + mx * 50, y: cy + Math.sin(a * 1.2 + i) * R * 0.95 + Math.sin(t * 0.8 + i) * 10, z: Math.sin(a), r: R * (0.1 + (i % 3) * 0.035), a: t * (0.5 + (i % 4) * 0.2) + i });
      }

      // network lines + data blocks
      const pts = [{ x: cx, y: cy }, ...items.map((i) => ({ x: i.x, y: i.y }))];
      const segs: [number, number][] = [];
      for (let i = 1; i < pts.length; i++) { segs.push([0, i]); segs.push([i, i + 1 < pts.length ? i + 1 : 1]); }
      ctx.lineWidth = 1;
      for (const [a, b] of segs) {
        ctx.globalAlpha = 0.26 * fade; ctx.strokeStyle = gold(0.7);
        ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
      }
      for (const p of pulses) {
        p.t += (reduce ? 0 : 0.016) * p.sp; if (p.t > 1) p.t = 0;
        const [a, b] = segs[p.i % segs.length], x = mix(pts[a].x, pts[b].x, p.t), y = mix(pts[a].y, pts[b].y, p.t);
        ctx.globalAlpha = fade * 0.3; ctx.fillStyle = "rgba(255,214,120,1)"; ctx.fillRect(x - 5, y - 5, 10, 10);
        ctx.globalAlpha = fade; ctx.fillStyle = "rgba(255,238,175,1)"; ctx.fillRect(x - 2, y - 2, 4, 4);
      }
      ctx.globalAlpha = 1;

      const drawItem = (it: Item) => {
        const al = (0.55 + (it.z + 1) * 0.225) * fade;
        glowAt(it.x, it.y, it.r * 2.6, 0.35 * al);
        if (it.kind === "coin") coin(it.x, it.y, it.r, it.a, it.r * 0.16, 0, al);
        else glass(it.x, it.y, it.r, it.a, it.a * 0.7, al);
      };
      const nearMain = (it: Item) => Math.hypot(it.x - cx, it.y - cy) < R * 1.45;
      for (const it of items) if (it.z < 0 || nearMain(it)) drawItem(it);

      // the main coin: a full turn every ~11 seconds, a gentle swing in between
      const cycle = 11, u = (t % cycle) - (cycle - 2.6);
      const flip = u > 0 ? ease(u / 2.6) * TAU : 0;
      const theta = 0.42 * Math.sin(t * 0.6) + mx * 0.9 + flip;
      const shine = u > 0.8 && u < 2.6 ? (u - 0.8) / 1.8 : (t % 5) / 5 > 0.8 ? ((t % 5) / 5 - 0.8) / 0.2 : 0;
      glowAt(cx, cy, R * 2.3, 0.4 * fade);
      coin(cx, cy, R, theta, R * 0.13, shine, fade);

      for (const it of items) if (it.z >= 0 && !nearMain(it)) drawItem(it);

      // sparkles
      ctx.globalCompositeOperation = "lighter";
      for (let si = 0; si < sparks.length; si += low ? 3 : 1) {
        const s = sparks[si];
        s.y -= s.v * 0.016; if (s.y < -0.02) { s.y = 1.02; s.x = Math.random(); }
        const tw = 0.4 + 0.6 * Math.sin(t * 1.6 + s.ph);
        ctx.globalAlpha = 0.5 * tw * (mob ? 0.6 : 1);
        ctx.drawImage(glow, s.x * w + mx * 20 * s.s, s.y * h, s.s * 7, s.s * 7);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      if (running && !reduce) raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    img.onload = () => { if (reduce) frame(performance.now()); };
    if (!reduce) raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  return <canvas ref={ref} className="world" aria-hidden="true" />;
}
