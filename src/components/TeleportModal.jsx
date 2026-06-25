import { TELEPORT_PORTALS } from '../game/mapData.js';

const ROOM_LABELS = {
  security:  'Security',
  cafeteria: 'Cafeteria',
  lab:       'Lab',
  dark_room: 'Dark Room',
  control:   'Control Room',
  storage:   'Storage',
};

export default function TeleportModal({ onTeleport, onClose }) {
  return (
    <div className="modal-bg">
      <div className="modal">
        <h2>TELEPORT</h2>
        <p style={{ color: '#8580EC' }}>Choose a room to teleport to.</p>
        <div className="vote-grid" style={{ marginTop: 12 }}>
          {TELEPORT_PORTALS.map(portal => (
            <div
              key={portal.roomId}
              className="vote-card"
              onClick={() => onTeleport(portal.roomId)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ fontSize: 28, marginBottom: 4 }}>🌀</div>
              <div className="vote-name" style={{ color: '#8580EC' }}>
                {ROOM_LABELS[portal.roomId] || portal.roomId}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button className="btn btn-grey" onClick={onClose}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}
