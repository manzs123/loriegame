import { CHARACTERS } from '../game/constants.js';
import PixelChar from './PixelChar.jsx';

export default function GameOver({ winner, myCharId, myIsVillain, lorieCharId, onRestart }) {
  const myCharDef = CHARACTERS.find(c => c.id === myCharId);
  const lorieCharDef = CHARACTERS.find(c => c.id === (lorieCharId || 'lorie'));

  const crewWin = winner === 'crewmates';
  const playerWon = crewWin ? !myIsVillain : myIsVillain;

  return (
    <div className="gameover">
      <div className={`gameover-title ${playerWon ? 'win' : 'lose'}`}>
        {crewWin ? 'CREWMATES WIN!' : 'LORIE WINS!'}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {myCharDef && (
          <div style={{ textAlign: 'center' }}>
            <PixelChar color={myCharDef.color} hat={myCharDef.hat} size={64} />
            <div style={{ fontSize: 8, color: myCharDef.color, marginTop: 8 }}>{myCharDef.name}</div>
            <div style={{ fontSize: 6, color: playerWon ? '#2ecc71' : '#e74c3c', marginTop: 4 }}>
              {playerWon ? 'YOU WON' : 'YOU LOST'}
            </div>
          </div>
        )}

        {!crewWin && lorieCharDef && (
          <div style={{ textAlign: 'center' }}>
            <PixelChar color={lorieCharDef.color} hat={lorieCharDef.hat} size={64} />
            <div style={{ fontSize: 8, color: lorieCharDef.color, marginTop: 8 }}>Lorie</div>
            <div style={{ fontSize: 6, color: '#e74c3c', marginTop: 4 }}>THE KILLER</div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 7, color: '#7f8c8d', textAlign: 'center', maxWidth: 300, lineHeight: 2 }}>
        {crewWin
          ? 'The crew successfully identified Lorie and escaped the facility!'
          : 'Lorie eliminated enough crewmates to take control of the facility.'}
      </div>

      <button className="btn btn-green" onClick={onRestart} style={{ marginTop: 8, fontSize: 9, padding: '14px 28px', letterSpacing: 2 }}>
        RETURN TO HOME
      </button>
    </div>
  );
}
