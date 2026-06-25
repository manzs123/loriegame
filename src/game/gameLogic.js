import { CHARACTERS } from './constants.js';
import { ROOMS, TASKS, MAP_W, MAP_H } from './mapData.js';

const roomPx = r => r;

function randomPos(room) {
  const p = roomPx(room);
  return {
    x: p.x + 20 + Math.floor(Math.random() * (p.w - 40)),
    y: p.y + 20 + Math.floor(Math.random() * (p.h - 40)),
  };
}

function getRoomForPos(pos) {
  return ROOMS.find((r) => {
    const p = roomPx(r);
    return pos.x >= p.x && pos.x <= p.x + p.w && pos.y >= p.y && pos.y <= p.y + p.h;
  });
}

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function buildInitialState(playerCharId) {
  const players = CHARACTERS.map((ch, i) => {
    const room = ROOMS[i % ROOMS.length];
    const pos = randomPos(room);
    return {
      ...ch,
      pos,
      alive: true,
      isPlayer: ch.id === playerCharId,
      scansReceived: {},     // { scannerId: count }
      skillCooldownLeft: 0,
      hiding: false,
      sideChosen: ch.id === 'kai' ? null : undefined,
      isVillain: ch.id === 'lorie',
      flowerSent: false,
      flowerAccepted: false,
      aiTarget: null,
      aiTaskTarget: null,
      scanTargetId: null,
    };
  });

  const tasks = TASKS.map((t) => ({ ...t, progress: 0, done: false }));

  return {
    phase: 'playing',
    day: 1,
    players,
    tasks,
    bodies: [],          // { id, pos, killedName, day }
    messages: [],        // { text, day, type }
    reviewPending: false,
    reviewReason: '',
    votes: {},           // { voterId: targetId }
    votingPhase: false,
    cctv: false,
    cctvSource: null,
    kaiSidePrompt: players.find((p) => p.id === 'kai' && p.isPlayer) ? true : false,
    winner: null,        // 'crewmates' | 'lorie'
    ejected: null,
    dayTimer: 0,
    lorieKilledToday: false,
    saltKilledToday: false,
    scanLog: [],         // { scannerId, targetId, result }
    flowerPrompt: false,
    broadcastPrompt: false,
    cctvRooms: null,
    playerCharId,
    skillFeedback: '',
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'MOVE_PLAYER': return movePlayer(state, action.dx, action.dy);
    case 'TICK': return tick(state);
    case 'REPORT_BODY': return reportBody(state, action.bodyId);
    case 'CAST_VOTE': return castVote(state, action.voterId, action.targetId);
    case 'FINALIZE_VOTE': return finalizeVote(state);
    case 'USE_SKILL': return useSkill(state, action.playerId, action.extra);
    case 'CLOSE_CCTV': return { ...state, cctv: false, cctvRooms: null };
    case 'BROADCAST_SEND': return broadcastSend(state, action.text);
    case 'KAI_CHOOSE': return kaiChoose(state, action.side);
    case 'FLOWER_RESPOND': return flowerRespond(state, action.accept);
    case 'DISMISS_FEEDBACK': return { ...state, skillFeedback: '' };
    case 'DO_TASK': return doTask(state, action.taskId, action.playerId);
    default: return state;
  }
}

function movePlayer(state, dx, dy) {
  const SPEED = 4;
  const SIZE = 14;
  const players = state.players.map((p) => {
    if (!p.isPlayer || !p.alive) return p;
    let nx = p.pos.x + dx * SPEED;
    let ny = p.pos.y + dy * SPEED;
    nx = Math.max(SIZE, Math.min(MAP_W - SIZE, nx));
    ny = Math.max(SIZE, Math.min(MAP_H - SIZE, ny));

    // Salt: un-hide if moves out of dark room
    let hiding = p.hiding;
    if (p.id === 'salt' && hiding) {
      const room = getRoomForPos({ x: nx, y: ny });
      if (!room || room.id !== 'dark_room') hiding = false;
    }

    return { ...p, pos: { x: nx, y: ny }, hiding };
  });
  return { ...state, players };
}

function tick(state) {
  if (state.votingPhase || state.winner || state.flowerPrompt || state.kaiSidePrompt || state.broadcastPrompt) return state;

  let s = { ...state, dayTimer: state.dayTimer + 1 };

  // AI movement
  s = aiMove(s);

  // Lorie kill logic (AI Lorie)
  const loriePlayer = s.players.find((p) => p.id === 'lorie' && p.alive && !p.isPlayer);
  if (loriePlayer && !s.lorieKilledToday && s.dayTimer % 180 === 90) {
    s = lorieAIKill(s);
  }

  // Kai AI: choose side at start
  const kaiAI = s.players.find((p) => p.id === 'kai' && !p.isPlayer && p.sideChosen === null);
  if (kaiAI) {
    const side = Math.random() < 0.4 ? 'lorie' : 'crew';
    s = {
      ...s,
      players: s.players.map((p) =>
        p.id === 'kai' ? { ...p, sideChosen: side, isVillain: side === 'lorie' } : p
      ),
      messages: [...s.messages, { text: `Kai has chosen a side...`, day: s.day, type: 'info' }],
    };
  }

  // Day change every 600 ticks
  if (s.dayTimer % 600 === 0 && s.dayTimer > 0) {
    s = nextDay(s);
  }

  return s;
}

function aiMove(state) {
  const SPEED = 1.5;
  const players = state.players.map((p) => {
    if (p.isPlayer || !p.alive || p.hiding) return p;

    let target = p.aiTarget;

    // Pick a random room target occasionally
    if (!target || dist(p.pos, target) < 10 || Math.random() < 0.005) {
      const room = ROOMS[Math.floor(Math.random() * ROOMS.length)];
      const rp = roomPx(room);
      target = {
        x: rp.x + 10 + Math.random() * (rp.w - 20),
        y: rp.y + 10 + Math.random() * (rp.h - 20),
      };
    }

    const dx = target.x - p.pos.x;
    const dy = target.y - p.pos.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = Math.max(6, Math.min(MAP_W - 6, p.pos.x + (dx / d) * SPEED));
    const ny = Math.max(6, Math.min(MAP_H - 6, p.pos.y + (dy / d) * SPEED));

    return { ...p, pos: { x: nx, y: ny }, aiTarget: target };
  });
  return { ...state, players };
}

function lorieAIKill(state) {
  const lorie = state.players.find((p) => p.id === 'lorie' && p.alive);
  if (!lorie) return state;

  const targets = state.players.filter(
    (p) => p.alive && !p.isVillain && !p.isPlayer && dist(p.pos, lorie.pos) < 120
  );
  if (targets.length === 0) return state;

  const victim = targets[Math.floor(Math.random() * targets.length)];

  // Salt in dark room: only killed if Lorie is also in dark room
  if (victim.id === 'salt' && victim.hiding) {
    const lorieRoom = getRoomForPos(lorie.pos);
    if (!lorieRoom || lorieRoom.id !== 'dark_room') return state;
  }

  const body = { id: victim.id, pos: { ...victim.pos }, killedName: victim.name, day: state.day };
  return {
    ...state,
    players: state.players.map((p) => (p.id === victim.id ? { ...p, alive: false } : p)),
    bodies: [...state.bodies, body],
    lorieKilledToday: true,
    saltKilledToday: victim.id === 'salt',
    messages: [
      ...state.messages,
      { text: `💀 Someone has been eliminated...`, day: state.day, type: 'danger' },
    ],
  };
}

function nextDay(state) {
  let s = {
    ...state,
    day: state.day + 1,
    lorieKilledToday: false,
    saltKilledToday: false,
    players: state.players.map((p) => ({
      ...p,
      skillCooldownLeft: Math.max(0, p.skillCooldownLeft - 1),
      scanTargetId: null,
    })),
    messages: [...state.messages, { text: `☀️ Day ${state.day + 1} begins`, day: state.day + 1, type: 'info' }],
  };
  return checkWinConditions(s);
}

function reportBody(state, bodyId) {
  if (state.votingPhase) return state;
  return {
    ...state,
    votingPhase: true,
    reviewReason: `A body was found!`,
    votes: {},
    messages: [...state.messages, { text: '🚨 Body reported! Emergency review called!', day: state.day, type: 'danger' }],
  };
}

function castVote(state, voterId, targetId) {
  let votes = { ...state.votes, [voterId]: targetId };

  // Simulate AI votes immediately
  const alivePlayers = state.players.filter((p) => p.alive);
  alivePlayers.forEach((p) => {
    if (p.isPlayer || votes[p.id]) return;
    // AI voting logic
    const aiTarget = aiPickVote(state, p);
    votes[p.id] = aiTarget;
  });

  return { ...state, votes };
}

function aiPickVote(state, voter) {
  const alivePlayers = state.players.filter((p) => p.alive);
  const candidates = alivePlayers.filter((p) => p.id !== voter.id);

  // Villains try to vote off crewmates (randomly among non-villains)
  if (voter.isVillain) {
    const crewTargets = candidates.filter((p) => !p.isVillain);
    if (crewTargets.length > 0) return crewTargets[Math.floor(Math.random() * crewTargets.length)].id;
  }

  // Crewmates vote randomly with slight bias to skip if uncertain
  if (Math.random() < 0.25) return 'skip';
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

function finalizeVote(state) {
  // Count votes
  const counts = {};
  Object.values(state.votes).forEach((id) => {
    counts[id] = (counts[id] || 0) + 1;
  });

  let maxVotes = 0;
  let ejected = null;
  for (const [id, count] of Object.entries(counts)) {
    if (count > maxVotes) { maxVotes = count; ejected = id; }
  }

  // Tie = no ejection
  const tied = Object.values(counts).filter((c) => c === maxVotes).length > 1;
  if (tied) ejected = null;

  let s = {
    ...state,
    votingPhase: false,
    bodies: [],
    ejected,
    lorieKilledToday: false,
  };

  if (ejected) {
    const ejectedPlayer = state.players.find((p) => p.id === ejected);
    s = {
      ...s,
      players: state.players.map((p) => (p.id === ejected ? { ...p, alive: false } : p)),
      messages: [
        ...state.messages,
        {
          text: ejectedPlayer?.isVillain
            ? `✅ ${ejectedPlayer.name} was ejected. They were Lorie!`
            : `❌ ${ejectedPlayer?.name} was ejected. They were innocent.`,
          day: state.day,
          type: ejectedPlayer?.isVillain ? 'success' : 'danger',
        },
      ],
    };
  } else {
    s = {
      ...s,
      messages: [...state.messages, { text: 'No majority. No one was ejected.', day: state.day, type: 'info' }],
    };
  }

  return checkWinConditions(s);
}

function checkWinConditions(state) {
  const alivePlayers = state.players.filter((p) => p.alive);
  const aliveVillains = alivePlayers.filter((p) => p.isVillain);
  const aliveCrew = alivePlayers.filter((p) => !p.isVillain);

  // Crewmates win: all villains eliminated OR all tasks done
  if (aliveVillains.length === 0) {
    return { ...state, winner: 'crewmates', phase: 'gameover' };
  }

  const allTasksDone = state.tasks.every((t) => t.done);
  if (allTasksDone) {
    return { ...state, winner: 'crewmates', phase: 'gameover' };
  }

  // Lorie wins: equal or more villains than crewmates
  if (aliveVillains.length >= aliveCrew.length) {
    return { ...state, winner: 'lorie', phase: 'gameover' };
  }

  return state;
}

function useSkill(state, playerId, extra) {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.alive) return state;
  if (player.skillCooldownLeft > 0) {
    return { ...state, skillFeedback: `Skill on cooldown (${player.skillCooldownLeft} days)` };
  }

  switch (player.skill) {
    case 'KILL': return skillKill(state, player, extra);
    case 'INSTANT_REVIEW': return skillInstantReview(state, player);
    case 'SCAN': return skillScan(state, player, extra);
    case 'FAST_TASK': return skillFastTask(state, player);
    case 'CHOOSE_SIDE': return { ...state, kaiSidePrompt: true };
    case 'CCTV': return skillCCTV(state, player, false);
    case 'CCTV_MSG': return skillCCTV(state, player, true);
    case 'FLOWER': return skillFlower(state, player);
    case 'HIDE': return skillHide(state, player);
    case 'BROADCAST': return { ...state, broadcastPrompt: true };
    default: return state;
  }
}

function skillKill(state, lorie, targetId) {
  if (state.lorieKilledToday && !state.saltKilledToday) {
    return { ...state, skillFeedback: 'Already killed today!' };
  }

  const target = targetId
    ? state.players.find((p) => p.id === targetId && p.alive && !p.isVillain)
    : state.players.find(
        (p) => p.alive && !p.isVillain && dist(p.pos, lorie.pos) < 80
      );

  if (!target) return { ...state, skillFeedback: 'No target nearby!' };

  // Salt hiding in dark room — special kill
  if (target.id === 'salt' && target.hiding) {
    const lorieRoom = getRoomForPos(lorie.pos);
    if (!lorieRoom || lorieRoom.id !== 'dark_room') {
      return { ...state, skillFeedback: 'Salt is hiding — enter the Dark Room!' };
    }
  }

  const body = { id: target.id, pos: { ...target.pos }, killedName: target.name, day: state.day };
  const isSalt = target.id === 'salt';

  return {
    ...state,
    players: state.players.map((p) => {
      if (p.id === target.id) return { ...p, alive: false };
      if (p.id === lorie.id) return { ...p, skillCooldownLeft: p.skillCooldown };
      return p;
    }),
    bodies: [...state.bodies, body],
    lorieKilledToday: !isSalt,
    saltKilledToday: isSalt,
    messages: [...state.messages, { text: `💀 ${target.name} has been eliminated!`, day: state.day, type: 'danger' }],
    skillFeedback: `Eliminated ${target.name}`,
  };
}

function skillInstantReview(state, player) {
  return {
    ...state,
    votingPhase: true,
    reviewReason: `${player.name} called an emergency review!`,
    votes: {},
    players: state.players.map((p) => (p.id === player.id ? { ...p, skillCooldownLeft: p.skillCooldown } : p)),
    messages: [...state.messages, { text: `🚨 ${player.name} called an emergency review!`, day: state.day, type: 'warning' }],
    skillFeedback: 'Emergency review called!',
  };
}

function skillScan(state, player, targetId) {
  const target = targetId
    ? state.players.find((p) => p.id === targetId && p.alive)
    : state.players.find((p) => p.alive && p.id !== player.id && dist(p.pos, player.pos) < 90);

  if (!target) return { ...state, skillFeedback: 'No player nearby to scan!' };

  const currentScans = (target.scansReceived[player.id] || 0) + 1;
  const newTarget = {
    ...target,
    scansReceived: { ...target.scansReceived, [player.id]: currentScans },
  };

  let feedback = `Scanned ${target.name} (${currentScans}/3)`;
  let msg = { text: `🔍 Josh scanned ${target.name} (${currentScans}/3)`, day: state.day, type: 'info' };

  if (currentScans >= 3) {
    const isVillain = target.isVillain;
    feedback = isVillain
      ? `⚠️ CONFIRMED: ${target.name} is LORIE!`
      : `✅ ${target.name} is NOT Lorie.`;
    msg = { text: feedback, day: state.day, type: isVillain ? 'danger' : 'success' };
  }

  return {
    ...state,
    players: state.players.map((p) => {
      if (p.id === target.id) return newTarget;
      if (p.id === player.id) return { ...p, skillCooldownLeft: p.skillCooldown };
      return p;
    }),
    messages: [...state.messages, msg],
    skillFeedback: feedback,
  };
}

function skillFastTask(state, player) {
  const playerRoom = getRoomForPos(player.pos);
  if (!playerRoom) return { ...state, skillFeedback: 'Not in a room with a task!' };

  const taskIdx = state.tasks.findIndex((t) => t.room === playerRoom.id && !t.done);
  if (taskIdx === -1) return { ...state, skillFeedback: 'No task here!' };

  const tasks = state.tasks.map((t, i) =>
    i === taskIdx ? { ...t, progress: Math.min(t.steps, t.progress + Math.ceil(t.steps / 2)), done: t.progress + Math.ceil(t.steps / 2) >= t.steps } : t
  );

  return {
    ...state,
    tasks,
    players: state.players.map((p) => (p.id === player.id ? { ...p, skillCooldownLeft: p.skillCooldown } : p)),
    messages: [...state.messages, { text: `⚡ Ysa speed-boosted a task!`, day: state.day, type: 'success' }],
    skillFeedback: 'Task progressed faster!',
  };
}

function skillCCTV(state, player, canMessage) {
  const cctvRooms = ROOMS.map((r) => {
    const playersHere = state.players.filter((p) => {
      const rp = roomPx(r);
      return p.alive && p.pos.x >= rp.x && p.pos.x <= rp.x + rp.w && p.pos.y >= rp.y && p.pos.y <= rp.y + rp.h;
    });
    return { ...r, occupants: playersHere.map((p) => p.name) };
  });

  return {
    ...state,
    cctv: true,
    cctvRooms,
    broadcastPrompt: canMessage,
    players: state.players.map((p) => (p.id === player.id ? { ...p, skillCooldownLeft: p.skillCooldown } : p)),
    skillFeedback: canMessage ? 'CCTV active — type a message!' : 'Viewing CCTV...',
  };
}

function skillFlower(state, player) {
  if (player.flowerSent) return { ...state, skillFeedback: 'Already sent a flower!' };

  return {
    ...state,
    flowerPrompt: true,
    players: state.players.map((p) => (p.id === player.id ? { ...p, flowerSent: true, skillCooldownLeft: p.skillCooldown } : p)),
    messages: [...state.messages, { text: `🌸 Zero sent a flower to Lorie...`, day: state.day, type: 'info' }],
    skillFeedback: 'Flower sent! Waiting for response...',
  };
}

function skillHide(state, player) {
  const room = getRoomForPos(player.pos);
  if (!room || room.id !== 'dark_room') {
    return { ...state, skillFeedback: 'Go to the Dark Room to hide!' };
  }

  return {
    ...state,
    players: state.players.map((p) =>
      p.id === player.id ? { ...p, hiding: true, skillCooldownLeft: p.skillCooldown } : p
    ),
    messages: [...state.messages, { text: `🌑 Salt hides in the darkness...`, day: state.day, type: 'info' }],
    skillFeedback: 'Hiding in the dark...',
  };
}

function broadcastSend(state, text) {
  return {
    ...state,
    broadcastPrompt: false,
    cctv: false,
    cctvRooms: null,
    messages: [...state.messages, { text: `📢 ${text}`, day: state.day, type: 'broadcast' }],
  };
}

function kaiChoose(state, side) {
  return {
    ...state,
    kaiSidePrompt: false,
    players: state.players.map((p) =>
      p.id === 'kai' ? { ...p, sideChosen: side, isVillain: side === 'lorie', skillCooldownLeft: p.skillCooldown } : p
    ),
    messages: [
      ...state.messages,
      { text: `🎭 Kai has chosen to side with ${side === 'lorie' ? 'Lorie' : 'the crewmates'}`, day: state.day, type: 'warning' },
    ],
  };
}

// function alaskaPunch(state, side) {
//   return {
//     ...state,
//     kaiSidePrompt: false,
//     players: state.players.map((p) =>
//       p.id === 'alaska' ? { ...p, sideChosen: side, isVillain: side === 'lorie', skillCooldownLeft: p.skillCooldown } : p
//     ),
//     messages: [
//       ...state.messages,
//       { text: `🎭 Alaska has punched to side with ${side === 'lorie' ? 'Lorie' : 'the crewmates'}`, day: state.day, type: 'warning' },
//     ],
//   };
// }

function flowerRespond(state, accept) {
  const loriePlayer = state.players.find((p) => p.id === 'lorie');
  const zeroPlayer = state.players.find((p) => p.id === 'zero');

  let s = {
    ...state,
    flowerPrompt: false,
    players: state.players.map((p) => {
      if (p.id === 'zero') return { ...p, flowerAccepted: accept, isVillain: accept };
      return p;
    }),
    messages: [
      ...state.messages,
      {
        text: accept
          ? `💘 Lorie accepted Zero's flower! Zero has joined the villains!`
          : `💔 Lorie rejected Zero's flower. Zero remains a crewmate.`,
        day: state.day,
        type: accept ? 'danger' : 'info',
      },
    ],
  };

  return checkWinConditions(s);
}

export function doTask(state, taskId, playerId) {
  const player = state.players.find((p) => p.id === playerId && p.alive);
  if (!player) return state;

  const taskIdx = state.tasks.findIndex((t) => t.id === taskId && !t.done);
  if (taskIdx === -1) return state;

  const task = state.tasks[taskIdx];
  const taskRoom = ROOMS.find((r) => r.id === task.room);
  const playerRoom = getRoomForPos(player.pos);

  if (!playerRoom || playerRoom.id !== taskRoom.id) {
    return { ...state, skillFeedback: `Go to ${taskRoom.name} for this task!` };
  }

  const newProgress = task.progress + 1;
  const done = newProgress >= task.steps;
  const tasks = state.tasks.map((t, i) =>
    i === taskIdx ? { ...t, progress: newProgress, done } : t
  );

  let s = {
    ...state,
    tasks,
    messages: done
      ? [...state.messages, { text: `✅ Task "${task.name}" completed!`, day: state.day, type: 'success' }]
      : state.messages,
    skillFeedback: done ? `Task "${task.name}" complete!` : `Task progress: ${newProgress}/${task.steps}`,
  };

  return checkWinConditions(s);
}
