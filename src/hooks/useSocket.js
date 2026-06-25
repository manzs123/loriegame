import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const RECONNECT_INTERVAL = 2000;

export function useSocket(onMessage) {
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const reconnectTimer = useRef(null);
  const unmounted = useRef(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('connecting'); // connecting | open | error

  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (unmounted.current) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;

    setStatus('connecting');

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmounted.current) { ws.close(); return; }
      setConnected(true);
      setStatus('open');
      if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        onMessageRef.current(msg);
      } catch (e) {
        console.error('[WS] Bad message:', e);
      }
    };

    ws.onclose = () => {
      // Only react to close events from the *current* socket.
      // In React StrictMode effects run twice: cleanup closes ws1 synchronously
      // then immediately creates ws2 (wsRef.current = ws2), but ws1.onclose fires
      // asynchronously *after* ws2 is assigned — so we must ignore it here.
      if (wsRef.current !== ws) return;
      wsRef.current = null;
      setConnected(false);
      setStatus('error');
      if (!unmounted.current) {
        reconnectTimer.current = setTimeout(connect, RECONNECT_INTERVAL);
      }
    };

    ws.onerror = () => {
      setStatus('error');
      // onclose will fire next and trigger reconnect
    };
  }, []);

  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    };
  }, [connect]);

  const send = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }, []);

  return { send, connected, status };
}
