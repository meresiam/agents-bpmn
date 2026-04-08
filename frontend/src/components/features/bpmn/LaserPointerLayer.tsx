'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el.isContentEditable;
}

type TrailPoint = { x: number; y: number; t: number };

type Props = {
  containerRef: React.RefObject<HTMLElement | null>;
};

const TRAIL_MAX_AGE_MS = 900;
/** Quanto maior, mais “preguiçoso” o ponto segue o mouse (0–1 por frame, ~60fps). */
const SMOOTH = 0.28;

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export function LaserPointerLayer({ containerRef }: Props) {
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  activeRef.current = active;

  const targetRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });
  const trailRef = useRef<TrailPoint[]>([]);
  const lastTrailRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);
  const rafRef = useRef(0);

  const clientToLocal = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }, [containerRef]);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const el = containerRef.current;
    if (!canvas || !el) return;

    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w === 0 || h === 0) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const bw = Math.max(1, Math.floor(w * dpr));
    const bh = Math.max(1, Math.floor(h * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const tgt = targetRef.current;
    const sm = smoothRef.current;
    sm.x += (tgt.x - sm.x) * SMOOTH;
    sm.y += (tgt.y - sm.y) * SMOOTH;

    const now = performance.now();
    trailRef.current = trailRef.current.filter((p) => now - p.t < TRAIL_MAX_AGE_MS);
    const trail = trailRef.current;

    if (draggingRef.current) {
      const last = lastTrailRef.current;
      const dx = sm.x - last.x;
      const dy = sm.y - last.y;
      if (dx * dx + dy * dy > 0.2) {
        trailRef.current.push({ x: sm.x, y: sm.y, t: now });
        lastTrailRef.current = { x: sm.x, y: sm.y };
      }
    }

    if (trail.length >= 2) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < trail.length; i++) {
        const p0 = trail[i - 1];
        const p1 = trail[i];
        const age = now - p1.t;
        const u = smoothstep(1 - age / TRAIL_MAX_AGE_MS);
        ctx.strokeStyle = `rgba(255, 118, 116, ${u * 0.4})`;
        ctx.lineWidth = 1.1 + u * 2;
        ctx.shadowColor = `rgba(255, 150, 140, ${u * 0.3})`;
        ctx.shadowBlur = 5 + u * 5;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    const { x, y } = sm;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, 20);
    grd.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
    grd.addColorStop(0.14, 'rgba(255, 145, 140, 0.88)');
    grd.addColorStop(0.38, 'rgba(255, 70, 65, 0.35)');
    grd.addColorStop(1, 'rgba(255, 40, 35, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 248, 248, 1)';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [containerRef]);

  const loop = useCallback(() => {
    if (!activeRef.current) return;
    drawFrame();
    rafRef.current = requestAnimationFrame(loop);
  }, [drawFrame]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement)) return;
      if (e.key === 'k' || e.key === 'K') {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        setActive((a) => !a);
      } else if (e.key === 'Escape') {
        setActive(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!active) {
      trailRef.current = [];
      draggingRef.current = false;
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const el = containerRef.current;
    if (el) {
      const cx = el.clientWidth / 2;
      const cy = el.clientHeight / 2;
      targetRef.current = { x: cx, y: cy };
      smoothRef.current = { x: cx, y: cy };
    }

    const onMove = (e: MouseEvent) => {
      const p = clientToLocal(e.clientX, e.clientY);
      targetRef.current = p;
    };

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      draggingRef.current = true;
      const s = smoothRef.current;
      lastTrailRef.current = { x: s.x, y: s.y };
      trailRef.current.push({ x: s.x, y: s.y, t: performance.now() });
    };

    const endDrag = () => {
      draggingRef.current = false;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('blur', endDrag);

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('blur', endDrag);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, clientToLocal, loop]);

  if (!active) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-[199]"
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[200] cursor-none touch-none"
        style={{ pointerEvents: 'auto' }}
        aria-hidden
      />
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-[201] -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-medium text-white/95 shadow-lg backdrop-blur-sm">
        Laser — K ou Esc para sair
      </div>
    </>
  );
}
