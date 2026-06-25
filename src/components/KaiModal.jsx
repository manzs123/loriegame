import PixelChar from './PixelChar.jsx';
import { CHARACTERS } from '../game/constants.js';

export default function KaiModal({ onChoose }) {
  const kai = CHARACTERS.find(c => c.id === 'kai');
  const lorie = CHARACTERS.find(c => c.id === 'lorie');

  return (
    <div className="modal-bg">
      <div className="modal">
        <h2>KAI'S ALLEGIANCE</h2>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <PixelChar color={kai?.color} hat={kai?.hat} size={52} />
        </div>
        <p>As the Double Agent, Kai must choose a side.</p>
        <p style={{ color: '#95a5a6' }}>
          Ally with Lorie and help eliminate crewmates,<br />
          or stand with the crew and protect them.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <PixelChar color={lorie?.color} hat={lorie?.hat} size={40} />
            <button
              className="btn"
              style={{ display: 'block', marginTop: 8, fontSize: 7 }}
              onClick={() => onChoose('lorie')}
            >
              SIDE WITH LORIE
            </button>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>+</div>
            <button
              className="btn btn-green"
              style={{ display: 'block', marginTop: 8, fontSize: 7 }}
              onClick={() => onChoose('crew')}
            >
              SIDE WITH CREW
            </button>
          </div>
        </div>
        <p style={{ fontSize: 6, color: '#555', marginTop: 12 }}>
          Your choice affects win conditions and voting behavior.
        </p>
      </div>
    </div>
  );
}
