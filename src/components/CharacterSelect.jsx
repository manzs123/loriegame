import { useState } from 'react';
import { CHARACTERS } from '../game/constants.js';
import PixelChar from './PixelChar.jsx';

export default function CharacterSelect({ onSelect, onBack }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="char-select">
      <h1>CHOOSE YOUR CHARACTER</h1>
      <div style={{ fontSize: '7px', color: '#7f8c8d', textAlign: 'center' }}>
        Each character has a unique ability. Choose wisely.
      </div>

      <div className="char-grid">
        {CHARACTERS.map((ch) => (
          <div
            key={ch.id}
            className={`char-card${selected === ch.id ? ' selected' : ''}${ch.role === 'villain' ? ' villain' : ''}`}
            onClick={() => setSelected(ch.id)}
          >
            {ch.role === 'villain' && (
              <div style={{ fontSize: '6px', color: '#e74c3c', marginBottom: 4 }}>⚠ VILLAIN</div>
            )}
            {ch.role === 'double_agent' && (
              <div style={{ fontSize: '6px', color: '#f39c12', marginBottom: 4 }}>🎭 DOUBLE AGENT</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <PixelChar color={ch.color} hat={ch.hat} size={52} />
            </div>
            <div className="char-name" style={{ color: ch.color }}>{ch.name}</div>
            <div className="char-desc">{ch.desc}</div>
            <div style={{ borderTop: '1px solid #1e3a5f', marginTop: 6, paddingTop: 6 }}>
              <div className="char-skill-name">⚡ {ch.skillName}</div>
              <div className="char-skill-desc">{ch.skillDesc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button className="btn btn-grey" onClick={onBack}>◀ BACK</button>
        <button
          className="btn btn-green"
          onClick={() => selected && onSelect(selected)}
          style={{ opacity: selected ? 1 : 0.4 }}
        >
          ▶ PLAY AS {selected ? CHARACTERS.find((c) => c.id === selected)?.name.toUpperCase() : '???'}
        </button>
      </div>
    </div>
  );
}
