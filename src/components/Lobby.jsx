import { useState } from 'react';

export default function Lobby({ onCreateRoom, onJoinRoom, onDevMode, lobbyState, isLocalHost, onStartGame, connected, status, error }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');

  function handleCreate() {
    if (!name.trim()) { setLocalError('Enter your name first'); return; }
    if (!connected) { setLocalError('Not connected to server — retrying...'); return; }
    setLocalError('');
    onCreateRoom(name.trim());
  }

  function handleJoin() {
    if (!name.trim()) { setLocalError('Enter your name first'); return; }
    if (!code.trim()) { setLocalError('Enter a room code'); return; }
    if (!connected) { setLocalError('Not connected to server — retrying...'); return; }
    setLocalError('');
    onJoinRoom(name.trim(), code.trim().toUpperCase());
  }

  const inRoom = !!lobbyState;
  const displayError = error || localError;

  const statusColor = status === 'open' ? '#2ecc71' : status === 'error' ? '#e74c3c' : '#f39c12';
  const statusText = status === 'open' ? 'Connected' : status === 'error' ? 'Reconnecting...' : 'Connecting...';

  return (
    <div className="menu">
      <div className="menu-title">LORIE IS WITH US</div>
      <div className="menu-subtitle">multiplayer social deduction</div>

      {/* Connection status dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 7 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
        <span style={{ color: statusColor }}>{statusText}</span>
        {status !== 'open' && (
          <span style={{ color: '#555', fontSize: 6 }}>— make sure the server is running: <code style={{ color: '#7f8c8d' }}>npm run dev</code></span>
        )}
      </div>

      {displayError && (
        <div style={{ color: '#e74c3c', fontSize: 7, border: '1px solid #e74c3c', padding: '8px 16px', maxWidth: 320, textAlign: 'center' }}>
          {displayError}
        </div>
      )}

      {!inRoom && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 7, color: '#7f8c8d' }}>YOUR NAME</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setLocalError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              maxLength={20}
              placeholder="Enter your name..."
              autoFocus
              style={{
                fontFamily: 'var(--pixel)',
                fontSize: 8,
                background: '#0a0a0f',
                border: '1px solid #1e3a5f',
                color: '#ecf0f1',
                padding: '8px',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          <button className="btn" onClick={handleCreate}>
            CREATE ROOM
          </button>

          <div style={{ textAlign: 'center', fontSize: 6, color: '#555' }}>─── OR ───</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 7, color: '#7f8c8d' }}>ROOM CODE</label>
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setLocalError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={6}
              placeholder="ABC123"
              style={{
                fontFamily: 'var(--pixel)',
                fontSize: 10,
                background: '#0a0a0f',
                border: '1px solid #1e3a5f',
                color: '#f39c12',
                padding: '8px',
                outline: 'none',
                width: '100%',
                textTransform: 'uppercase',
                letterSpacing: '6px',
                textAlign: 'center',
              }}
            />
          </div>

          <button className="btn btn-blue" onClick={handleJoin}>
            JOIN ROOM
          </button>

          <div style={{ textAlign: 'center', fontSize: 6, color: '#555' }}>─── OR ───</div>

          <button
            style={{
              fontFamily: 'var(--pixel)',
              fontSize: 7,
              padding: '10px 18px',
              background: '#0a0f0a',
              border: '2px solid #2ecc71',
              color: '#2ecc71',
              cursor: 'pointer',
              letterSpacing: 1,
              width: '100%',
            }}
            onClick={() => {
              if (!connected) { setLocalError('Not connected to server — retrying...'); return; }
              setLocalError('');
              onDevMode(name.trim() || 'Dev');
            }}
          >
            ⚙ DEV MODE
          </button>
        </div>
      )}

      {inRoom && lobbyState && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320, alignItems: 'center' }}>
          <div style={{ border: '2px solid #f39c12', padding: '12px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 6, color: '#7f8c8d', marginBottom: 6 }}>ROOM CODE — share with friends</div>
            <div style={{ fontSize: 24, color: '#f39c12', letterSpacing: '8px', fontWeight: 'bold' }}>
              {lobbyState.roomCode}
            </div>
          </div>

          <div style={{ border: '1px solid #1e3a5f', padding: 12, width: '100%' }}>
            <div style={{ fontSize: 7, color: '#7f8c8d', marginBottom: 8 }}>
              PLAYERS ({lobbyState.players.length}/10)
            </div>
            {lobbyState.players.map(p => (
              <div key={p.id} style={{ fontSize: 7, color: '#ecf0f1', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: p.isHost ? '#f39c12' : '#3498db' }}>{p.isHost ? '★' : '·'}</span>
                <span>{p.name}</span>
                {p.isHost && <span style={{ fontSize: 5, color: '#f39c12' }}>(host)</span>}
              </div>
            ))}
          </div>

          {isLocalHost ? (
            <button className="btn btn-green" onClick={onStartGame} style={{ width: '100%', fontSize: 9, padding: '14px' }}>
              ▶ START GAME
            </button>
          ) : (
            <div style={{ fontSize: 7, color: '#7f8c8d', textAlign: 'center' }}>
              Waiting for host to start...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
