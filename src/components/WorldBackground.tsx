"use client";
import { useEffect, useRef } from "react";

/**
 * Golden 3D "block" cube at the centre of a decentralised network: small cubes (nodes) orbit it,
 * linked by gold lines with data blocks travelling along them. Plain canvas 2D, no libraries,
 * capped frame cost, paused when the tab is hidden, static when the visitor asks for reduced motion.
 */
type V = [number, number, number];
const FACES: { v: V[]; n: V }[] = [
  { v: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], n: [0, 0, 1] },
  { v: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], n: [0, 0, -1] },
  { v: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], n: [1, 0, 0] },
  { v: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], n: [-1, 0, 0] },
  { v: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], n: [0, 1, 0] },
  { v: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], n: [0, -1, 0] },
];
const LIGHT: V = [-0.42, 0.62, 0.66];
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const gold = (t: number, a = 1) => {
  t = Math.max(0, Math.min(1, t));
  // dark bronze -> rich gold -> pale highlight
  const r = t < 0.6 ? mix(46, 232, t / 0.6) : mix(232, 255, (t - 0.6) / 0.4);
  const g = t < 0.6 ? mix(30, 170, t / 0.6) : mix(170, 233, (t - 0.6) / 0.4);
  const b = t < 0.6 ? mix(8, 52, t / 0.6) : mix(52, 160, (t - 0.6) / 0.4);
  return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
};

export default function WorldBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d", { alpha: true })!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, dpr = 1, running = true;
    const small = () => window.innerWidth < 700;
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    const t0 = performance.now();

    // network nodes on a fibonacci shell
    const NODES = small() ? 9 : 15;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const nodes = Array.from({ length: NODES }, (_, i) => {
      const y = 1 - ((i + 0.5) / NODES) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
      const R = 2.7 + (i % 3) * 0.5;
      return { p: [Math.cos(th) * r * R, y * R * 0.8, Math.sin(th) * r * R] as V, s: 0.16 + (i % 4) * 0.035, spin: 0.4 + (i % 5) * 0.15, ph: i * 1.7 };
    });
    const links: [number, number][] = []; // index NODES = hub (the big cube)
    nodes.forEach((_, i) => { links.push([i, NODES]); links.push([i, (i + 1) % NODES]); if (i % 3 === 0) links.push([i, (i + 4) % NODES]); });
    const pulses = Array.from({ length: small() ? 10 : 22 }, (_, i) => ({ l: i % links.length, t: Math.random(), sp: 0.12 + Math.random() * 0.18, dir: Math.random() < 0.5 ? 1 : -1 }));
    const dust = Array.from({ length: small() ? 26 : 60 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), s: 0.4 + Math.random() * 1.4, v: 0.01 + Math.random() * 0.03 }));

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, small() ? 1.25 : 1.6);
      w = window.innerWidth; h = window.innerHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      c.style.width = w + "px"; c.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) frame(performance.now());
    };
    const onMove = (e: PointerEvent) => { tmx = e.clientX / w - 0.5; tmy = e.clientY / h - 0.5; };
    const onVis = () => { running = !document.hidden; if (running && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } };

    function frame(now: number) {
      const t = (now - t0) / 1000;
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      const intro = Math.min(1, t / 1.6), ease = 1 - Math.pow(1 - intro, 3);
      ctx.clearRect(0, 0, w, h);

      const mobile = w < 700;
      const S = (mobile ? w * 0.15 : Math.min(w * 0.15, h * 0.2)) * (0.7 + 0.3 * ease);
      const scroll = Math.min(window.scrollY, 900);
      const cx = mobile ? w * 0.72 : w * 0.73;
      const cy = (mobile ? h * 0.15 : h * 0.34) - scroll * 0.18 + Math.sin(t * 0.8) * 6;
      const D = 7;
      const yaw = t * 0.32 + mx * 0.9, pitch = -0.38 + Math.sin(t * 0.35) * 0.12 + my * 0.5;
      const sb = Math.sin(pitch);
      const nyaw = -t * 0.12 + mx * 0.3; // network turns the other way, slower
      const cna = Math.cos(nyaw), sna = Math.sin(nyaw);
      const alphaAll = (mobile ? 0.42 : 1) * ease;
      ctx.globalAlpha = alphaAll;

      const rotC = (p: V, a: number, b: number, sA: number, cA: number): V => {
        const x1 = p[0] * cA + p[2] * sA, z1 = -p[0] * sA + p[2] * cA;
        return [x1, p[1] * b - z1 * (a), p[1] * a + z1 * b];
      };
      // pitch uses (sin=a, cos=b) naming above: pass pitch sin/cos
      const proj = (p: V): [number, number, number] => { const k = (S * D) / (D - p[2]); return [cx + p[0] * k, cy - p[1] * k, p[2]]; };

      // soft glow behind the cube
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 4.2);
      g.addColorStop(0, "rgba(246,196,83,.22)"); g.addColorStop(0.45, "rgba(201,138,27,.07)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(cx - S * 4.5, cy - S * 4.5, S * 9, S * 9);

      // dust
      for (const d of dust) {
        d.y -= d.v * 0.016; if (d.y < -0.02) { d.y = 1.02; d.x = Math.random(); }
        ctx.fillStyle = gold(0.75, 0.15 + d.z * 0.3);
        ctx.fillRect(d.x * w + mx * 30 * d.z, d.y * h, d.s, d.s);
      }

      // network positions (camera space)
      const pos: [number, number, number][] = nodes.map((n, i) => {
        const bob: V = [n.p[0], n.p[1] + Math.sin(t * 0.7 + n.ph) * 0.15, n.p[2]];
        const q = rotC(bob, sb * 0.6, Math.cos(-0.22), sna, cna); // gentle fixed tilt
        return proj(q);
      });
      const hub = proj([0, 0, 0]);
      const P = (i: number) => (i === NODES ? hub : pos[i]);

      // links
      ctx.lineWidth = 1;
      for (const [a, b] of links) {
        const A = P(a), B = P(b), dz = (A[2] + B[2]) / 2;
        const al = 0.1 + Math.max(0, Math.min(1, (dz + 4) / 8)) * 0.3;
        ctx.strokeStyle = gold(0.62, al);
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      }
      // data blocks travelling on links
      for (const p of pulses) {
        p.t += (reduce ? 0 : 0.016) * p.sp * p.dir; if (p.t > 1) p.t = 0; if (p.t < 0) p.t = 1;
        const [a, b] = links[p.l], A = P(a), B = P(b);
        const x = mix(A[0], B[0], p.t), y = mix(A[1], B[1], p.t), sz = 2.6 + (mix(A[2], B[2], p.t) + 4) * 0.28;
        ctx.fillStyle = "rgba(255,214,120,.22)"; ctx.fillRect(x - sz * 1.9, y - sz * 1.9, sz * 3.8, sz * 3.8);
        ctx.fillStyle = "rgba(255,236,170,.95)"; ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }

      // draw a cube given centre c (camera space), half-size s, own rotation
      type Draw = { z: number; run: () => void };
      const queue: Draw[] = [];
      const cube = (centre: V, s: number, ya: number, pb: number, big: boolean, flat: number) => {
        const sy = Math.sin(ya), cy2 = Math.cos(ya), spb = Math.sin(pb), cpb = Math.cos(pb);
        for (const f of FACES) {
          const nr = rotC(f.n, spb, cpb, sy, cy2);
          const verts = f.v.map((v) => {
            const q = rotC([v[0] * s, v[1] * s, v[2] * s], spb, cpb, sy, cy2);
            return proj([q[0] + centre[0], q[1] + centre[1], q[2] + centre[2]]);
          });
          const zc = (verts[0][2] + verts[1][2] + verts[2][2] + verts[3][2]) / 4;
          const facing = nr[2] > 0;
          const lit = Math.max(0, nr[0] * LIGHT[0] + nr[1] * LIGHT[1] + nr[2] * LIGHT[2]);
          queue.push({ z: zc, run: () => {
            ctx.globalAlpha = alphaAll * (!big && !mobile && verts[0][0] < w * 0.52 ? 0.28 : 1);
            ctx.beginPath(); ctx.moveTo(verts[0][0], verts[0][1]);
            for (let i = 1; i < 4; i++) ctx.lineTo(verts[i][0], verts[i][1]);
            ctx.closePath();
            if (big) {
              if (facing) {
                const gr = ctx.createLinearGradient(verts[0][0], verts[0][1], verts[2][0], verts[2][1]);
                gr.addColorStop(0, gold(0.2 + lit * 0.55, 0.78)); gr.addColorStop(0.5, gold(0.32 + lit * 0.62, 0.62)); gr.addColorStop(1, gold(0.14 + lit * 0.4, 0.8));
                ctx.fillStyle = gr;
              } else ctx.fillStyle = gold(0.3, 0.1);
              ctx.fill();
              // block grid on each face
              ctx.strokeStyle = gold(0.8, facing ? 0.4 : 0.12); ctx.lineWidth = 1;
              ctx.beginPath();
              for (let k = 1; k < 4; k++) {
                const u = k / 4;
                ctx.moveTo(mix(verts[0][0], verts[1][0], u), mix(verts[0][1], verts[1][1], u)); ctx.lineTo(mix(verts[3][0], verts[2][0], u), mix(verts[3][1], verts[2][1], u));
                ctx.moveTo(mix(verts[0][0], verts[3][0], u), mix(verts[0][1], verts[3][1], u)); ctx.lineTo(mix(verts[1][0], verts[2][0], u), mix(verts[1][1], verts[2][1], u));
              }
              ctx.stroke();
              ctx.strokeStyle = gold(0.9, facing ? 0.95 : 0.3); ctx.lineWidth = facing ? 1.8 : 1; ctx.stroke();
            } else if (facing) {
              ctx.fillStyle = gold(0.28 + lit * 0.6 * flat, 0.92); ctx.fill();
              ctx.strokeStyle = gold(0.95, 0.9); ctx.lineWidth = 1; ctx.stroke();
            }
          } });
        }
      };

      // nodes (small cubes) and the big cube + inner core, painter-sorted
      nodes.forEach((n, i) => {
        const bob: V = [n.p[0], n.p[1] + Math.sin(t * 0.7 + n.ph) * 0.15, n.p[2]];
        const q = rotC(bob, sb * 0.6, Math.cos(-0.22), sna, cna);
        cube(q, n.s, t * n.spin + n.ph, t * n.spin * 0.7, false, 1);
      });
      cube([0, 0, 0], 1, yaw, pitch, true, 1);
      cube([0, 0, 0], 0.34 + Math.sin(t * 1.6) * 0.03, -yaw * 1.6, pitch + t * 0.5, false, 1.3);
      queue.sort((a, b) => a.z - b.z);
      for (const d of queue) d.run();

      // hub pulse ring
      const ring = (t * 0.5) % 1;
      ctx.strokeStyle = gold(0.8, (1 - ring) * 0.35); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(hub[0], hub[1], S * (1.6 + ring * 2.4), S * (0.5 + ring * 0.8), 0, 0, Math.PI * 2); ctx.stroke();

      ctx.globalAlpha = 1;
      if (running && !reduce) raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    if (!reduce) raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  return <canvas ref={ref} className="world" aria-hidden="true" />;
}
