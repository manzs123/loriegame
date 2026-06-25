import { useEffect, useRef } from 'react';
import { CHARACTERS } from '../game/constants.js';
import { ROOMS, WALLS, TASK_POSITIONS, CCTV_TERMINAL, ELECTRICAL_POST, TELEPORT_PORTALS, MAP_W, MAP_H } from '../game/mapData.js';

const CANVAS_W = 800;
const CANVAS_H = 600;

// ─── DEV MODE ──────────────────────────────────────────────────────────────────
// Flip to true: full map visible, no fog, green walkable overlay shown.
// Also flip DEV_MODE in server/gameRoom.js (free walk, 5× speed) then restart server.
const DEV_MODE = false;
// ───────────────────────────────────────────────────────────────────────────────

const ZOOM = DEV_MODE ? 0.4 : 1.5;

export default function GameMap({ state, myCharId, devMode: devModeProp = false }) {
  const canvasRef = useRef(null);
  const devMode = devModeProp || DEV_MODE;
  const stateRef = useRef(state);

  useEffect(() => { stateRef.current = state; }, [state]);

  // Scale canvas CSS size to fit its container while preserving 800×600 aspect ratio.
  // ResizeObserver fires whenever the parent resizes (orientation change, panel toggle, etc.)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    function resize() {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const scale = Math.min(w / CANVAS_W, h / CANVAS_H);
      canvas.style.width  = Math.floor(CANVAS_W * scale) + 'px';
      canvas.style.height = Math.floor(CANVAS_H * scale) + 'px';
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf;
    function loop() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      drawFrame(ctx, stateRef.current, myCharId, devMode, performance.now());
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [myCharId, devMode]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="game-canvas"
      style={{ border: '2px solid #1e3a5f', display: 'block', imageRendering: 'pixelated' }}
    />
  );
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function drawWalls(ctx) {
  WALLS.forEach(w => {
    // Main fill
    ctx.fillStyle = '#111518';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    // Diagonal hatching for a metal/concrete look
    ctx.save();
    ctx.beginPath();
    ctx.rect(w.x, w.y, w.w, w.h);
    ctx.clip();
    ctx.strokeStyle = '#1a1f24';
    ctx.lineWidth = 3;
    for (let i = -w.h; i < w.w + w.h; i += 10) {
      ctx.beginPath();
      ctx.moveTo(w.x + i, w.y);
      ctx.lineTo(w.x + i + w.h, w.y + w.h);
      ctx.stroke();
    }
    ctx.restore();
    // Border highlight (top/left edge bright, bottom/right dim)
    ctx.strokeStyle = '#2a3540';
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  });
}

function drawFrame(ctx, state, myCharId, devMode = false, time = 0) {
  const zoom = devMode ? 0.4 : ZOOM;

  if (!state) {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    return;
  }

  const me = state.players.find(p => p.charId === myCharId);
  const myPos = me ? me.pos : { x: MAP_W / 2, y: MAP_H / 2 };

  // Camera
  const camX = clamp(myPos.x - CANVAS_W / (2 * zoom), 0, MAP_W - CANVAS_W / zoom);
  const camY = clamp(myPos.y - CANVAS_H / (2 * zoom), 0, MAP_H - CANVAS_H / zoom);

  // Clear
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // ---- World space drawing ----
  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.translate(-camX, -camY);

  // Void background
  ctx.fillStyle = '#020408';
  ctx.fillRect(0, 0, MAP_W, MAP_H);

  // Grid tiles (floor)
  ctx.strokeStyle = '#0a0f15';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < MAP_W; x += 32) {
    for (let y = 0; y < MAP_H; y += 32) {
      ctx.strokeRect(x, y, 32, 32);
    }
  }

  // Draw room floor zones
  ROOMS.forEach(room => {
    ctx.fillStyle = room.color;
    ctx.fillRect(room.x, room.y, room.w, room.h);

    // Subtle floor tile grid
    ctx.strokeStyle = room.color === '#030303' ? '#080808' : '#0d1520';
    ctx.lineWidth = 0.5;
    for (let x = room.x; x < room.x + room.w; x += 40) {
      for (let y = room.y; y < room.y + room.h; y += 40) {
        ctx.strokeRect(x, y, 40, 40);
      }
    }

    // Room name label
    ctx.fillStyle = room.border + 'aa';
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(room.name.toUpperCase(), room.x + room.w / 2, room.y + 26);

    // Dark room extra overlay
    if (room.id === 'dark_room') {
      ctx.fillStyle = 'rgba(0,0,0,0.80)';
      ctx.fillRect(room.x, room.y, room.w, room.h);
      ctx.fillStyle = '#636e72';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DARK ROOM', room.x + room.w / 2, room.y + room.h / 2);
    }
  });

  // Draw solid walls (on top of floor, blocking movement)
  drawWalls(ctx);

  // Draw task consoles
  if (state.tasks) {
    state.tasks.forEach(task => {
      const pos = TASK_POSITIONS[task.room];
      if (!pos) return;
      drawTaskConsole(ctx, pos.x, pos.y, task);
    });
  }

  // Draw CCTV terminal
  drawCCTVTerminal(ctx, CCTV_TERMINAL.x, CCTV_TERMINAL.y);
  drawElectricalPost(ctx, ELECTRICAL_POST.x, ELECTRICAL_POST.y, state.electricityOn !== false);

  // Draw teleport portals
  TELEPORT_PORTALS.forEach(p => drawPortal(ctx, p.x, p.y));

  // Draw bodies
  if (state.bodies) {
    state.bodies.forEach(body => drawBody(ctx, body));
  }

  // Draw players
  if (state.players) {
    state.players.forEach(player => {
      const isMe = player.charId === myCharId;
      drawPlayer(ctx, player, isMe, time);
    });
  }

  // Draw HUD (world-space items)
  drawDayHUD(ctx, state, camX, camY);

  // DEV: red overlay on wall collision rectangles
  if (devMode) {
    WALLS.forEach(w => {
      ctx.fillStyle = 'rgba(255,0,0,0.25)';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = 'rgba(255,80,80,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    });
  }

  ctx.restore();

  // Red tint when electricity is out
  if (state && state.electricityOn === false) {
    ctx.fillStyle = 'rgba(200,0,0,0.07)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // Fog of war with line-of-sight — skipped in dev mode
  const isSalt = myCharId === 'salt';
  if (!devMode) {
    if (me && me.alive && isSalt) {
      // Salt: LOS still blocks walls, but no fog vignette — fully clear within sight
      drawFogLOS(ctx, myPos.x, myPos.y, 600, WALLS, camX, camY, zoom, false);
    } else if (me && me.alive) {
      // Everyone else: LOS + vignette darkening, electricity halves radius
      const viewRadius = state.electricityOn === false ? 200 : 400;
      drawFogLOS(ctx, myPos.x, myPos.y, viewRadius, WALLS, camX, camY, zoom, true);
    } else if (me && !me.alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  }
}

// ─── LINE-OF-SIGHT FOG ────────────────────────────────────────────────────────
// Offscreen canvas — destination-out must run separately to avoid erasing sprites.
let _fogCanvas = null;
let _fogCtx = null;

// Ray vs line-segment intersection. Returns t (distance along ray) or null.
function _raySegIntersect(px, py, dx, dy, x1, y1, x2, y2) {
  const ex = x2 - x1, ey = y2 - y1;
  const denom = dx * ey - dy * ex;
  if (Math.abs(denom) < 1e-8) return null;
  const fx = x1 - px, fy = y1 - py;
  const t = (fx * ey - fy * ex) / denom;
  const u = (fx * dy - fy * dx) / denom;
  if (t > 0.001 && u >= 0 && u <= 1) return t;
  return null;
}

// Cast one ray from (px,py) in direction angle; return the nearest hit point.
function _castRay(px, py, angle, maxDist, walls) {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let minT = maxDist;
  for (const w of walls) {
    const edges = [
      [w.x,       w.y,       w.x+w.w, w.y      ],
      [w.x,       w.y+w.h,   w.x+w.w, w.y+w.h  ],
      [w.x,       w.y,       w.x,     w.y+w.h  ],
      [w.x+w.w,   w.y,       w.x+w.w, w.y+w.h  ],
    ];
    for (const [x1, y1, x2, y2] of edges) {
      const t = _raySegIntersect(px, py, dx, dy, x1, y1, x2, y2);
      if (t !== null && t < minT) minT = t;
    }
  }
  return { x: px + dx * minT, y: py + dy * minT };
}

// Build visibility polygon in world-space by casting rays to every wall corner
// (plus a coarse angular sweep to fill gaps).
function _computeVisibilityPolygon(px, py, viewRadius, walls) {
  const angleSet = new Set();

  // Cast to every corner of every wall — this gives crisp shadow edges
  for (const w of walls) {
    for (const [cx, cy] of [
      [w.x,     w.y    ],
      [w.x+w.w, w.y    ],
      [w.x,     w.y+w.h],
      [w.x+w.w, w.y+w.h],
    ]) {
      const a = Math.atan2(cy - py, cx - px);
      angleSet.add(a - 0.0001);
      angleSet.add(a);
      angleSet.add(a + 0.0001);
    }
  }

  // Coarse sweep fills regions with no nearby corners
  for (let i = 0; i < 360; i++) {
    angleSet.add(((i / 360) * 2 * Math.PI) - Math.PI);
  }

  const angles = Array.from(angleSet).sort((a, b) => a - b);
  return angles.map(a => _castRay(px, py, a, viewRadius, walls));
}

function drawFogLOS(ctx, px, py, viewRadius, walls, camX, camY, zoom, vignette = true) {
  const visPoints = _computeVisibilityPolygon(px, py, viewRadius, walls);

  if (!_fogCanvas || _fogCanvas.width !== CANVAS_W || _fogCanvas.height !== CANVAS_H) {
    _fogCanvas = document.createElement('canvas');
    _fogCanvas.width = CANVAS_W;
    _fogCanvas.height = CANVAS_H;
    _fogCtx = _fogCanvas.getContext('2d');
  }
  const fCtx = _fogCtx;
  fCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Fill fog fully dark
  fCtx.globalCompositeOperation = 'source-over';
  fCtx.fillStyle = 'rgba(0,0,0,0.93)';
  fCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Cut the visibility polygon out of the fog (world → screen coords)
  if (visPoints.length > 0) {
    fCtx.globalCompositeOperation = 'destination-out';
    fCtx.beginPath();
    fCtx.moveTo((visPoints[0].x - camX) * zoom, (visPoints[0].y - camY) * zoom);
    for (let i = 1; i < visPoints.length; i++) {
      fCtx.lineTo((visPoints[i].x - camX) * zoom, (visPoints[i].y - camY) * zoom);
    }
    fCtx.closePath();
    fCtx.fillStyle = 'rgba(0,0,0,1)';
    fCtx.fill();
  }

  // Composite onto main canvas
  ctx.drawImage(_fogCanvas, 0, 0);

  // Soft distance vignette inside the visible area (skipped for Salt — "no fog")
  if (vignette) {
    const sx = (px - camX) * zoom;
    const sy = (py - camY) * zoom;
    const vr = viewRadius * zoom;
    const vg = ctx.createRadialGradient(sx, sy, vr * 0.35, sx, sy, vr * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vg;
    ctx.beginPath();
    ctx.arc(sx, sy, vr, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTaskConsole(ctx, x, y, task) {
  const w = 28, h = 22;
  const done = task.done;

  ctx.shadowColor = done ? '#2ecc71' : '#3498db';
  ctx.shadowBlur = 8;
  ctx.fillStyle = done ? '#0a2a0a' : '#0a0a2a';
  ctx.fillRect(x - w/2, y - h/2, w, h);
  ctx.strokeStyle = done ? '#2ecc71' : '#3498db';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w/2, y - h/2, w, h);
  ctx.shadowBlur = 0;

  // Screen
  ctx.fillStyle = done ? '#1a4a1a' : '#1a1a3a';
  ctx.fillRect(x - w/2 + 2, y - h/2 + 2, w - 4, h - 8);

  // Progress bar
  const barW = w - 4;
  const fill = done ? barW : Math.floor(((task.progress || 0) / 900) * barW);
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(x - w/2 + 2, y + h/2 - 6, barW, 4);
  ctx.fillStyle = done ? '#2ecc71' : '#3498db';
  ctx.fillRect(x - w/2 + 2, y + h/2 - 6, fill, 4);

  // Label
  ctx.fillStyle = done ? '#2ecc71' : '#3498db';
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(done ? 'DONE' : 'TASK', x, y + h/2 + 8);
}

function drawElectricalPost(ctx, x, y, electricityOn) {
  const w = 28, h = 26;
  const col = electricityOn ? '#f39c12' : '#e74c3c';
  ctx.shadowColor = col;
  ctx.shadowBlur = electricityOn ? 8 : 16;
  ctx.fillStyle = electricityOn ? '#1a1000' : '#200000';
  ctx.fillRect(x - w/2, y - h/2, w, h);
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - w/2, y - h/2, w, h);
  ctx.shadowBlur = 0;
  ctx.fillStyle = col;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡', x, y + 5);
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.fillText(electricityOn ? 'ELEC' : 'OUT!', x, y + h/2 + 8);
}

function drawCCTVTerminal(ctx, x, y) {
  const w = 30, h = 24;
  ctx.shadowColor = '#3498db';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#050d18';
  ctx.fillRect(x - w/2, y - h/2, w, h);
  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w/2, y - h/2, w, h);
  ctx.shadowBlur = 0;

  // Camera icon lines
  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 4);
  ctx.lineTo(x + 6, y - 4);
  ctx.lineTo(x + 6, y + 4);
  ctx.lineTo(x - 6, y + 4);
  ctx.closePath();
  ctx.stroke();
  // Lens
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#3498db';
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CCTV', x, y + h/2 + 8);
}

function drawPortal(ctx, x, y) {
  const r = 14;
  ctx.save();
  // Outer glow ring
  ctx.shadowColor = '#8580EC';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = '#5850EC';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  // Inner spinning gradient fill
  const g = ctx.createRadialGradient(x, y, 2, x, y, r);
  g.addColorStop(0, 'rgba(136,128,236,0.7)');
  g.addColorStop(1, 'rgba(88,80,236,0.1)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Label
  ctx.fillStyle = '#8580EC';
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PORTAL', x, y + r + 10);
  ctx.restore();
}

function drawBody(ctx, body) {
  const x = body.pos.x;
  const y = body.pos.y;

  ctx.shadowColor = '#e74c3c';
  ctx.shadowBlur = 10;

  // Fallen cross shape
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#e74c3c22';
  ctx.fillRect(x - 12, y - 4, 24, 8);
  ctx.fillRect(x - 4, y - 12, 8, 24);

  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 12, y - 4, 24, 8);
  ctx.strokeRect(x - 4, y - 12, 8, 24);

  // Name
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#e74c3c';
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(body.killedName, x, y - 15);

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawPlayer(ctx, player, isMe, time = 0) {
  const x = player.pos.x;
  const y = player.pos.y;

  if (!player.alive) {
    drawDeadPlayer(ctx, x, y, player.color || '#888');
    return;
  }

  // Salt hiding: draw at 0 opacity for non-me (server omits Salt from state when hiding for non-villains)
  // If we receive Salt with hiding=true and we're not them, skip
  // (server already filters, but just in case)
  if (player.hiding && !isMe) {
    return;
  }

  // Walk bob — subtle vertical oscillation while alive
  const bob = player.alive ? Math.sin(time / 160) * 1.8 : 0;

  const alpha = player.hiding ? 0.15 : 1;
  ctx.globalAlpha = alpha;

  const s = isMe ? 12 : 10;
  const color = player.color || '#888888';
  const hat = player.hat || '#555555';

  if (isMe) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
  }

  // Legs
  ctx.fillStyle = hat;
  ctx.fillRect(x - 5, y + s + bob, 4, 6);
  ctx.fillRect(x + 1, y + s + bob, 4, 6);

  // Body
  ctx.fillStyle = color;
  ctx.fillRect(x - s/2, y - s/2 + 2 + bob, s, s + 2);

  // Backpack
  ctx.fillStyle = hat;
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillRect(x + s/2 + 1, y - 2 + bob, 4, 7);
  ctx.globalAlpha = alpha;

  // Head
  ctx.fillStyle = color;
  ctx.fillRect(x - s/2 - 1, y - s/2 - 6 + bob, s + 2, s);

  // Hat brim
  ctx.fillStyle = hat;
  ctx.fillRect(x - s/2 - 3, y - s/2 - 9 + bob, s + 6, 4);
  ctx.fillRect(x - s/2 - 1, y - s/2 - 12 + bob, s + 2, 4);

  // Eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 4, y - s/2 - 4 + bob, 3, 3);
  ctx.fillRect(x + 1, y - s/2 - 4 + bob, 3, 3);

  // Eye shine
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 4, y - s/2 - 4 + bob, 1, 1);
  ctx.fillRect(x + 1, y - s/2 - 4 + bob, 1, 1);

  ctx.shadowBlur = 0;

  // Villain knife icon (only for self if villain)
  if (isMe && player.isVillain) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e74c3c';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔪', x, y - s - 8);
  }

  ctx.globalAlpha = 1;

  // Show name above every player; highlight self with arrow
  // Name label is NOT bobbed — stays at fixed position
  ctx.textAlign = 'center';
  if (isMe) {
    const label = `▶ ${player.charId ? (player.charId.charAt(0).toUpperCase() + player.charId.slice(1)) : player.name}`;
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = '#000000cc';
    ctx.fillText(label, x + 1, y - s - 5);
    ctx.fillStyle = '#f39c12';
    ctx.fillText(label, x, y - s - 6);
  } else {
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.fillStyle = '#000000cc';
    ctx.fillText(player.name, x + 1, y - s - 4);
    ctx.fillStyle = player.color || '#cccccc';
    ctx.fillText(player.name, x, y - s - 5);
  }
}

function drawDeadPlayer(ctx, x, y, color) {
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = color;
  // Fallen body (horizontal)
  ctx.fillRect(x - 10, y - 3, 20, 6);
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#777';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✝', x, y + 4);
  ctx.globalAlpha = 1;
}

function drawDayHUD(ctx, state, camX, camY) {
  const x = camX + 8;
  const y = camY + 8;
  const w = 140;
  const h = 30;

  const totalTasks = state.tasks ? state.tasks.length : 0;
  const doneTasks = state.tasks ? state.tasks.filter(t => t.done).length : 0;
  const taskPct = totalTasks > 0 ? doneTasks / totalTasks : 0;

  ctx.fillStyle = '#0d1117dd';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#1e3a5f';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#f39c12';
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`DAY ${state.day}`, x + 6, y + 12);

  ctx.fillStyle = '#7f8c8d';
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText(`TASKS: ${doneTasks}/${totalTasks}`, x + 6, y + 22);

  // Task bar
  ctx.fillStyle = '#1e3a5f';
  ctx.fillRect(x, y + h, w, 4);
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(x, y + h, Math.floor(w * taskPct), 4);
}
