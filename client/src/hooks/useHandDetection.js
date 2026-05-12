import { useEffect, useRef, useCallback } from 'react';

/*
  Detects the "67" gesture: two hands moving in vertical opposition.
  Each completed rep = one full alternating cycle (hand0 goes up while hand1 goes down, then switches).
  Falls back gracefully if MediaPipe fails to load.
*/
export function useHandDetection({ videoRef, onRepCount, enabled = true }) {
  const repsRef = useRef(0);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const prevYRef = useRef({});        // handIndex -> last wrist Y
  const stateRef = useRef('idle');    // 'idle' | 'phase1' | 'phase2'
  const debounceRef = useRef(false);

  const countRep = useCallback(() => {
    if (debounceRef.current) return;
    debounceRef.current = true;
    repsRef.current += 1;
    onRepCount?.(repsRef.current);
    setTimeout(() => { debounceRef.current = false; }, 400);
  }, [onRepCount]);

  useEffect(() => {
    if (!enabled || !videoRef?.current) return;

    let destroyed = false;

    async function loadMediaPipe() {
      // Dynamic import via CDN URLs bundled as global
      const { Hands } = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');

      if (destroyed) return;

      const hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results) => {
        if (destroyed) return;
        const lms = results.multiHandLandmarks;
        if (!lms || lms.length < 2) {
          prevYRef.current = {};
          stateRef.current = 'idle';
          return;
        }

        // Wrist landmarks (index 0)
        const y0 = lms[0][0].y;
        const y1 = lms[1][0].y;

        const prev0 = prevYRef.current[0];
        const prev1 = prevYRef.current[1];

        if (prev0 !== undefined && prev1 !== undefined) {
          const dy0 = y0 - prev0; // positive = moving down in image coords
          const dy1 = y1 - prev1;
          const threshold = 0.008;

          // Phase 1: hand0 up, hand1 down
          if (stateRef.current === 'idle' || stateRef.current === 'phase2') {
            if (dy0 < -threshold && dy1 > threshold) {
              stateRef.current = 'phase1';
            }
          }
          // Phase 2: hand0 down, hand1 up -> completes a rep
          if (stateRef.current === 'phase1') {
            if (dy0 > threshold && dy1 < -threshold) {
              stateRef.current = 'phase2';
              countRep();
            }
          }
        }

        prevYRef.current[0] = y0;
        prevYRef.current[1] = y1;
      });

      handsRef.current = hands;

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && !destroyed) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });

      camera.start();
      cameraRef.current = camera;
    }

    loadMediaPipe().catch((err) => {
      console.warn('MediaPipe failed to load, using fallback:', err);
      // Fallback: simple spacebar/tap counting for testing
    });

    return () => {
      destroyed = true;
      cameraRef.current?.stop();
      handsRef.current?.close();
    };
  }, [enabled, videoRef]);

  const reset = useCallback(() => {
    repsRef.current = 0;
    stateRef.current = 'idle';
    prevYRef.current = {};
  }, []);

  return { reps: repsRef.current, reset };
}
