import { useState, useEffect } from 'react';
import { ROOMS } from '../game/mapData.js';

export default function CCTVModal({ cctvData, canMessage, onViewRoom, onSendBroadcast, onClose }) {
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0].id);
  const [broadcastText, setBroadcastText] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [timeLeft, setTimeLeft] = useState(cctvData ? cctvData.timeLeft : 15);

  useEffect(() => {
    if (cctvData) setTimeLeft(cctvData.timeLeft);
  }, [cctvData]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onClose();
      return;
    }
    const t = setTimeout(() => setTimeLeft(tl => Math.max(0, tl - 1)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, onClose]);

  function handleRoomSelect(roomId) {
    setSelectedRoom(roomId);
    onViewRoom(roomId);
  }

  function handleBroadcast() {
    if (broadcastText.trim()) {
      onSendBroadcast(broadcastText.trim());
      setShowBroadcast(false);
    }
  }

  const currentRoomData = cctvData;
  const timerColor = timeLeft <= 5 ? '#e74c3c' : timeLeft <= 10 ? '#f39c12' : '#2ecc71';

  return (
    <div className="modal-bg">
      <div className="modal">
        <h2>CCTV FEED</h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 7, color: '#7f8c8d' }}>SESSION TIMER</div>
          <div style={{ fontSize: 16, color: timerColor, fontFamily: 'var(--pixel)' }}>
            {timeLeft}s
          </div>
        </div>

        {/* Room selector */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 6, color: '#7f8c8d', marginBottom: 6 }}>SELECT ROOM:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {ROOMS.map(room => (
              <button
                key={room.id}
                className={`btn ${selectedRoom === room.id ? '' : 'btn-grey'}`}
                style={{ fontSize: 5, padding: '4px 8px' }}
                onClick={() => handleRoomSelect(room.id)}
              >
                {room.name}
              </button>
            ))}
          </div>
        </div>

        {/* Current room feed */}
        {currentRoomData && (
          <div style={{ border: '1px solid #1e3a5f', padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 7, color: '#3498db', marginBottom: 6 }}>
              {currentRoomData.roomName ? currentRoomData.roomName.toUpperCase() : 'LOADING...'}
            </div>
            <div style={{ fontSize: 6 }}>
              {!currentRoomData.occupants || currentRoomData.occupants.length === 0
                ? <span style={{ color: '#3d3d3d' }}>No players detected</span>
                : currentRoomData.occupants.map((name, i) => (
                  <div key={i} style={{ color: '#2ecc71' }}>▸ {name}</div>
                ))
              }
            </div>
          </div>
        )}

        {!currentRoomData && (
          <div style={{ border: '1px solid #1e3a5f', padding: 10, marginBottom: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 6, color: '#555' }}>Select a room to view</div>
          </div>
        )}

        {/* Broadcast option for Synth */}
        {canMessage && !showBroadcast && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <button
              className="btn btn-blue"
              style={{ fontSize: 6 }}
              onClick={() => setShowBroadcast(true)}
            >
              SEND BROADCAST
            </button>
          </div>
        )}

        {canMessage && showBroadcast && (
          <div style={{ marginBottom: 8 }}>
            <input
              autoFocus
              type="text"
              placeholder="Broadcast message..."
              value={broadcastText}
              onChange={e => setBroadcastText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBroadcast()}
              maxLength={80}
              style={{
                fontFamily: 'var(--pixel)',
                fontSize: 7,
                background: '#0a0a0f',
                border: '1px solid #3498db',
                color: '#ecf0f1',
                padding: '6px',
                outline: 'none',
                width: '100%',
                marginBottom: 6,
              }}
            />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              <button className="btn btn-blue" onClick={handleBroadcast} disabled={!broadcastText.trim()} style={{ fontSize: 6 }}>SEND</button>
              <button className="btn btn-grey" onClick={() => setShowBroadcast(false)} style={{ fontSize: 6 }}>CANCEL</button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-grey" onClick={onClose} style={{ fontSize: 6 }}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}
