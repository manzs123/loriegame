import { useEffect, useRef, useState, useCallback } from 'react';
import { CHARACTERS } from '../game/constants.js';
import { getRoomForPos, TASK_POSITIONS, CCTV_TERMINAL, ELECTRICAL_POST } from '../game/mapData.js';
import GameMap from './GameMap.jsx';
import SidePanel from './SidePanel.jsx';
import ReviewModal from './ReviewModal.jsx';
import CCTVModal from './CCTVModal.jsx';
import BroadcastModal from './BroadcastModal.jsx';
import KaiModal from './KaiModal.jsx';
import FlowerModal from './FlowerModal.jsx';
import SkillTargetModal from './SkillTargetModal.jsx';
import TeleportModal from './TeleportModal.jsx';
import GameOver from './GameOver.jsx';

const TASK_INTERACT_RADIUS = 60;
const BODY_INTERACT_RADIUS = 80;

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export default function Game({ myCharId, myIsVillain, gameState, send, onGameOver, onRegisterEventHandler, devMode = false }) {
  const keysRef = useRef({});
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const [skillTargetOpen, setSkillTargetOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [kaiOpen, setKaiOpen] = useState(false);
  const [flowerOpen, setFlowerOpen] = useState(false);
  const [teleportOpen, setTeleportOpen] = useState(false);
  const [flowerIsLorie, setFlowerIsLorie] = useState(false);
  const [flowerSender, setFlowerSender] = useState('');
  const [cctvOpen, setCctvOpen] = useState(false);
  const [cctvCanMsg, setCctvCanMsg] = useState(false);
  const [cctvData, setCctvData] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  const myCharDef = CHARACTERS.find(c => c.id === myCharId);

  const handleServerEvent = useCallback((msg) => {
    switch (msg.type) {
      case 'CCTV_DATA':
        setCctvData(msg);
        break;
      case 'SCAN_RESULT':
        setFeedback(msg.isLorie
          ? `CONFIRMED: ${msg.targetName} is LORIE!`
          : `${msg.targetName} is NOT Lorie.`
        );
        break;
      case 'CHAT_MSG':
        setChatMessages(prev => [...prev.slice(-99), msg]);
        break;
      case 'BROADCAST':
        setChatMessages(prev => [...prev.slice(-99), {
          senderName: '*** BROADCAST ***',
          text: msg.text,
          day: msg.day,
          isDead: false,
        }]);
        setFeedback(`BROADCAST: ${msg.text}`);
        break;
      case 'FLOWER_PROMPT':
        setFlowerIsLorie(true);
        setFlowerSender(msg.senderName || 'Zero');
        setFlowerOpen(true);
        break;
      case 'ERROR':
        setFeedback(msg.message);
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (onRegisterEventHandler) onRegisterEventHandler(handleServerEvent);
  }, [onRegisterEventHandler, handleServerEvent]);

  // --- handlers use refs so the keyboard listener never holds a stale closure ---
  const interactRef = useRef(null);
  const skillRef = useRef(null);

  // handleInteract — always reads from stateRef so me is never stale
  function handleInteract() {
    const state = stateRef.current;
    if (!state) return;
    const me = state.players.find(p => p.charId === myCharId);
    if (!me || !me.alive) return;

    const nearBody = state.bodies
      ? state.bodies.find(b => dist(b.pos, me.pos) < BODY_INTERACT_RADIUS)
      : null;
    if (nearBody) {
      send({ type: 'REPORT_BODY', bodyId: nearBody.id });
      return;
    }

    if (!state.electricityOn && dist(me.pos, ELECTRICAL_POST) < 70) {
      send({ type: 'RESTORE_POWER' });
      return;
    }

    if (myCharId === 'lorie') {
      send({ type: 'KILL_NEARBY' });
      return;
    }

    if (dist(me.pos, CCTV_TERMINAL) < 60 && (myCharId === 'yuki' || myCharId === 'synth')) {
      skillRef.current?.();
    }
  }

  // handleUseSkill — same pattern
  function handleUseSkill() {
    const state = stateRef.current;
    if (!state) return;
    const me = state.players.find(p => p.charId === myCharId);
    if (!me || !me.alive) return;

    if (myCharId === 'kai') { setKaiOpen(true); return; }
    if (myCharId === 'ela') { setBroadcastOpen(true); return; }
    if (myCharId === 'yuki' || myCharId === 'synth') {
      setCctvCanMsg(myCharId === 'synth');
      setCctvOpen(true);
      send({ type: 'USE_SKILL' });
      return;
    }
    if (myCharId === 'josh') { setSkillTargetOpen(true); return; }
    if (myCharId === 'alaska') { setTeleportOpen(true); return; }
    send({ type: 'USE_SKILL' });
  }

  // Keep refs current every render
  interactRef.current = handleInteract;
  skillRef.current = handleUseSkill;

  // Keyboard listener — calls refs so it always runs the latest handler
  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key] = true;
      if (e.key === 'e' || e.key === 'E') interactRef.current?.();
      if (e.key === 'q' || e.key === 'Q') skillRef.current?.();
    };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Game loop — always sends INPUT so player stops when keys released
  useEffect(() => {
    const id = setInterval(() => {
      const keys = keysRef.current;
      let dx = 0, dy = 0;
      if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx = -1;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) dx =  1;
      if (keys['ArrowUp']    || keys['w'] || keys['W']) dy = -1;
      if (keys['ArrowDown']  || keys['s'] || keys['S']) dy =  1;
      send({ type: 'INPUT', dx, dy });
    }, 1000 / 30);
    return () => clearInterval(id);
  }, [send]);

  // Auto-clear feedback
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(''), 2500);
    return () => clearTimeout(t);
  }, [feedback]);

  const s = stateRef.current;
  const me = s ? s.players.find(p => p.charId === myCharId) : null;

  // Proximity checks for hints and button labels
  const nearBody = s && s.bodies && me
    ? s.bodies.find(b => dist(b.pos, me.pos) < BODY_INTERACT_RADIUS) : null;
  const nearElecPost = !!(me && s && !s.electricityOn && dist(me.pos, ELECTRICAL_POST) < 70);
  const nearTask = me && s && s.tasks
    ? s.tasks.find(t => {
        if (t.done) return false;
        const tpos = TASK_POSITIONS[t.room];
        return tpos && dist(me.pos, tpos) < TASK_INTERACT_RADIUS;
      })
    : null;
  const nearCCTV = !!(me && dist(me.pos, CCTV_TERMINAL) < 60 && (myCharId === 'yuki' || myCharId === 'synth'));
  const nearKillTarget = myCharId === 'lorie' && me && s && s.players
    ? s.players.some(p => p.alive && p.charId !== myCharId && dist(p.pos, me.pos) < 80)
    : false;

  // What E does right now
  const eLabel = nearBody     ? 'Report Body'
    : nearElecPost            ? 'Restore Power'
    : nearKillTarget          ? 'Kill'
    : nearCCTV                ? 'Use CCTV'
    : nearTask                ? `Working… ${Math.ceil((900 - (nearTask.progress || 0)) / 30)}s`
    : 'Interact';

  const eActive = !!(nearBody || nearElecPost || nearKillTarget || nearCCTV || nearTask);
  const skillLabel = myCharDef?.skillName || 'Skill';
  const skillCooldown = me?.skillCooldownLeft ?? 0;

  function handleSkillTarget(targetId) {
    setSkillTargetOpen(false);
    send({ type: 'USE_SKILL', extra: targetId });
  }
  function handleTeleport(roomId) {
    setTeleportOpen(false);
    send({ type: 'TELEPORT_TO', roomId });
  }
  function handleVote(targetId) { send({ type: 'CAST_VOTE', targetId }); }
  function handleChat(text)     { send({ type: 'CHAT', text }); }
  function handleBroadcast(text){ setBroadcastOpen(false); send({ type: 'BROADCAST_MSG', text }); }
  function handleKaiChoose(side){ setKaiOpen(false); send({ type: 'KAI_CHOOSE', side }); }
  function handleFlowerRespond(accept){ setFlowerOpen(false); send({ type: 'FLOWER_RESPOND', accept }); }
  function handleCCTVView(roomId){ send({ type: 'CCTV_VIEW', roomId }); }
  function handleCCTVBroadcast(text){ setCctvOpen(false); send({ type: 'BROADCAST_MSG', text }); }

  if (s && s.winner) {
    return (
      <GameOver
        winner={s.winner}
        myCharId={myCharId}
        myIsVillain={myIsVillain}
        lorieCharId={s.lorieCharId}
        onRestart={onGameOver}
      />
    );
  }

  return (
    <div className="game-layout">
      <div className="game-canvas-wrap">
        <GameMap state={s} myCharId={myCharId} devMode={devMode} />

        {/* Proximity hint */}
        {me && me.alive && !s?.reviewActive && !s?.winner && eActive && nearTask && (
          <div className="interact-hint">
            WORKING… {Math.ceil((900 - (nearTask.progress || 0)) / 30)}s left
          </div>
        )}

        {feedback && (
          <div key={feedback} className="skill-feedback">{feedback}</div>
        )}

        {/* Bottom action bar */}
        {me && me.alive && !s?.reviewActive && !s?.winner && (
          <div style={{
            position: 'absolute',
            bottom: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 12,
            zIndex: 30,
          }}>
            {/* E — Interact */}
            <button
              onClick={handleInteract}
              style={{
                fontFamily: 'var(--pixel)',
                fontSize: 8,
                padding: '10px 18px',
                background: eActive ? '#0d1f0d' : '#0a0a0f',
                border: `2px solid ${eActive ? '#2ecc71' : '#1e3a5f'}`,
                color: eActive ? '#2ecc71' : '#3d5a3d',
                cursor: eActive ? 'pointer' : 'default',
                letterSpacing: 1,
                minWidth: 140,
                transition: 'all 0.1s',
                boxShadow: eActive ? '0 0 10px #2ecc7144' : 'none',
              }}
            >
              <span style={{ opacity: 0.6, fontSize: 7 }}>[ E ]  </span>{eLabel}
            </button>

            {/* Q — Skill */}
            <button
              onClick={handleUseSkill}
              style={{
                fontFamily: 'var(--pixel)',
                fontSize: 8,
                padding: '10px 18px',
                background: skillCooldown > 0 ? '#0a0a0f' : '#0d0a1f',
                border: `2px solid ${skillCooldown > 0 ? '#2a1a5f' : '#9b59b6'}`,
                color: skillCooldown > 0 ? '#3d3060' : '#9b59b6',
                cursor: skillCooldown > 0 ? 'default' : 'pointer',
                letterSpacing: 1,
                minWidth: 140,
                transition: 'all 0.1s',
                boxShadow: skillCooldown > 0 ? 'none' : '0 0 10px #9b59b644',
              }}
            >
              <span style={{ opacity: 0.6, fontSize: 7 }}>[ Q ]  </span>
              {skillCooldown > 0 ? `${skillLabel} (${skillCooldown}d)` : skillLabel}
            </button>
          </div>
        )}
      </div>

      <SidePanel
        state={s}
        myCharId={myCharId}
        myCharDef={myCharDef}
        onUseSkill={handleUseSkill}
        onInteract={handleInteract}
        onChat={handleChat}
        chatMessages={chatMessages}
      />

      {s?.reviewActive && (
        <ReviewModal state={s} myCharId={myCharId} onVote={handleVote} />
      )}

      {cctvOpen && (
        <CCTVModal
          cctvData={cctvData}
          canMessage={cctvCanMsg}
          onViewRoom={handleCCTVView}
          onSendBroadcast={handleCCTVBroadcast}
          onClose={() => { setCctvOpen(false); setCctvData(null); }}
        />
      )}

      {broadcastOpen && (
        <BroadcastModal onSend={handleBroadcast} onClose={() => setBroadcastOpen(false)} />
      )}

      {kaiOpen && <KaiModal onChoose={handleKaiChoose} />}

      {flowerOpen && (
        <FlowerModal
          isLoriePlayer={flowerIsLorie}
          senderName={flowerSender}
          onRespond={handleFlowerRespond}
        />
      )}

      {skillTargetOpen && (
        <SkillTargetModal
          state={s}
          myCharId={myCharId}
          skill={myCharDef?.skill}
          onSelect={handleSkillTarget}
          onClose={() => setSkillTargetOpen(false)}
        />
      )}

      {teleportOpen && (
        <TeleportModal
          onTeleport={handleTeleport}
          onClose={() => setTeleportOpen(false)}
        />
      )}
    </div>
  );
}
