'use strict';

// ─── DEV MODE ─────────────────────────────────────────────────────────────────
// Flip to true to debug: unrestricted movement, 5× speed.
// Also flip DEV_MODE in src/components/GameMap.jsx (full map view, no fog).
const DEV_MODE = false;
// ──────────────────────────────────────────────────────────────────────────────

// Random colors assigned per-player so no fixed color reveals Lorie
const PLAYER_COLORS = [
  { color:'#3498db', hat:'#1f618d' },
  { color:'#2ecc71', hat:'#1e8449' },
  { color:'#f39c12', hat:'#b7770d' },
  { color:'#1abc9c', hat:'#117a65' },
  { color:'#9b59b6', hat:'#6c3483' },
  { color:'#e67e22', hat:'#a04000' },
  { color:'#fd79a8', hat:'#c2185b' },
  { color:'#00cec9', hat:'#00897b' },
  { color:'#a29bfe', hat:'#6c5ce7' },
  { color:'#fdcb6e', hat:'#e17055' },
];

const CHARACTERS = [
  { id:'lorie',  name:'Lorie',  role:'villain',      skill:'SABOTAGE',       skillCooldown:1 },
  { id:'aella',  name:'Aella',  role:'crewmate',     skill:'INSTANT_REVIEW', skillCooldown:3 },
  { id:'josh',   name:'Josh',   role:'crewmate',     skill:'SCAN',           skillCooldown:1 },
  { id:'ysa',    name:'Ysa',    role:'crewmate',     skill:'FAST_TASK',      skillCooldown:2 },
  { id:'kai',    name:'Kai',    role:'double_agent', skill:'CHOOSE_SIDE',    skillCooldown:0 },
  { id:'yuki',   name:'Yuki',   role:'crewmate',     skill:'CCTV',           skillCooldown:2 },
  { id:'zero',   name:'Zero',   role:'crewmate',     skill:'FLOWER',         skillCooldown:0 },
  { id:'synth',  name:'Synth',  role:'crewmate',     skill:'CCTV_MSG',       skillCooldown:2 },
  { id:'salt',   name:'Salt',   role:'crewmate',     skill:'NO_FOG',         skillCooldown:0 },
  { id:'ela',    name:'Ela',    role:'crewmate',     skill:'BROADCAST',      skillCooldown:2 },
  { id:'alaska', name:'Alaska', role:'crewmate',     skill:'TELEPORT',       skillCooldown:3 },
];

const MAP_W = 2000, MAP_H = 1300;

// Rooms are visual zones only — no collision effect.
// Entire map is walkable floor; WALLS are the solid barriers.
const ROOMS = [
  { id:'security',   name:'Security',     x:10,  y:10,  w:620, h:605 },
  { id:'cafeteria',  name:'Cafeteria',    x:660, y:10,  w:680, h:605 },
  { id:'lab',        name:'Lab',          x:1370,y:10,  w:620, h:605 },
  { id:'dark_room',  name:'Dark Room',    x:10,  y:645, w:620, h:645 },
  { id:'control',    name:'Control Room', x:660, y:645, w:680, h:645 },
  { id:'storage',    name:'Storage',      x:1370,y:645, w:620, h:645 },
];

// Solid wall barriers — players cannot enter these rectangles.
// Layout: 3×2 grid divided by two vertical walls and one horizontal wall.
// Door gaps in left vertical: y=180-430 (top), y=760-1010 (bottom)
// Door gaps in right vertical: same y positions
// Door gaps in horizontal: x=260-520 (left), x=830-1170 (center), x=1480-1740 (right)
const WALLS = [
  // Left vertical divider (x=630-660)
  { x:630, y:10,   w:30, h:170 },
  { x:630, y:430,  w:30, h:330 },
  { x:630, y:1010, w:30, h:280 },
  // Right vertical divider (x=1340-1370)
  { x:1340, y:10,   w:30, h:170 },
  { x:1340, y:430,  w:30, h:330 },
  { x:1340, y:1010, w:30, h:280 },
  // Horizontal middle divider (y=615-645)
  { x:10,   y:615, w:250, h:30 },
  { x:520,  y:615, w:110, h:30 },
  { x:660,  y:615, w:170, h:30 },
  { x:1170, y:615, w:170, h:30 },
  { x:1370, y:615, w:110, h:30 },
  { x:1740, y:615, w:250, h:30 },
];

const TASK_DURATION = 900; // 30 seconds at 30 fps

const TASK_POSITIONS = {
  cafeteria: { x:1000, y:300 },
  lab:       { x:1680, y:300 },
  storage:   { x:1680, y:960 },
  control:   { x:1000, y:960 },
};

const ELECTRICAL_POST = { x:150, y:200 };
const TASK_WORK_RADIUS = 60;

const TASKS = [
  { id:'food',    name:'Fix Food Processor',    room:'cafeteria' },
  { id:'oxygen',  name:'Repair Oxygen System',  room:'lab'       },
  { id:'samples', name:'Collect Samples',        room:'storage'   },
  { id:'nav',     name:'Upload Navigation Data', room:'control'   },
];

const SPAWN_POSITIONS = [
  { x:300,  y:300  },
  { x:1000, y:300  },
  { x:1680, y:300  },
  { x:300,  y:960  },
  { x:1000, y:960  },
  { x:1680, y:960  },
  { x:300,  y:500  },
  { x:1000, y:500  },
  { x:1680, y:500  },
  { x:300,  y:800  },
  { x:1680, y:800  },
];

const TELEPORT_PORTALS = [
  { roomId:'security',  x:480,  y:480  },
  { roomId:'cafeteria', x:800,  y:400  },
  { roomId:'lab',       x:1500, y:400  },
  { roomId:'dark_room', x:320,  y:900  },
  { roomId:'control',   x:800,  y:800  },
  { roomId:'storage',   x:1500, y:800  },
];

function isWalkable(x, y) {
  if (DEV_MODE) return x >= 10 && x <= MAP_W - 10 && y >= 10 && y <= MAP_H - 10;
  if (x < 10 || x > MAP_W - 10 || y < 10 || y > MAP_H - 10) return false;
  return !WALLS.some(w => x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h);
}

const BOT_NAMES = [
  'Nova', 'Blaze', 'Echo', 'Frost', 'Vex', 'Colt', 'Remi', 'Skye',
  'Dusk', 'Jinx', 'Orion', 'Sable', 'Cruz', 'Wren', 'Axel', 'Lyra',
  'Mace', 'Kira', 'Zane', 'Sage', 'Rex', 'Nola', 'Hawk', 'Faye',
  'Brix', 'Mira', 'Thorn', 'Cleo', 'Volt', 'Iris',
];

function randomBotName(usedNames) {
  const available = BOT_NAMES.filter(n => !usedNames.has(n));
  const pool = available.length > 0 ? available : BOT_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getRoomForPos(pos) {
  return ROOMS.find(r =>
    pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h
  );
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class GameRoom {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.clients = new Map(); // socketId -> { ws, name, charId, isHost }
    this.state = null;
    this.phase = 'lobby'; // lobby | playing | review | gameover
    this.inputBuffer = new Map(); // socketId -> {dx, dy}
    this.loopInterval = null;
    this.tick = 0;
    this.cctvSession = null; // { socketId, roomId, endTick, cooldownEndTick }
    this.electricityCutTick = 0;
    this.reviewStartTick = 0;
  }

  addClient(socketId, ws, name, isHost) {
    this.clients.set(socketId, { ws, name, isHost, charId: null });
    this.broadcast({ type:'LOBBY_STATE', players: this.getLobbyPlayers(), roomCode: this.roomCode });
  }

  removeClient(socketId) {
    this.clients.delete(socketId);
    this.inputBuffer.delete(socketId);
    if (this.phase === 'lobby') {
      // Reassign host if needed
      if (this.clients.size > 0) {
        const first = this.clients.keys().next().value;
        this.clients.get(first).isHost = true;
      }
      this.broadcast({ type:'LOBBY_STATE', players: this.getLobbyPlayers(), roomCode: this.roomCode });
    }
  }

  getLobbyPlayers() {
    return Array.from(this.clients.entries()).map(([id, c]) => ({
      id, name: c.name, isHost: c.isHost
    }));
  }

  startGame() {
    if (this.phase !== 'lobby') return;

    const playerIds = Array.from(this.clients.keys());
    // Assign characters randomly; Lorie always assigned
    const charIds = shuffle(CHARACTERS.map(c => c.id));

    // Ensure Lorie is assigned to someone
    const lorieIdx = charIds.indexOf('lorie');
    if (lorieIdx >= playerIds.length) {
      // Lorie not in player range, swap into range
      const swapWith = Math.floor(Math.random() * playerIds.length);
      [charIds[lorieIdx], charIds[swapWith]] = [charIds[swapWith], charIds[lorieIdx]];
    }

    // Assign chars to players
    playerIds.forEach((id, i) => {
      if (i < charIds.length) {
        this.clients.get(id).charId = charIds[i];
      }
    });

    // Build game state
    this.state = this.buildInitialState(playerIds, charIds);
    this.phase = 'playing';

    // Send GAME_START to each client
    this.clients.forEach((client, socketId) => {
      const charDef = CHARACTERS.find(c => c.id === client.charId);
      client.ws.send(JSON.stringify({
        type: 'GAME_START',
        yourCharId: client.charId,
        yourIsVillain: charDef ? charDef.role === 'villain' : false,
      }));
    });

    this.startLoop();
    this.broadcastState();
  }

  buildInitialState(playerIds, charIds) {
    const shuffledColors = shuffle([...PLAYER_COLORS]);
    const usedBotNames = new Set();

    const players = CHARACTERS.map((ch, i) => {
      const spawn = SPAWN_POSITIONS[i % SPAWN_POSITIONS.length];
      const socketId = playerIds.findIndex(id => this.clients.get(id)?.charId === ch.id);
      const clientEntry = socketId >= 0 ? playerIds[socketId] : null;
      const clientData = clientEntry ? this.clients.get(clientEntry) : null;
      const pc = shuffledColors[i % shuffledColors.length];

      let name;
      if (clientData) {
        name = clientData.name;
      } else {
        name = randomBotName(usedBotNames);
        usedBotNames.add(name);
      }

      return {
        charId: ch.id,
        name,
        color: pc.color,
        hat: pc.hat,
        skill: ch.skill,
        skillCooldown: ch.skillCooldown,
        skillCooldownLeft: 0,
        role: ch.role,
        isVillain: ch.role === 'villain',
        isAI: !clientEntry,
        socketId: clientEntry,
        pos: { x: spawn.x + (Math.random() - 0.5) * 60, y: spawn.y + (Math.random() - 0.5) * 60 },
        alive: true,
        hiding: false,
        sideChosen: ch.id === 'kai' ? null : undefined,
        flowerSent: false,
        flowerAccepted: false,
        scansReceived: {},
        aiTarget: null,
        cctvCooldownTick: 0,
      };
    });

    // Kai AI: choose side immediately
    const kaiPlayer = players.find(p => p.charId === 'kai' && p.isAI);
    if (kaiPlayer) {
      const side = Math.random() < 0.4 ? 'lorie' : 'crew';
      kaiPlayer.sideChosen = side;
      kaiPlayer.isVillain = side === 'lorie';
    }

    const tasks = TASKS.map(t => ({ id: t.id, name: t.name, room: t.room, progress: 0, done: false }));

    return {
      day: 1,
      phase: 'playing',
      players,
      tasks,
      bodies: [],
      reviewActive: false,
      reviewReason: '',
      voteTimeLeft: 0,
      votes: {},
      messages: [{ text: 'Game started! Find Lorie!', day: 1, type: 'info' }],
      lorieKilledToday: false,
      saltKilledToday: false,
      electricityOn: true,
      dayTimer: 0,
      ejected: null,
      winner: null,
      lorieCharId: null,
    };
  }

  startLoop() {
    this.loopInterval = setInterval(() => this.gameTick(), 1000 / 30);
  }

  stopLoop() {
    if (this.loopInterval) { clearInterval(this.loopInterval); this.loopInterval = null; }
  }

  gameTick() {
    if (!this.state || this.state.winner) return;

    this.tick++;
    const s = this.state;

    // During review: only count down vote timer
    if (s.reviewActive) {
      const elapsed = Math.floor((this.tick - this.reviewStartTick) / 30);
      const newTimeLeft = Math.max(0, 60 - elapsed);
      if (newTimeLeft !== s.voteTimeLeft) {
        s.voteTimeLeft = newTimeLeft;
        this.broadcastState();
        if (newTimeLeft <= 0) {
          this.finalizeVote();
        }
      }
      return;
    }

    // Apply inputs (0,0 inputs stop the player)
    this.inputBuffer.forEach((input, socketId) => {
      const player = s.players.find(p => p.socketId === socketId && p.alive);
      if (!player) return;
      const speed = DEV_MODE ? 50 : 5;
      const nx = player.pos.x + input.dx * speed;
      const ny = player.pos.y + input.dy * speed;
      if (isWalkable(nx, ny)) {
        player.pos.x = clamp(nx, 10, MAP_W - 10);
        player.pos.y = clamp(ny, 10, MAP_H - 10);
      } else if (isWalkable(nx, player.pos.y)) {
        player.pos.x = clamp(nx, 10, MAP_W - 10);
      } else if (isWalkable(player.pos.x, ny)) {
        player.pos.y = clamp(ny, 10, MAP_H - 10);
      }
      if (player.charId === 'salt' && player.hiding) {
        const room = getRoomForPos(player.pos);
        if (!room || room.id !== 'dark_room') player.hiding = false;
      }
    });

    // AI movement
    s.players.forEach(p => {
      if (!p.isAI || !p.alive || p.hiding) return;
      if (!p.aiTarget || dist(p.pos, p.aiTarget) < 15 || Math.random() < 0.003) {
        const zone = ROOMS[Math.floor(Math.random() * ROOMS.length)];
        p.aiTarget = {
          x: zone.x + 20 + Math.random() * (zone.w - 40),
          y: zone.y + 20 + Math.random() * (zone.h - 40),
        };
      }
      const dx = p.aiTarget.x - p.pos.x;
      const dy = p.aiTarget.y - p.pos.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = p.pos.x + (dx / d) * 1.8;
      const ny = p.pos.y + (dy / d) * 1.8;
      if (isWalkable(nx, ny)) {
        p.pos.x = clamp(nx, 10, MAP_W - 10);
        p.pos.y = clamp(ny, 10, MAP_H - 10);
      }
    });

    // Proximity-based task progress
    if (s.electricityOn) {
      s.tasks.forEach(task => {
        if (task.done) return;
        const tpos = TASK_POSITIONS[task.room];
        if (!tpos) return;
        const hasWorker = s.players.some(p => p.alive && dist(p.pos, tpos) < TASK_WORK_RADIUS);
        if (hasWorker) {
          task.progress = (task.progress || 0) + 1;
          if (task.progress >= TASK_DURATION) {
            task.done = true;
            task.progress = TASK_DURATION;
            s.messages.push({ text:`Task "${task.name}" completed!`, day: s.day, type:'success' });
            this.checkWinConditions();
          }
        }
      });
    }

    // AI Lorie: sabotage electricity periodically
    if (this.tick % 900 === 450 && s.electricityOn) {
      const lorie = s.players.find(p => p.charId === 'lorie' && p.alive && p.isAI);
      if (lorie) this.skillSabotage(lorie);
    }

    // AI Lorie kill
    if (this.tick % 600 === 90) {
      const lorie = s.players.find(p => p.charId === 'lorie' && p.alive && p.isAI);
      if (lorie && !s.lorieKilledToday) this.lorieAIKill();
    }

    s.dayTimer++;
    if (s.dayTimer > 0 && s.dayTimer % 600 === 0) this.nextDay();

    this.broadcastState();
  }

  lorieAIKill() {
    const s = this.state;
    const lorie = s.players.find(p => p.charId === 'lorie' && p.alive);
    if (!lorie) return;

    const targets = s.players.filter(p =>
      p.alive && !p.isVillain && dist(p.pos, lorie.pos) < 80
    );
    if (targets.length === 0) return;

    const victim = targets[Math.floor(Math.random() * targets.length)];

    if (victim.charId === 'salt' && victim.hiding) {
      const lorieRoom = getRoomForPos(lorie.pos);
      if (!lorieRoom || lorieRoom.id !== 'dark_room') return;
    }

    const body = { id: victim.charId, pos: { ...victim.pos }, killedName: victim.name, day: s.day };
    victim.alive = false;
    s.bodies.push(body);
    s.lorieKilledToday = true;
    s.messages.push({ text: `Someone has been eliminated...`, day: s.day, type: 'danger' });
    this.checkWinConditions();
  }

  nextDay() {
    const s = this.state;
    s.day++;
    s.lorieKilledToday = false;
    s.saltKilledToday = false;
    s.players.forEach(p => {
      p.skillCooldownLeft = Math.max(0, p.skillCooldownLeft - 1);
    });
    s.messages.push({ text: `Day ${s.day} begins`, day: s.day, type: 'info' });
    this.checkWinConditions();
  }

  checkWinConditions() {
    const s = this.state;
    const alive = s.players.filter(p => p.alive);
    const villains = alive.filter(p => p.isVillain);
    const crew = alive.filter(p => !p.isVillain);

    if (villains.length === 0) {
      s.winner = 'crewmates';
      s.phase = 'gameover';
      s.lorieCharId = 'lorie';
      this.stopLoop();
      this.broadcast({ type:'GAME_OVER', winner:'crewmates', lorieCharId:'lorie' });
      return;
    }

    if (s.tasks.every(t => t.done)) {
      s.winner = 'crewmates';
      s.phase = 'gameover';
      s.lorieCharId = 'lorie';
      this.stopLoop();
      this.broadcast({ type:'GAME_OVER', winner:'crewmates', lorieCharId:'lorie' });
      return;
    }

    if (villains.length >= crew.length) {
      s.winner = 'lorie';
      s.phase = 'gameover';
      s.lorieCharId = 'lorie';
      this.stopLoop();
      this.broadcast({ type:'GAME_OVER', winner:'lorie', lorieCharId:'lorie' });
      return;
    }
  }

  handleMessage(socketId, msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'INPUT': {
        const dx = typeof msg.dx === 'number' ? clamp(msg.dx, -1, 1) : 0;
        const dy = typeof msg.dy === 'number' ? clamp(msg.dy, -1, 1) : 0;
        this.inputBuffer.set(socketId, { dx, dy });
        break;
      }
      case 'USE_SKILL': this.handleUseSkill(socketId, msg.extra); break;
      case 'KILL_NEARBY': this.handleKillNearby(socketId); break;
      case 'RESTORE_POWER': this.handleRestorePower(socketId); break;
      case 'REPORT_BODY': this.handleReportBody(socketId, msg.bodyId); break;
      case 'CAST_VOTE': this.handleCastVote(socketId, msg.targetId); break;
      case 'CHAT': this.handleChat(socketId, msg.text); break;
      case 'BROADCAST_MSG': this.handleBroadcast(socketId, msg.text); break;
      case 'KAI_CHOOSE': this.handleKaiChoose(socketId, msg.side); break;
      case 'FLOWER_RESPOND': this.handleFlowerRespond(socketId, msg.accept); break;
      case 'CCTV_VIEW': this.handleCCTVView(socketId, msg.roomId); break;
      case 'TELEPORT_TO': this.handleTeleport(socketId, msg.roomId); break;
      default: break;
    }
  }

  getPlayerBySocket(socketId) {
    if (!this.state) return null;
    return this.state.players.find(p => p.socketId === socketId);
  }

  handleUseSkill(socketId, extra) {
    const s = this.state;
    if (!s || s.reviewActive || s.winner) return;
    const player = this.getPlayerBySocket(socketId);
    if (!player || !player.alive) return;
    if (player.skillCooldownLeft > 0) {
      this.sendTo(socketId, { type:'ERROR', message:`Skill on cooldown (${player.skillCooldownLeft} days)` });
      return;
    }

    switch (player.skill) {
      case 'SABOTAGE': this.skillSabotage(player); break;
      case 'INSTANT_REVIEW': this.skillInstantReview(player); break;
      case 'SCAN': this.skillScan(player, extra); break;
      case 'FAST_TASK': this.skillFastTask(player); break;
      case 'CHOOSE_SIDE':
        // Kai player opens modal on client side; server waits for KAI_CHOOSE
        this.sendTo(socketId, { type:'GAME_STATE', ...this.buildFilteredState(socketId) });
        break;
      case 'CCTV': this.skillCCTV(player, false); break;
      case 'CCTV_MSG': this.skillCCTV(player, true); break;
      case 'FLOWER': this.skillFlower(player); break;
      case 'HIDE': this.skillHide(player); break;
      case 'NO_FOG':
        this.sendTo(player.socketId, { type:'ERROR', message:'Fog Sight is always active — passive ability.' });
        break;
      case 'TELEPORT':
        // Client opens TeleportModal, sends TELEPORT_TO
        break;
      case 'BROADCAST':
        // Client opens broadcast modal, sends BROADCAST_MSG
        break;
      default: break;
    }
  }

  skillSabotage(player) {
    const s = this.state;
    if (!s.electricityOn) {
      if (player.socketId) this.sendTo(player.socketId, { type:'ERROR', message:'Electricity already cut!' });
      return;
    }
    s.electricityOn = false;
    s.tasks.forEach(t => { if (!t.done) t.progress = 0; });
    player.skillCooldownLeft = player.skillCooldown;
    s.messages.push({ text:'The electricity has been cut!', day: s.day, type:'danger' });
    this.broadcast({ type:'BROADCAST', text:'ELECTRICITY CUT! Go to the electrical post in Security!', day: s.day });
    this.broadcastState();
  }

  handleKillNearby(socketId) {
    const s = this.state;
    if (!s || s.reviewActive || s.winner) return;
    const player = this.getPlayerBySocket(socketId);
    if (!player || !player.alive || player.charId !== 'lorie') return;
    if (s.lorieKilledToday) {
      this.sendTo(socketId, { type:'ERROR', message:'Already killed today!' });
      return;
    }
    const target = s.players.find(p =>
      p.alive && !p.isVillain && p.charId !== player.charId && dist(p.pos, player.pos) < 80
    );
    if (!target) {
      this.sendTo(socketId, { type:'ERROR', message:'No one nearby to kill!' });
      return;
    }
    if (target.charId === 'salt' && target.hiding) {
      const lorieRoom = getRoomForPos(player.pos);
      if (!lorieRoom || lorieRoom.id !== 'dark_room') {
        this.sendTo(socketId, { type:'ERROR', message:'Salt is hiding!' });
        return;
      }
    }
    const isSalt = target.charId === 'salt';
    s.bodies.push({ id: target.charId, pos: { ...target.pos }, killedName: target.name, day: s.day });
    target.alive = false;
    s.lorieKilledToday = !isSalt;
    s.saltKilledToday = isSalt;
    s.messages.push({ text:`${target.name} has been eliminated!`, day: s.day, type:'danger' });
    this.checkWinConditions();
    this.broadcastState();
  }

  handleRestorePower(socketId) {
    const s = this.state;
    if (!s || s.winner) return;
    if (s.electricityOn) return;
    const player = this.getPlayerBySocket(socketId);
    if (!player || !player.alive) return;
    if (dist(player.pos, ELECTRICAL_POST) > 70) {
      this.sendTo(socketId, { type:'ERROR', message:'Move to the electrical post in Security!' });
      return;
    }
    s.electricityOn = true;
    s.messages.push({ text:`${player.name} restored electricity!`, day: s.day, type:'success' });
    this.broadcastState();
  }

  skillInstantReview(player) {
    const s = this.state;
    s.reviewActive = true;
    s.reviewReason = `${player.name} called an emergency review!`;
    s.voteTimeLeft = 60;
    s.votes = {};
    this.reviewStartTick = this.tick;
    player.skillCooldownLeft = player.skillCooldown;
    s.messages.push({ text: `${player.name} called an emergency review!`, day: s.day, type:'warning' });
    this.aiCastVotes();
    this.broadcastState();
  }

  skillScan(player, targetId) {
    const s = this.state;
    const target = targetId
      ? s.players.find(p => p.charId === targetId && p.alive)
      : s.players.find(p => p.alive && p.charId !== player.charId && dist(p.pos, player.pos) < 90);

    if (!target) {
      this.sendTo(player.socketId, { type:'ERROR', message:'No player nearby to scan!' });
      return;
    }

    const prev = (target.scansReceived[player.charId] || 0);
    const count = prev + 1;
    target.scansReceived[player.charId] = count;
    player.skillCooldownLeft = player.skillCooldown;

    if (count >= 3) {
      this.sendTo(player.socketId, {
        type: 'SCAN_RESULT',
        targetName: target.name,
        isLorie: target.isVillain,
      });
    }
    s.messages.push({ text: `Josh scanned ${target.name} (${count}/3)`, day: s.day, type:'info' });
    this.broadcastState();
  }

  skillFastTask(player) {
    const s = this.state;
    const room = getRoomForPos(player.pos);
    if (!room) {
      this.sendTo(player.socketId, { type:'ERROR', message:'Not in a room!' });
      return;
    }
    const task = s.tasks.find(t => t.room === room.id && !t.done);
    if (!task) {
      this.sendTo(player.socketId, { type:'ERROR', message:'No task in this room!' });
      return;
    }
    const boost = Math.ceil(TASK_DURATION / 2);
    task.progress = Math.min(TASK_DURATION, (task.progress || 0) + boost);
    task.done = task.progress >= TASK_DURATION;
    player.skillCooldownLeft = player.skillCooldown;
    s.messages.push({ text: `Ysa speed-boosted a task!`, day: s.day, type:'success' });
    this.checkWinConditions();
    this.broadcastState();
  }

  skillCCTV(player, canMessage) {
    const now = this.tick;
    if (player.cctvCooldownTick > now) {
      const secsLeft = Math.ceil((player.cctvCooldownTick - now) / 30);
      this.sendTo(player.socketId, { type:'ERROR', message:`CCTV on cooldown (${secsLeft}s)` });
      return;
    }

    player.skillCooldownLeft = player.skillCooldown;
    player.cctvCooldownTick = now + 30 * 30; // 30 second cooldown

    // Start a 15-second CCTV session
    this.cctvSession = {
      socketId: player.socketId,
      canMessage,
      selectedRoomId: null,
      endTick: now + 15 * 30,
    };

    // Send initial CCTV data for first room
    this.sendCCTVData(player.socketId, this.state.players[0]?.charId ? ROOMS[0].id : ROOMS[0].id);
    this.broadcastState();
  }

  sendCCTVData(socketId, roomId) {
    const room = ROOMS.find(r => r.id === roomId);
    if (!room) return;
    const s = this.state;
    const occupants = s.players
      .filter(p => p.alive && !p.hiding &&
        p.pos.x >= room.x && p.pos.x <= room.x + room.w &&
        p.pos.y >= room.y && p.pos.y <= room.y + room.h
      )
      .map(p => p.name);

    const timeLeft = this.cctvSession
      ? Math.max(0, Math.ceil((this.cctvSession.endTick - this.tick) / 30))
      : 0;

    this.sendTo(socketId, {
      type: 'CCTV_DATA',
      roomId,
      roomName: room.name,
      occupants,
      timeLeft,
    });
  }

  skillFlower(player) {
    const s = this.state;
    if (player.flowerSent) {
      this.sendTo(player.socketId, { type:'ERROR', message:'Already sent a flower!' });
      return;
    }
    player.flowerSent = true;
    player.skillCooldownLeft = player.skillCooldown;

    // Find Lorie
    const lorie = s.players.find(p => p.charId === 'lorie');
    s.messages.push({ text: `Zero sent a flower to Lorie...`, day: s.day, type:'info' });

    if (lorie && !lorie.isAI && lorie.socketId) {
      // Send flower prompt to Lorie's socket
      this.sendTo(lorie.socketId, { type:'FLOWER_PROMPT', senderName: player.name });
    } else {
      // AI Lorie decides
      const accept = Math.random() < 0.5;
      this.flowerResult(accept);
    }
    this.broadcastState();
  }

  flowerResult(accept) {
    const s = this.state;
    const zero = s.players.find(p => p.charId === 'zero');
    if (zero) {
      zero.flowerAccepted = accept;
      zero.isVillain = accept;
    }
    s.messages.push({
      text: accept
        ? `Lorie accepted Zero's flower! Zero has joined the villains!`
        : `Lorie rejected Zero's flower. Zero remains a crewmate.`,
      day: s.day,
      type: accept ? 'danger' : 'info',
    });
    this.checkWinConditions();
    this.broadcastState();
  }

  skillHide(player) {
    const room = getRoomForPos(player.pos);
    if (!room || room.id !== 'dark_room') {
      this.sendTo(player.socketId, { type:'ERROR', message:'Go to the Dark Room to hide!' });
      return;
    }
    player.hiding = true;
    player.skillCooldownLeft = player.skillCooldown;
    this.state.messages.push({ text: `Salt hides in the darkness...`, day: this.state.day, type:'info' });
    this.broadcastState();
  }

  handleReportBody(socketId, bodyId) {
    const s = this.state;
    if (!s || s.reviewActive || s.winner) return;
    const player = this.getPlayerBySocket(socketId);
    if (!player || !player.alive) return;

    const body = s.bodies.find(b => b.id === bodyId);
    if (!body) return;

    const d = dist(player.pos, body.pos);
    if (d > 80) return;

    s.reviewActive = true;
    s.reviewReason = `${player.name} found a body!`;
    s.voteTimeLeft = 60;
    s.votes = {};
    this.reviewStartTick = this.tick;
    s.messages.push({ text: `Body reported! Emergency review called!`, day: s.day, type:'danger' });
    this.aiCastVotes();
    this.broadcastState();
  }

  aiCastVotes() {
    const s = this.state;
    const alivePlayers = s.players.filter(p => p.alive);
    alivePlayers.forEach(p => {
      if (!p.isAI) return;
      s.votes[p.charId] = this.aiPickVote(p);
    });
  }

  aiPickVote(voter) {
    const s = this.state;
    const candidates = s.players.filter(p => p.alive && p.charId !== voter.charId);
    if (voter.isVillain) {
      const crew = candidates.filter(p => !p.isVillain);
      if (crew.length > 0) return crew[Math.floor(Math.random() * crew.length)].charId;
    }
    if (Math.random() < 0.25) return 'skip';
    return candidates[Math.floor(Math.random() * candidates.length)]?.charId || 'skip';
  }

  handleCastVote(socketId, targetId) {
    const s = this.state;
    if (!s || !s.reviewActive) return;
    const player = this.getPlayerBySocket(socketId);
    if (!player || !player.alive) return;

    s.votes[player.charId] = targetId;

    // Check if all human players have voted
    const humanAlive = s.players.filter(p => !p.isAI && p.alive);
    const allHumanVoted = humanAlive.every(p => s.votes[p.charId] !== undefined);

    if (allHumanVoted) {
      this.finalizeVote();
    } else {
      this.broadcastState();
    }
  }

  finalizeVote() {
    const s = this.state;
    const counts = {};
    Object.values(s.votes).forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });

    let maxVotes = 0;
    let ejected = null;
    for (const [id, count] of Object.entries(counts)) {
      if (count > maxVotes) { maxVotes = count; ejected = id; }
    }
    const tied = Object.values(counts).filter(c => c === maxVotes).length > 1;
    if (tied || ejected === 'skip') ejected = null;

    s.reviewActive = false;
    s.voteTimeLeft = 0;
    s.bodies = [];
    s.lorieKilledToday = false;

    if (ejected) {
      const ejectedPlayer = s.players.find(p => p.charId === ejected);
      if (ejectedPlayer) ejectedPlayer.alive = false;
      if (ejectedPlayer?.isVillain) {
        s.messages.push({
          text: `${ejectedPlayer.name} was ejected. They were a villain!`,
          day: s.day, type: 'success',
        });
      } else {
        s.messages.push({
          text: `${ejectedPlayer?.name} was ejected. They were innocent. Lorie is still alive!`,
          day: s.day, type: 'danger',
        });
      }
    } else {
      s.messages.push({ text: 'No majority. No one was ejected. Lorie is still alive!', day: s.day, type:'warning' });
    }

    this.checkWinConditions();
    this.broadcastState();
  }

  handleChat(socketId, text) {
    if (!text || typeof text !== 'string') return;
    const player = this.getPlayerBySocket(socketId);
    if (!player) return;
    if (!player.alive) return; // dead can't chat

    const truncated = text.substring(0, 100);
    const msg = {
      type: 'CHAT_MSG',
      senderName: player.name,
      text: truncated,
      day: this.state ? this.state.day : 0,
      isDead: false,
    };
    this.broadcast(msg);
  }

  handleBroadcast(socketId, text) {
    if (!text || typeof text !== 'string') return;
    const msg = {
      type: 'BROADCAST',
      text: text.substring(0, 100),
      day: this.state ? this.state.day : 0,
    };
    this.broadcast(msg);
  }

  handleKaiChoose(socketId, side) {
    const s = this.state;
    if (!s) return;
    const player = this.getPlayerBySocket(socketId);
    if (!player || player.charId !== 'kai') return;
    player.sideChosen = side;
    player.isVillain = side === 'lorie';
    player.skillCooldownLeft = player.skillCooldown;
    s.messages.push({
      text: `Kai has chosen to side with ${side === 'lorie' ? 'Lorie' : 'the crewmates'}`,
      day: s.day,
      type: 'warning',
    });
    this.broadcastState();
  }

  handleFlowerRespond(socketId, accept) {
    const s = this.state;
    if (!s) return;
    const player = this.getPlayerBySocket(socketId);
    if (!player || player.charId !== 'lorie') return;
    this.flowerResult(accept);
  }

  handleCCTVView(socketId, roomId) {
    if (!this.cctvSession || this.cctvSession.socketId !== socketId) return;
    if (this.tick > this.cctvSession.endTick) {
      this.cctvSession = null;
      return;
    }
    this.sendCCTVData(socketId, roomId);
  }

  handleTeleport(socketId, roomId) {
    const s = this.state;
    if (!s || s.reviewActive || s.winner) return;
    const player = this.getPlayerBySocket(socketId);
    if (!player || !player.alive || player.charId !== 'alaska') return;
    if (player.skillCooldownLeft > 0) {
      this.sendTo(socketId, { type:'ERROR', message:`Teleport on cooldown (${player.skillCooldownLeft} days)` });
      return;
    }
    const portal = TELEPORT_PORTALS.find(p => p.roomId === roomId);
    if (!portal) {
      this.sendTo(socketId, { type:'ERROR', message:'Invalid portal!' });
      return;
    }
    player.pos = { x: portal.x + (Math.random() - 0.5) * 20, y: portal.y + (Math.random() - 0.5) * 20 };
    player.skillCooldownLeft = player.skillCooldown;
    s.messages.push({ text: `Alaska teleported to ${roomId.replace('_', ' ')}!`, day: s.day, type:'info' });
    this.broadcastState();
  }

  buildFilteredState(socketId) {
    const s = this.state;
    if (!s) return {};

    const myPlayer = s.players.find(p => p.socketId === socketId);
    const myCharId = myPlayer ? myPlayer.charId : null;
    const myIsVillain = myPlayer ? myPlayer.isVillain : false;

    const players = s.players.map(p => {
      const isMe = p.charId === myCharId;
      const isDead = !p.alive;
      const isVillain = p.isVillain;

      // Reveal info only for: self, dead players, fellow villains (if I'm a villain)
      const reveal = isMe || isDead || (myIsVillain && isVillain);

      // Salt hiding: non-villains cannot see hiding state or even position (server omits from state)
      // Villains can see Salt's position even when hiding
      const saltHiding = p.charId === 'salt' && p.hiding;
      if (saltHiding && !myIsVillain && !isMe) {
        // Omit Salt entirely from state for non-villain clients
        return null;
      }

      return {
        charId: reveal ? p.charId : null,
        name: p.name,
        color: p.color,
        hat: p.hat,
        pos: p.pos,
        alive: p.alive,
        isVillain: isMe ? p.isVillain : undefined,
        hiding: isMe ? p.hiding : false,
        skillCooldownLeft: isMe ? p.skillCooldownLeft : undefined,
        scansReceived: isMe ? p.scansReceived : undefined,
        flowerSent: isMe ? p.flowerSent : undefined,
        sideChosen: isMe ? p.sideChosen : undefined,
      };
    }).filter(Boolean);

    return {
      day: s.day,
      phase: s.phase,
      players,
      tasks: s.tasks,
      bodies: s.bodies,
      reviewActive: s.reviewActive,
      reviewReason: s.reviewReason,
      voteTimeLeft: s.voteTimeLeft,
      votes: s.votes,
      messages: s.messages.slice(-30),
      lorieKilledToday: s.lorieKilledToday,
      electricityOn: s.electricityOn,
      dayTimer: s.dayTimer,
      winner: s.winner,
      lorieCharId: s.lorieCharId,
    };
  }

  broadcastState() {
    this.clients.forEach((client, socketId) => {
      if (client.ws.readyState === 1) { // OPEN
        const filtered = this.buildFilteredState(socketId);
        client.ws.send(JSON.stringify({ type:'GAME_STATE', ...filtered }));
      }
    });
  }

  broadcast(msg) {
    const data = JSON.stringify(msg);
    this.clients.forEach(client => {
      if (client.ws.readyState === 1) {
        client.ws.send(data);
      }
    });
  }

  sendTo(socketId, msg) {
    const client = this.clients.get(socketId);
    if (client && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(msg));
    }
  }

  isEmpty() {
    return this.clients.size === 0;
  }
}

module.exports = { GameRoom };
