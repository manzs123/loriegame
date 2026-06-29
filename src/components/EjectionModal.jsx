import { useEffect, useRef, useState } from 'react';
import PixelChar from './PixelChar.jsx';
import { CHARACTERS } from '../game/constants.js';

export default function EjectionModal({ ejectedName, ejectedCharId, wasVillain, onDone }) {
  const [phase, setPhase] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const charDef = CHARACTERS.find(c => c.id === ejectedCharId);
  const color = charDef?.color || '#888888';
  const hat = charDef?.hat || '#555555';

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2000);
    const t2 = setTimeout(() => setPhase(2), 3800);
    const t3 = setTimeout(() => onDoneRef.current(), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []); // run once on mount — timers must not reset on re-render

  return (
    <div className={`ejection-overlay${phase === 2 ? ' phase-2' : ''}`}>
      {/* Starfield background */}
      <div className="ejection-stars" />

      <div className="ejection-content">
        {/* "HAS BEEN KICKED!" banner */}
        <div className="ejection-banner">
          ⚠ PLAYER KICKED ⚠
        </div>

        {/* Character sprite */}
        <div className="ejection-char">
          <PixelChar color={color} hat={hat} size={110} />
        </div>

        {/* Name */}
        <div className="ejection-name">
          {ejectedName.toUpperCase()}
        </div>

        {/* Role reveal — shown in phase 1+ */}
        {phase >= 1 && (
          <div className={`ejection-role ${wasVillain ? 'villain' : 'innocent'}`}>
            {wasVillain ? '☠ WAS LORIE' : '✓ WAS INNOCENT'}
          </div>
        )}

        {/* Ejection text — shown in phase 2 */}
        {phase >= 2 && (
          <div className="ejection-bye">
            ejected into space...
          </div>
        )}
      </div>
    </div>
  );
}
