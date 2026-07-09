import { useEffect, useRef } from "react";

const C = {
  primary: "#EA580C",      // Dark Orange
  accent: "#D97706",       // Dark Amber
  pulse: "#C2410C",        // Deepest Orange
  packetCol: "#FDE68A",
  packetTrail: "rgba(234,88,12,", 
};

function hexAlpha(hex, a) {
  return hex + Math.round(a * 255).toString(16).padStart(2, "0");
}

export default function NetworkGlobe() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    
    let W = 0, H = 0, CX = 0, CY = 0, R = 0;
    let dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    // --- Nodes ---
    const NUM_NODES = 52;
    const nodes = Array.from({ length: NUM_NODES }, (_, i) => ({
      phi: Math.acos(1 - 2 * (i + 0.5) / NUM_NODES),
      theta: Math.PI * (1 + Math.sqrt(5)) * i,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
      color: Math.random() < 0.6 ? C.primary : Math.random() < 0.5 ? C.accent : C.pulse,
      size: 4.5 + Math.random() * 5, 
      active: Math.random() < 0.3,
    }));

    // --- Edges ---
    const EDGE_DIST = 0.6;
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dot =
          Math.sin(a.phi) * Math.cos(a.theta) * Math.sin(b.phi) * Math.cos(b.theta) +
          Math.sin(a.phi) * Math.sin(a.theta) * Math.sin(b.phi) * Math.sin(b.theta) +
          Math.cos(a.phi) * Math.cos(b.phi);
        if (dot > EDGE_DIST) edges.push([i, j, dot]);
      }
    }

    // --- Packets ---
    const packets = Array.from({ length: 8 }, () => ({
      edge: Math.floor(Math.random() * edges.length),
      t: Math.random(),
      speed: 0.004 + Math.random() * 0.008,
      dir: Math.random() < 0.5 ? 1 : -1,
    }));

    let rotY = 0, rotX = 0.3, lastT = null;
    let animId;

    function project(phi, theta, ry, rx) {
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      const x2 = x * Math.cos(ry) + z * Math.sin(ry);
      const z2 = -x * Math.sin(ry) + z * Math.cos(ry);
      const y3 = y * Math.cos(rx) - z2 * Math.sin(rx);
      const z3 = y * Math.sin(rx) + z2 * Math.cos(rx);
      return { sx: CX + x2 * R, sy: CY - y3 * R, z: z3 };
    }

    function draw(ts) {
      if (!lastT) lastT = ts;
      const dt = Math.min((ts - lastT) / 1000, 0.05);
      lastT = ts;
      rotY += dt * 0.38;

      ctx.clearRect(0, 0, W * dpr, H * dpr);

      ctx.save();
      ctx.scale(dpr, dpr);

      // Meridians (Background Grid)
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = C.primary;
      ctx.lineWidth = 0.5;
      for (let a = 0; a < Math.PI; a += Math.PI / 6) {
        ctx.beginPath();
        for (let t = 0; t <= Math.PI * 2; t += 0.05) {
          const p = project(t, a, rotY, rotX);
          t === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
        }
        ctx.stroke();
      }
      for (let b = 0; b <= Math.PI; b += Math.PI / 5) {
        ctx.beginPath();
        for (let t = 0; t <= Math.PI * 2; t += 0.05) {
          const p = project(b, t, rotY, rotX);
          t === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
        }
        ctx.stroke();
      }
      ctx.restore();

      const projected = nodes.map((n) => project(n.phi, n.theta, rotY, rotX));

      // --- Edges (DARK & WIDE WIRING CONNECTIONS) ---
      for (const [i, j, dot] of edges) {
        const pi = projected[i], pj = projected[j];
        if (pi.z < -0.1 && pj.z < -0.1) continue;
        
        // Opacity multiplier badhakar 0.85 kiya hai taaki wiring deep dikhe
        const alpha =
          Math.min(pi.z + 0.5, 1) * Math.min(pj.z + 0.5, 1) *
          0.85 * ((dot - EDGE_DIST) / (1 - EDGE_DIST));
          
        ctx.beginPath();
        ctx.moveTo(pi.sx, pi.sy);
        ctx.lineTo(pj.sx, pj.sy);
        ctx.strokeStyle = `rgba(234, 88, 12, ${Math.max(0.1, alpha).toFixed(3)})`;
        ctx.lineWidth = 1.4; // Lines ko wide (thick) kiya hai (Pehle 0.7 tha)
        ctx.stroke();
      }

      // Packets
      for (const pk of packets) {
        pk.t += pk.speed * pk.dir;
        if (pk.t > 1) { pk.t = 0; pk.edge = Math.floor(Math.random() * edges.length); }
        if (pk.t < 0) { pk.t = 1; pk.edge = Math.floor(Math.random() * edges.length); }
        const [i, j] = edges[pk.edge];
        if (i === undefined || j === undefined) continue;
        const pi = projected[i], pj = projected[j];
        if (pi.z < 0 || pj.z < 0) continue;
        const px = pi.sx + (pj.sx - pi.sx) * pk.t;
        const py = pi.sy + (pj.sy - pi.sy) * pk.t;
        const t0 = Math.max(0, pk.t - 0.12 * pk.dir);
        const tx0 = pi.sx + (pj.sx - pi.sx) * t0;
        const ty0 = pi.sy + (pj.sy - pi.sy) * t0;
        const grad = ctx.createLinearGradient(tx0, ty0, px, py);
        grad.addColorStop(0, C.packetTrail + "0)");
        grad.addColorStop(1, C.packetTrail + "0.95)");
        ctx.beginPath();
        ctx.moveTo(tx0, ty0);
        ctx.lineTo(px, py);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8; // Packets ki trail line ko bhi halka sa thick kiya hai
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = C.packetCol;
        ctx.fill();
      }

      // Nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i], p = projected[i];
        if (p.z < -0.15) continue;
        const alpha = Math.max(0, (p.z + 0.15) / 1.15);
        n.pulse += n.pulseSpeed;
        const pf = 0.5 + 0.5 * Math.sin(n.pulse);
        const r = n.size * (0.85 + 0.15 * pf);
        
        if (n.active) {
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, r * 3, 0, Math.PI * 2);
          const g = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, r * 3);
          g.addColorStop(0, `rgba(234,88,12,${(alpha * 0.45 * pf).toFixed(2)})`);
          g.addColorStop(1, "rgba(234,88,12,0)");
          ctx.fillStyle = g;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = hexAlpha(n.color, alpha);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.strokeStyle = hexAlpha("#9a3412", alpha * 0.8); 
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (p.z > 0.5 && n.active) {
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, r + 4, 0, Math.PI * 2);
          ctx.strokeStyle = hexAlpha(n.color, alpha * 0.5);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(draw);
    }

    // --- Resize Observer ---
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const size = entry.contentRect.width;
        if (size <= 0) continue;

        W = size;
        H = size;
        CX = W / 2;
        CY = H / 2;
        R = size * 0.37;

        dpr = window.devicePixelRatio || 1;

        canvas.width = W * dpr;
        canvas.height = H * dpr;

        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
      }
    });

    resizeObserver.observe(container);
    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: "100%", 
        maxWidth: "620px", 
        aspectRatio: "1 / 1", 
        margin: "0 auto" 
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}