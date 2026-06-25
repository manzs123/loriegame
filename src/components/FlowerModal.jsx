import PixelChar from './PixelChar.jsx';
import { CHARACTERS } from '../game/constants.js';

export default function FlowerModal({ isLoriePlayer, senderName, onRespond }) {
  const zero = CHARACTERS.find(c => c.id === 'zero');
  const lorie = CHARACTERS.find(c => c.id === 'lorie');

  if (isLoriePlayer) {
    return (
      <div className="modal-bg">
        <div className="modal">
          <h2>A FLOWER FROM ZERO</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <PixelChar color={zero?.color} hat={zero?.hat} size={48} />
              <div style={{ fontSize: 7, color: zero?.color, marginTop: 4 }}>{senderName || 'Zero'}</div>
            </div>
            <div style={{ fontSize: 24, alignSelf: 'center' }}>-&gt;</div>
            <div style={{ textAlign: 'center' }}>
              <PixelChar color={lorie?.color} hat={lorie?.hat} size={48} />
              <div style={{ fontSize: 7, color: lorie?.color, marginTop: 4 }}>Lorie (You)</div>
            </div>
          </div>
          <p>Zero sent you a flower as a sign of loyalty.</p>
          <p style={{ color: '#95a5a6' }}>
            Accept and Zero joins your team,<br />
            or reject and they remain a crewmate.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
            <button className="btn" onClick={() => onRespond(true)}>ACCEPT</button>
            <button className="btn btn-grey" onClick={() => onRespond(false)}>REJECT</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-bg">
      <div className="modal">
        <h2>FLOWER SENT</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <PixelChar color={zero?.color} hat={zero?.hat} size={52} />
        </div>
        <p>You sent a flower to Lorie...</p>
        <p style={{ color: '#95a5a6' }}>Waiting for Lorie's response.</p>
        <div style={{ textAlign: 'center', fontSize: 6, color: '#555', marginTop: 8 }}>
          This modal will close automatically.
        </div>
      </div>
    </div>
  );
}
