import { useEffect, useState } from 'react';
import PixelChar from './PixelChar.jsx';
import { CHARACTERS } from '../game/constants.js';

export default function EjectionModal({ ejectedName, ejectedCharId, wasVillain, onDone }) {
  const [phase, setPhase] = useState(0);

  const charDef = CHARACTERS.find(c => c.id === ejectedCharId);
  const color = charDef?.color || '#888888';
  const hat = charDef?.hat || '#555555';

  useEffect(() => {
    // Phase 1 starts at 1.5s
    const t1 = setTimeout(() => setPhase(1), 1500);
    // Phase 2 starts at 3s
    const t2 = setTimeout(() => setPhase(2), 3000);
    // Call onDone at 4.2s
    const t3 = setTimeout(() => onDone(), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div className={`ejection-overlay${phase === 2 ? ' phase-2' : ''}`}>
      {/* Starfield background */}
      <div className="ejection-stars" />

      <div className="ejection-content">
        {/* Character sprite */}
        <div className="ejection-char">
          <PixelChar color={color} hat={hat} size={80} />
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
