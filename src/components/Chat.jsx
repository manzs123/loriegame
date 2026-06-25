import { useState, useRef, useEffect } from 'react';

export default function Chat({ messages, onSend, playerAlive, day }) {
  const [text, setText] = useState('');
  const [messagesVisible, setMessagesVisible] = useState(false);
  const listRef = useRef(null);
  const inputFocusedRef = useRef(false);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-show messages for 3s when a new one arrives (mobile)
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    setMessagesVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!inputFocusedRef.current) setMessagesVisible(false);
    }, 3000);
    return () => clearTimeout(hideTimerRef.current);
  }, [messages?.length]);

  function handleSend() {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  }

  function handleFocus() {
    inputFocusedRef.current = true;
    clearTimeout(hideTimerRef.current);
    setMessagesVisible(true);
  }

  function handleBlur() {
    inputFocusedRef.current = false;
    hideTimerRef.current = setTimeout(() => {
      if (!inputFocusedRef.current) setMessagesVisible(false);
    }, 600);
  }

  const isGhost = !playerAlive;

  return (
    <div className="chat-container">
      <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        CHAT
        {isGhost && <span style={{ color: '#7777aa', fontSize: 6 }}>✝ GHOST</span>}
      </div>

      <div
        ref={listRef}
        className={`chat-messages-wrap${messagesVisible ? ' visible' : ''}`}
      >
        {messages && messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-msg${msg.isDead ? ' chat-msg-ghost' : ''}`}
          >
            <span className="chat-day">[D{msg.day}] </span>
            <span className="chat-sender" style={{ color: msg.isDead ? '#7777aa' : '#f39c12' }}>
              {msg.isDead ? '✝ ' : ''}{msg.senderName}:
            </span>
            {' '}{msg.text}
          </div>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isGhost ? '✝ Ghost chat...' : 'Type message...'}
          maxLength={100}
          style={{
            flex: 1,
            fontFamily: 'var(--pixel)',
            fontSize: 6,
            background: '#0a0a0f',
            border: `1px solid ${isGhost ? '#4444aa' : '#1e3a5f'}`,
            color: isGhost ? '#8888cc' : '#ecf0f1',
            padding: '5px',
            outline: 'none',
            minWidth: 0,
          }}
        />
        <button
          className="btn"
          onClick={handleSend}
          disabled={!text.trim()}
          style={{ fontSize: 5, padding: '4px 6px' }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
