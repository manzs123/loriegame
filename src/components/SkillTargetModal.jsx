import PixelChar from './PixelChar.jsx';

export default function SkillTargetModal({ state, myCharId, skill, onSelect, onClose }) {
  const me = state ? state.players.find(p => p.charId === myCharId) : null;
  const isKill = skill === 'KILL';

  const candidates = state ? state.players.filter(p => {
    if (!p.alive || p.charId === myCharId) return false;
    if (isKill && p.isVillain === true) return false; // Lorie doesn't kill allies
    return true;
  }) : [];

  const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  const nearby = me
    ? candidates.filter(p => dist(p.pos, me.pos) < 120)
    : candidates;
  const list = nearby.length > 0 ? nearby : candidates;

  return (
    <div className="modal-bg">
      <div className="modal">
        <h2>{isKill ? 'SELECT TARGET' : 'SELECT SCAN TARGET'}</h2>
        <p style={{ color: '#95a5a6' }}>
          {isKill
            ? 'Choose a crewmate to eliminate.'
            : 'Choose a player to scan. (Need 3 scans to confirm Lorie)'}
        </p>
        {nearby.length === 0 && candidates.length > 0 && (
          <p style={{ color: '#e74c3c', fontSize: 6 }}>No players nearby — showing all alive players.</p>
        )}
        {list.length === 0 && (
          <p style={{ color: '#7f8c8d', fontSize: 6 }}>No valid targets available.</p>
        )}
        <div className="vote-grid" style={{ marginTop: 12 }}>
          {list.map((p, i) => {
            const displayColor = p.color || '#888';
            const hatColor = p.hat || '#555';
            return (
              <div
                key={p.charId || p.name || i}
                className="vote-card"
                onClick={() => onSelect(p.charId)}
                style={{ cursor: 'pointer' }}
              >
                <PixelChar color={displayColor} hat={hatColor} size={36} />
                <div className="vote-name" style={{ color: displayColor }}>{p.name}</div>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button className="btn btn-grey" onClick={onClose}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}
