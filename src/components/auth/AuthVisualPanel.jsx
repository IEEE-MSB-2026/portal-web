import React, { useEffect, useRef, useState } from 'react';

const QUOTES = [
  '“Every circuit closed and every network joined moves the world forward.”',
  '“Progress is a signal passed from one curious mind to the next.”',
  '“The best inventions are conversations that refused to end.”',
  '“Somewhere, right now, an idea is looking for its first collaborator.”',
];

export default function AuthVisualPanel() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [qIndex, setQIndex] = useState(0);

  // Quote rotation timer
  useEffect(() => {
    const timer = setInterval(() => {
      setQIndex((prev) => (prev + 1) % QUOTES.length);
    }, 5200);
    return () => clearInterval(timer);
  }, []);

  // Network / constellation canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const panel = containerRef.current;
    if (!canvas || !panel) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animId;
    let W = 0;
    let H = 0;
    let nodes = [];
    const NODE_COUNT = 28;
    const LINK_DIST = 150;

    function resize() {
      if (!panel || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      W = canvas.width = panel.clientWidth * dpr;
      H = canvas.height = panel.clientHeight * dpr;
      canvas.style.width = panel.clientWidth + 'px';
      canvas.style.height = panel.clientHeight + 'px';
    }

    function initNodes() {
      const dpr = window.devicePixelRatio || 1;
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * (W || 800),
        y: Math.random() * (H || 800),
        vx: (Math.random() - 0.5) * 0.22 * dpr,
        vy: (Math.random() - 0.5) * 0.22 * dpr,
        r: (Math.random() * 1.6 + 1.2) * dpr,
      }));
    }

    let pulse = null;
    function maybeStartPulse(edges) {
      if (pulse || !edges.length) return;
      if (Math.random() < 0.015) {
        pulse = { edge: edges[Math.floor(Math.random() * edges.length)], t: 0 };
      }
    }

    function frame() {
      if (!ctx || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, W, H);
      const edges = [];

      // Links between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const maxD = LINK_DIST * dpr;
          if (d < maxD) {
            const op = (1 - d / maxD) * 0.35;
            ctx.strokeStyle = `rgba(255,255,255,${op})`;
            ctx.lineWidth = dpr;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            edges.push({ a, b, d });
          }
        }
      }

      // Nodes
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!reduceMotion) {
        // Drift movement
        nodes.forEach((n) => {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > W) n.vx *= -1;
          if (n.y < 0 || n.y > H) n.vy *= -1;
        });

        // Traveling pulse along a connected edge
        maybeStartPulse(edges);
        if (pulse && pulse.edge) {
          pulse.t += 0.02;
          const { a, b } = pulse.edge;
          const px = a.x + (b.x - a.x) * pulse.t;
          const py = a.y + (b.y - a.y) * pulse.t;
          ctx.beginPath();
          ctx.fillStyle = 'rgba(180,240,255,0.95)';
          ctx.shadowColor = 'rgba(120,220,255,0.9)';
          ctx.shadowBlur = 8 * dpr;
          ctx.arc(px, py, 2.4 * dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          if (pulse.t >= 1) pulse = null;
        }

        animId = requestAnimationFrame(frame);
      }
    }

    resize();
    initNodes();
    frame();

    const handleResize = () => {
      resize();
      if (reduceMotion) frame();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <section className="auth-panel-visual" ref={containerRef} aria-hidden="false">
      <canvas ref={canvasRef} aria-hidden="true" />

      <div className="auth-visual-content auth-visual-top">
        <span className="auth-dot-mark"></span>
        <span className="auth-eyebrow">IEEE Menoufia SB</span>
      </div>

      <div className="auth-visual-content auth-visual-mid">
        <h1 className="auth-headline">
          <span>Inspiring.</span>
          <span>Innovating.</span>
          <span className="auth-accent">Connecting.</span>
        </h1>
      </div>

      <div className="auth-visual-content auth-visual-bottom">
        <div className="auth-quote-track">
          {QUOTES.map((quote, idx) => (
            <p
              key={idx}
              className={`auth-quote ${qIndex === idx ? 'is-active' : ''}`}
            >
              {quote}
            </p>
          ))}
        </div>
        <div className="auth-quote-dots">
          {QUOTES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={qIndex === idx ? 'is-active' : ''}
              aria-label={`Show quote ${idx + 1}`}
              onClick={() => setQIndex(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
