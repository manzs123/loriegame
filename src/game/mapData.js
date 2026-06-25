export const MAP_W = 2000;
export const MAP_H = 1300;

// Rooms are visual zones only — no collision effect.
// The entire map is walkable floor; WALLS are the solid barriers.
export const ROOMS = [
  { id:'security',   name:'Security',     x:10,  y:10,  w:620, h:605, color:'#0d1b2a', border:'#3498db' },
  { id:'cafeteria',  name:'Cafeteria',    x:660, y:10,  w:680, h:605, color:'#1a2332', border:'#f39c12' },
  { id:'lab',        name:'Lab',          x:1370,y:10,  w:620, h:605, color:'#0d1b2a', border:'#2ecc71' },
  { id:'dark_room',  name:'Dark Room',    x:10,  y:645, w:620, h:645, color:'#030303', border:'#636e72' },
  { id:'control',    name:'Control Room', x:660, y:645, w:680, h:645, color:'#111820', border:'#e74c3c' },
  { id:'storage',    name:'Storage',      x:1370,y:645, w:620, h:645, color:'#0d1b2a', border:'#e67e22' },
];

// Solid wall barriers — players cannot enter these rectangles.
// Layout: 3×2 grid with two vertical walls and one horizontal wall.
// Door gaps — left/right vertical: y=180–430 (top door), y=760–1010 (bottom door)
// Door gaps — horizontal: x=260–520 (left), x=830–1170 (center), x=1480–1740 (right)
export const WALLS = [
  // Left vertical divider (x=630–660)
  { x:630,  y:10,   w:30, h:170 },
  { x:630,  y:430,  w:30, h:330 },
  { x:630,  y:1010, w:30, h:280 },
  // Right vertical divider (x=1340–1370)
  { x:1340, y:10,   w:30, h:170 },
  { x:1340, y:430,  w:30, h:330 },
  { x:1340, y:1010, w:30, h:280 },
  // Horizontal middle divider (y=615–645)
  { x:10,   y:615,  w:250, h:30 },
  { x:520,  y:615,  w:110, h:30 },
  { x:660,  y:615,  w:170, h:30 },
  { x:1170, y:615,  w:170, h:30 },
  { x:1370, y:615,  w:110, h:30 },
  { x:1740, y:615,  w:250, h:30 },
];

export const TASKS = [
  { id:'food',    name:'Fix Food Processor',  room:'cafeteria', steps:3 },
  { id:'oxygen',  name:'Repair Oxygen',       room:'lab',       steps:3 },
  { id:'samples', name:'Collect Samples',      room:'storage',   steps:3 },
  { id:'nav',     name:'Upload Nav Data',      room:'control',   steps:3 },
];

export const TASK_POSITIONS = {
  cafeteria: { x:1000, y:300 },
  lab:       { x:1680, y:300 },
  storage:   { x:1680, y:960 },
  control:   { x:1000, y:960 },
};

export const CCTV_TERMINAL  = { x:250, y:350 };
export const ELECTRICAL_POST = { x:150, y:200 };

export const TELEPORT_PORTALS = [
  { roomId:'security',  x:480,  y:480  },
  { roomId:'cafeteria', x:800,  y:400  },
  { roomId:'lab',       x:1500, y:400  },
  { roomId:'dark_room', x:320,  y:900  },
  { roomId:'control',   x:800,  y:800  },
  { roomId:'storage',   x:1500, y:800  },
];

export function isWalkable(x, y, r = 0) {
  if (x - r < 10 || x + r > MAP_W - 10 || y - r < 10 || y + r > MAP_H - 10) return false;
  return !WALLS.some(w =>
    x + r >= w.x && x - r <= w.x + w.w &&
    y + r >= w.y && y - r <= w.y + w.h
  );
}

export function getRoomForPos(pos) {
  return ROOMS.find(r =>
    pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h
  );
}
