import { useState, useCallback, useRef, useEffect } from 'react';
import { useSocket } from './hooks/useSocket.js';
import Lobby from './components/Lobby.jsx';
import Game from './components/Game.jsx';

function RotateOverlay() {
  const MQ = '(orientation: portrait) and (max-width: 1366px) and (pointer: coarse)';
  const [portrait, setPortrait] = useState(() => window.matchMedia(MQ).matches);

  useEffect(() => {
    const mq = window.matchMedia(MQ);
    const handler = e => setPortrait(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Attempt hardware lock (only works in fullscreen/PWA)
  useEffect(() => {
    try { screen.orientation?.lock('landscape').catch(() => {}); } catch (_) {}
  }, []);

  if (!portrait) return null;
  return (
    <div className="rotate-overlay">
      <div className="rotate-content">
        <div className="rotate-icon">↻</div>
        <div className="rotate-text">ROTATE YOUR DEVICE</div>
        <div className="rotate-sub">This game requires landscape mode</div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('lobby'); // lobby | game
  const [lobbyState, setLobbyState] = useState(null); // { roomCode, players }
  const [isLocalHost, setIsLocalHost] = useState(false); // client-side tracking id
  const [myCharId, setMyCharId] = useState(null);
  const [myIsVillain, setMyIsVillain] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');
  const [isDevMode, setIsDevMode] = useState(false);

  const gameRef = useRef(null);
  const devAutoStartRef = useRef(false);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'LOBBY_STATE':
        setLobbyState({ roomCode: msg.roomCode, players: msg.players });
        setError('');
        if (devAutoStartRef.current) {
          devAutoStartRef.current = false;
          send({ type: 'START_GAME' });
        }
        break;

      case 'GAME_START':
        setMyCharId(msg.yourCharId);
        setMyIsVillain(msg.yourIsVillain);
        setScreen('game');
        break;

      case 'GAME_STATE':
        setGameState(msg);
        break;

      case 'GAME_OVER':
        setGameState(prev => prev ? { ...prev, winner: msg.winner, lorieCharId: msg.lorieCharId } : prev);
        break;

      case 'DEV_CHAR_CHANGED':
        setMyCharId(msg.yourCharId);
        setMyIsVillain(msg.yourIsVillain);
        break;

      case 'ERROR':
        setError(msg.message);
        if (gameRef.current) gameRef.current(msg);
        break;

      case 'CCTV_DATA':
      case 'SCAN_RESULT':
      case 'CHAT_MSG':
      case 'BROADCAST':
      case 'FLOWER_PROMPT':
        if (gameRef.current) gameRef.current(msg);
        break;

      default:
        break;
    }
  }, []);

  const { send, connected, status } = useSocket(handleMessage);

  function handleCreateRoom(name) {
    setError('');
    setIsLocalHost(true);
    send({ type: 'CREATE_ROOM', name });
  }

  function handleJoinRoom(name, code) {
    setError('');
    setIsLocalHost(false);
    send({ type: 'JOIN_ROOM', name, code });
  }

  function handleStartGame() {
    send({ type: 'START_GAME' });
  }

  function handleDevMode(name) {
    setIsDevMode(true);
    setIsLocalHost(true);
    devAutoStartRef.current = true;
    send({ type: 'CREATE_ROOM', name });
  }

  function handleGameOver() {
    setScreen('lobby');
    setGameState(null);
    setMyCharId(null);
    setMyIsVillain(false);
    setIsLocalHost(false);
    setLobbyState(null);
    setIsDevMode(false);
    devAutoStartRef.current = false;
  }

  // Pass a ref-setter so Game can register its event handler
  function setGameEventHandler(handler) {
    gameRef.current = handler;
  }

  return (
    <>
      <RotateOverlay />
      {screen === 'lobby' && (
        <Lobby
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onDevMode={handleDevMode}
          lobbyState={lobbyState}
          isLocalHost={isLocalHost}
          onStartGame={handleStartGame}
          connected={connected}
          status={status}
          error={error}
        />
      )}

      {screen === 'game' && myCharId && (
        <GameWithHandler
          myCharId={myCharId}
          myIsVillain={myIsVillain}
          gameState={gameState}
          send={send}
          onGameOver={handleGameOver}
          setEventHandler={setGameEventHandler}
          devMode={isDevMode}
        />
      )}
    </>
  );
}

// Wrapper so we can get the event handler from Game
function GameWithHandler({ myCharId, myIsVillain, gameState, send, onGameOver, setEventHandler, devMode }) {
  const handlerRef = useRef(null);

  // Register with parent
  setEventHandler((msg) => {
    if (handlerRef.current) handlerRef.current(msg);
  });

  return (
    <Game
      myCharId={myCharId}
      myIsVillain={myIsVillain}
      gameState={gameState}
      send={send}
      onGameOver={onGameOver}
      onRegisterEventHandler={(fn) => { handlerRef.current = fn; }}
      devMode={devMode}
    />
  );
}
