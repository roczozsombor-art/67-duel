import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let globalSocket = null;

export function getSocket() {
  if (!globalSocket) {
    const url = import.meta.env.VITE_SERVER_URL || '/';
    globalSocket = io(url, { transports: ['websocket', 'polling'] });
  }
  return globalSocket;
}

export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}

export function useSocket(handlers = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = getSocket();
    const entries = Object.entries(handlersRef.current);

    entries.forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      entries.forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, []);

  return getSocket();
}
