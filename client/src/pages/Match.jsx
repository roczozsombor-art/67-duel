import React, { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import RepCounter from '../components/RepCounter';
import Timer from '../components/Timer';
import { VideoFeedRef } from '../components/VideoFeed';
import { getSocket } from '../hooks/useSocket';

const MATCH_DURATION = 60;

export default function Match({ user, opponent, matchId, role, onMatchEnd }) {
  const [phase, setPhase] = useState('connecting'); // connecting | ready | countdown | battle | ended
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(MATCH_DURATION);
  const [myReps, setMyReps] = useState(0);
  const [oppReps, setOppReps] = useState(0);
  const [oppConnected, setOppConnected] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const repsRef = useRef(0);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const matchEndedRef = useRef(false);

  // Gesture state
  const prevYRef = useRef({});
  const gesturePhaseRef = useRef('idle');
  const debounceRef = useRef(false);

  const socket = getSocket();

  const incrementRep = useCallback(() => {
    if (debounceRef.current || phase === 'ended') return;
    debounceRef.current = true;
    repsRef.current += 1;
    setMyReps(repsRef.current);
    socket.emit('rep-update', { matchId, reps: repsRef.current });
    setTimeout(() => { debounceRef.current = false; }, 350);
  }, [matchId, phase]);

  // Setup webcam + WebRTC
  useEffect(() => {
    const s = socket;
    let destroyed = false;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const peer = new SimplePeer({
          initiator: role === 'initiator',
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

        peer.on('signal', (sig) => {
          s.emit('signal', { matchId, signal: sig });
        });

        peer.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setOppConnected(true);
        });

        peer.on('connect', () => {
          setPhase('ready');
          s.emit('player-ready', { matchId });
        });

        peer.on('error', (err) => console.warn('Peer error:', err));

        // Fallback: also mark ready after 5s even without peer connect
        setTimeout(() => {
          if (!matchEndedRef.current && phase === 'connecting') {
            setPhase('ready');
            s.emit('player-ready', { matchId });
          }
        }, 5000);

      } catch (err) {
        console.error('Camera error:', err);
        // Still allow match to proceed without camera
        setPhase('ready');
        s.emit('player-ready', { matchId });
      }
    }

    init();

    s.on('signal', ({ signal }) => {
      if (peerRef.current && !peerRef.current.destroyed) {
        try { peerRef.current.signal(signal); } catch {}
      }
    });

    s.on('opponent-reps', ({ reps }) => setOppReps(reps));

    s.on('match-start', () => {
      if (destroyed) return;
      startCountdown();
    });

    s.on('opponent-disconnected', () => {
      if (!matchEndedRef.current) {
        // Will receive match-end shortly
      }
    });

    s.on('match-end', (data) => {
      if (destroyed || matchEndedRef.current) return;
      matchEndedRef.current = true;
      setPhase('ended');
      clearInterval(timerRef.current);
      clearTimeout(countdownRef.current);
      stopHandDetection();
      setTimeout(() => onMatchEnd(data), 1000);
    });

    return () => {
      destroyed = true;
      s.off('signal');
      s.off('opponent-reps');
      s.off('match-start');
      s.off('opponent-disconnected');
      s.off('match-end');
      cleanup();
    };
  }, []);

  function startCountdown() {
    setPhase('countdown');
    let c = 3;
    setCountdown(c);
    const interval = setInterval(() => {
      c -= 1;
      if (c <= 0) {
        clearInterval(interval);
        setPhase('battle');
        startBattle();
        startHandDetection();
      } else {
        setCountdown(c);
      }
    }, 1000);
    countdownRef.current = interval;
  }

  function startBattle() {
    let t = MATCH_DURATION;
    setTimeLeft(t);
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(timerRef.current);
        // Server will send match-end
      }
    }, 1000);
  }

  async function startHandDetection() {
    if (!localVideoRef.current) return;
    try {
      const { Hands } = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');

      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({ maxNumHands: 2, modelComplexity: 0, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5 });

      hands.onResults((results) => {
        const lms = results.multiHandLandmarks;
        if (!lms || lms.length < 2) {
          prevYRef.current = {};
          gesturePhaseRef.current = 'idle';
          return;
        }
        const y0 = lms[0][0].y;
        const y1 = lms[1][0].y;
        const prev0 = prevYRef.current[0];
        const prev1 = prevYRef.current[1];

        if (prev0 !== undefined && prev1 !== undefined) {
          const dy0 = y0 - prev0;
          const dy1 = y1 - prev1;
          const thr = 0.008;
          if ((gesturePhaseRef.current === 'idle' || gesturePhaseRef.current === 'phase2') && dy0 < -thr && dy1 > thr) {
            gesturePhaseRef.current = 'phase1';
          }
          if (gesturePhaseRef.current === 'phase1' && dy0 > thr && dy1 < -thr) {
            gesturePhaseRef.current = 'phase2';
            incrementRep();
          }
        }
        prevYRef.current[0] = y0;
        prevYRef.current[1] = y1;
      });

      handsRef.current = hands;

      const cam = new Camera(localVideoRef.current, {
        onFrame: async () => {
          if (localVideoRef.current && handsRef.current) {
            await handsRef.current.send({ image: localVideoRef.current });
          }
        },
        width: 640, height: 480,
      });
      cam.start();
      cameraRef.current = cam;
    } catch (err) {
      console.warn('Hand detection unavailable:', err);
      // Fallback: keyboard spacebar for testing
      const handler = (e) => { if (e.code === 'Space' && e.type === 'keydown') incrementRep(); };
      window.addEventListener('keydown', handler);
      window._spaceHandler = handler;
    }
  }

  function stopHandDetection() {
    cameraRef.current?.stop?.();
    handsRef.current?.close?.();
    if (window._spaceHandler) {
      window.removeEventListener('keydown', window._spaceHandler);
      delete window._spaceHandler;
    }
  }

  function cleanup() {
    clearInterval(timerRef.current);
    clearTimeout(countdownRef.current);
    stopHandDetection();
    peerRef.current?.destroy?.();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
  }

  return (
    <div className="min-h-screen bg-dark-bg grid-bg flex flex-col" style={{ userSelect: 'none' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 glass"
        style={{ borderBottom: '1px solid #1a1a2e' }}>
        <div className="font-display text-xs neon-text-green tracking-widest">67 DUEL</div>
        <div className="font-mono text-xs opacity-40 truncate max-w-xs">
          vs <span className="text-white/60">{opponent?.username}</span>
        </div>
        <div className="font-mono text-xs opacity-30 hidden sm:block">
          {phase.toUpperCase()}
        </div>
      </div>

      {/* Main arena */}
      <div className="flex-1 flex flex-col p-3 gap-3">
        {/* Video feeds row */}
        <div className="flex gap-3" style={{ height: 'clamp(160px, 30vh, 280px)' }}>
          <div className="flex-1 relative rounded-xl overflow-hidden neon-border-green">
            <video ref={localVideoRef} autoPlay playsInline muted
              className="w-full h-full object-cover scale-x-[-1]" />
            <div className="absolute bottom-2 left-2 glass rounded px-2 py-0.5">
              <span className="text-xs font-mono neon-text-green">{user.username} (YOU)</span>
            </div>
          </div>
          <div className="flex-1 relative rounded-xl overflow-hidden neon-border-cyan">
            <video ref={remoteVideoRef} autoPlay playsInline
              className="w-full h-full object-cover" />
            {!oppConnected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 opacity-40">
                  <div className="text-3xl">📷</div>
                  <span className="text-xs font-mono">Connecting...</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 glass rounded px-2 py-0.5">
              <span className="text-xs font-mono neon-text-cyan">{opponent?.username}</span>
            </div>
          </div>
        </div>

        {/* Center HUD */}
        <div className="flex items-center justify-around glass rounded-2xl py-4 px-2 neon-border-green flex-1"
          style={{ background: 'rgba(10,10,15,0.9)' }}>

          {/* Your reps */}
          <div className="flex flex-col items-center">
            <RepCounter reps={myReps} label="YOU" color="green" />
          </div>

          {/* Center: timer + VS */}
          <div className="flex flex-col items-center gap-3">
            {phase === 'connecting' && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-neon-green border-t-transparent animate-spin" />
                <span className="font-mono text-xs opacity-50">Connecting</span>
              </div>
            )}
            {phase === 'ready' && (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-pulse">
                  <span className="font-display text-sm neon-text-green tracking-widest">READY</span>
                </div>
                <span className="font-mono text-xs opacity-40">Waiting for opponent...</span>
              </div>
            )}
            {phase === 'countdown' && (
              <div className="flex flex-col items-center">
                <span className="font-mono text-xs opacity-40 mb-1 tracking-widest">GET READY</span>
                <span className="font-display font-black neon-text-green animate-ping"
                  style={{ fontSize: '6rem', textShadow: '0 0 20px #00ff88, 0 0 60px #00ff88' }}>
                  {countdown}
                </span>
              </div>
            )}
            {(phase === 'battle' || phase === 'ended') && (
              <div className="flex flex-col items-center gap-2">
                <Timer seconds={timeLeft} />
                <div className="font-display text-2xl font-black"
                  style={{ color: '#ffffff33', textShadow: 'none', letterSpacing: '0.2em' }}>
                  VS
                </div>
              </div>
            )}
          </div>

          {/* Opponent reps */}
          <div className="flex flex-col items-center">
            <RepCounter reps={oppReps} label={opponent?.username?.substring(0,6) || 'OPP'} color="cyan" animate={false} />
          </div>
        </div>

        {/* Bottom hint */}
        {phase === 'battle' && (
          <div className="text-center">
            <p className="font-mono text-xs opacity-30">
              Perform the 67 gesture with both hands • spacebar = debug rep
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
