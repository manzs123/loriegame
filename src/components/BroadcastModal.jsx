import { useState } from 'react';

export default function BroadcastModal({ onSend, onClose }) {
  const [text, setText] = useState('');

  function handleSend() {
    if (text.trim()) {
      onSend(text.trim());
    }
  }

  return (
    <div className="modal-bg">
      <div className="modal">
        <h2>BROADCAST MESSAGE</h2>
        <p>Send an anonymous message to all players:</p>
        <div className="broadcast-form">
          <input
            autoFocus
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            maxLength={80}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn" onClick={handleSend} disabled={!text.trim()}>SEND</button>
            <button className="btn btn-grey" onClick={onClose}>CANCEL</button>
          </div>
        </div>
      </div>
    </div>
  );
}
