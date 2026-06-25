import PixelChar from './PixelChar.jsx';
import Chat from './Chat.jsx';

export default function SidePanel({ state, myCharId, myCharDef, onUseSkill, onInteract, onChat, chatMessages }) {
  const player = state ? state.players.find(p => p.charId === myCharId) : null;
  const totalTasks = state && state.tasks ? state.tasks.length : 0;
  const doneTasks = state && state.tasks ? state.tasks.filter(t => t.done).length : 0;

  const skillCooldown = player ? player.skillCooldownLeft : 0;

  return (
    <div className="side-panel">
      {/* LEFT COLUMN: info, tasks, skill, remaining */}
      <div className="side-panel-info">
        {/* Player Info */}
        <div className="panel-section">
          <div className="panel-title">YOU ARE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <PixelChar color={myCharDef?.color} hat={myCharDef?.hat} size={36} />
            <div>
              <div style={{ fontSize: 10, color: myCharDef?.color }}>{myCharDef?.name}</div>
              <div style={{ fontSize: 6, color: '#7f8c8d', marginTop: 2 }}>{myCharDef?.desc}</div>
              {player?.isVillain && (
                <div style={{ fontSize: 6, color: '#e74c3c', marginTop: 2 }}>VILLAIN</div>
              )}
              {player?.hiding && (
                <div style={{ fontSize: 6, color: '#636e72', marginTop: 2 }}>HIDING</div>
              )}
            </div>
          </div>
          <div className="day-info">Day {state?.day || 1}</div>
          {state && !state.electricityOn && (
            <div style={{ fontSize: 6, color: '#e74c3c', marginTop: 4 }}>POWER OUT - go to Security!</div>
          )}
          {player && !player.alive && (
            <div style={{ color: '#8888cc', fontSize: 7, marginTop: 4 }}>✝ You are a ghost</div>
          )}
        </div>

        {/* Tasks */}
        <div className="panel-section">
          <div className="panel-title">TASKS ({doneTasks}/{totalTasks})</div>
          {state && state.tasks && state.tasks.map(task => (
            <div key={task.id} className="task-item">
              <div className={`task-name ${task.done ? 'task-done' : ''}`}>
                {task.name}
              </div>
              <div className="task-room">{task.room.replace('_', ' ')}</div>
              <div className="task-bar">
                <div
                  className="task-fill"
                  style={{ width: `${Math.min(100, ((task.progress||0) / 900) * 100)}%`, background: task.done ? '#2ecc71' : (task.progress||0) > 0 ? '#f39c12' : '#3498db' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Skill */}
        {player?.alive && (
          <div className="panel-section skill-section">
            <div className="panel-title">SKILL</div>
            <div style={{ fontSize: 8, color: myCharDef?.color, marginBottom: 4 }}>
              {myCharDef?.skillName}
            </div>
            <div className="skill-info">{myCharDef?.skillDesc}</div>
            {skillCooldown > 0 ? (
              <div style={{ fontSize: 6, color: '#e74c3c', margin: '6px 0' }}>
                Cooldown: {skillCooldown} day(s)
              </div>
            ) : (
              <div style={{ fontSize: 6, color: '#2ecc71', margin: '6px 0' }}>Ready</div>
            )}
            <button
              className="btn"
              style={{ fontSize: 7, padding: '8px 10px', width: '100%' }}
              onClick={onUseSkill}
            >
              [ Q ] USE SKILL
            </button>
          </div>
        )}

        {/* Remaining count */}
        <div className="panel-section">
          <div className="panel-title">REMAINING</div>
          {state && state.players && (() => {
            const total = state.players.length;
            const alive = state.players.filter(p => p.alive).length;
            return (
              <div style={{ textAlign: 'center', padding: '6px 0' }}>
                <div style={{ fontSize: 18, color: '#f39c12', marginBottom: 4 }}>
                  {alive}
                </div>
                <div style={{ fontSize: 6, color: '#7f8c8d' }}>
                  of {total} alive
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* RIGHT COLUMN: chat */}
      <div className="side-panel-chat">
        <Chat
          messages={chatMessages}
          onSend={onChat}
          playerAlive={player?.alive ?? true}
          day={state?.day || 1}
        />
      </div>
    </div>
  );
}
