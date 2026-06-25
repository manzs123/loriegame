import { useState } from 'react';
import { CHARACTERS } from '../game/constants.js';
import PixelChar from './PixelChar.jsx';

export default function ReviewModal({ state, myCharId, onVote }) {
  const [myVote, setMyVote] = useState(null);

  const alivePlayers = state && state.players ? state.players.filter(p => p.alive) : [];
  const hasVoted = state && state.votes ? state.votes[myCharId] !== undefined : false;

  const voteCounts = {};
  if (state && state.votes) {
    Object.values(state.votes).forEach(id => {
      voteCounts[id] = (voteCounts[id] || 0) + 1;
    });
  }

  function handleVote(targetId) {
    if (hasVoted) return;
    setMyVote(targetId);
    onVote(targetId);
  }

  const totalVotes = state && state.votes ? Object.keys(state.votes).length : 0;
  const timeLeft = state?.voteTimeLeft ?? 60;
  const timeColor = timeLeft <= 10 ? '#e74c3c' : timeLeft <= 20 ? '#f39c12' : '#2ecc71';

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="modal-bg">
      <div className="modal">
        <h2>EMERGENCY REVIEW</h2>
        <p style={{ color: '#f39c12' }}>{state?.reviewReason || 'Discussion time!'}</p>

        {/* Vote timer */}
        <div style={{
          textAlign: 'center',
          marginBottom: 12,
          fontFamily: 'var(--pixel)',
          fontSize: 20,
          color: timeColor,
          letterSpacing: 2,
        }}>
          {mm}:{ss}
        </div>

        <p style={{ fontSize: 7, color: '#95a5a6', textAlign: 'center', marginBottom: 8 }}>
          Vote before time runs out!
        </p>

        <div className="vote-grid">
          {alivePlayers.map(p => {
            const charDef = p.charId ? CHARACTERS.find(c => c.id === p.charId) : null;
            const isMe = p.charId === myCharId;
            const voted = myVote === p.charId;
            const displayColor = charDef?.color || p.color || '#888';
            return (
              <div
                key={p.charId || p.name}
                className={`vote-card${voted ? ' voted' : ''}`}
                onClick={() => !isMe && !hasVoted && handleVote(p.charId)}
                style={{
                  cursor: isMe || hasVoted ? 'default' : 'pointer',
                  opacity: isMe ? 0.5 : 1,
                  borderColor: voted ? displayColor : undefined,
                }}
              >
                <PixelChar color={displayColor} hat={charDef?.hat || '#555'} size={36} />
                <div className="vote-name" style={{ color: displayColor }}>
                  {isMe && charDef ? charDef.name : p.name}
                </div>
                {isMe && <div style={{ fontSize: 5, color: '#7f8c8d' }}>(you)</div>}
                <div className="vote-count">
                  {voteCounts[p.charId] ? `${voteCounts[p.charId]} vote${voteCounts[p.charId] > 1 ? 's' : ''}` : ''}
                </div>
              </div>
            );
          })}

          {/* Skip */}
          <div
            className={`vote-card${myVote === 'skip' ? ' voted' : ''}`}
            onClick={() => !hasVoted && handleVote('skip')}
            style={{ cursor: hasVoted ? 'default' : 'pointer', borderColor: myVote === 'skip' ? '#7f8c8d' : undefined }}
          >
            <div style={{ fontSize: 24, marginTop: 4 }}>NO</div>
            <div className="vote-name" style={{ color: '#7f8c8d' }}>Skip</div>
            <div className="vote-count">
              {voteCounts['skip'] ? `${voteCounts['skip']} vote${voteCounts['skip'] > 1 ? 's' : ''}` : ''}
            </div>
          </div>
        </div>

        {hasVoted && (
          <p style={{ color: '#7f8c8d', textAlign: 'center' }}>
            Vote cast! Waiting... ({totalVotes}/{alivePlayers.length})
          </p>
        )}

        {!hasVoted && (
          <p style={{ fontSize: 6, color: '#555', marginTop: 8, textAlign: 'center' }}>
            Click a player to vote. You cannot vote for yourself.
          </p>
        )}
      </div>
    </div>
  );
}
