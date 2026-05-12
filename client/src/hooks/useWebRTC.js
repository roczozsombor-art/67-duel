import { useEffect, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { getSocket } from './useSocket';

export function useWebRTC({ matchId, role, onRemoteStream, onError }) {
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const cleanup = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!matchId) return;
    const socket = getSocket();

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        localStreamRef.current = stream;

        const isInitiator = role === 'initiator';
        const peer = new SimplePeer({
          initiator: isInitiator,
          stream,
          trickle: true,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        });
        peerRef.current = peer;

        peer.on('signal', (signal) => {
          socket.emit('signal', { matchId, signal });
        });

        peer.on('stream', (remoteStream) => {
          onRemoteStream?.(remoteStream);
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          onError?.(err);
        });

        socket.on('signal', ({ signal }) => {
          if (peerRef.current && !peerRef.current.destroyed) {
            peerRef.current.signal(signal);
          }
        });

        return stream;
      } catch (err) {
        console.error('getUserMedia error:', err);
        onError?.(err);
      }
    }

    init();

    return () => {
      socket.off('signal');
      cleanup();
    };
  }, [matchId, role]);

  return {
    localStream: localStreamRef.current,
    getLocalStream: () => localStreamRef.current,
    cleanup,
  };
}
