import { useState, useRef, useEffect } from 'react';

export default function Chat({ messages, onSend, playerAlive, day }) {
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend() {
    const t = text.trim();
    if (!t || !playerAlive) return;
    onSend(t);
    setText('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="panel-title">CHAT</div>
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          paddingRight: 2,
          minHeight: 0,
          maxHeight: 160,
        }}
      >
        {messages && messages.map((msg, i) => (
          <div
            key={i}
            style={{
              fontSize: 6,
              padding: '3px 4px',
              borderLeft: `2px solid ${msg.isDead ? '#555' : '#3498db'}`,
              color: msg.isDead ? '#555' : '#bdc3c7',
              wordBreak: 'break-word',
              lineHeight: 1.6,
            }}
          >
            <span style={{ color: '#555' }}>[D{msg.day}] </span>
            <span style={{ color: msg.isDead ? '#666' : '#f39c12' }}>{msg.senderName}:</span>
            {' '}{msg.text}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={!playerAlive}
          placeholder={playerAlive ? 'Type message...' : 'You are dead'}
          maxLength={100}
          style={{
            flex: 1,
            fontFamily: 'var(--pixel)',
            fontSize: 6,
            background: '#0a0a0f',
            border: `1px solid ${playerAlive ? '#1e3a5f' : '#333'}`,
            color: playerAlive ? '#ecf0f1' : '#555',
            padding: '5px',
            outline: 'none',
            minWidth: 0,
          }}
        />
        <button
          className="btn"
          onClick={handleSend}
          disabled={!playerAlive || !text.trim()}
          style={{ fontSize: 5, padding: '4px 6px' }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
