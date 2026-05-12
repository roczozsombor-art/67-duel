import React, { useEffect, useRef } from 'react';

export default function VideoFeed({ stream, muted = false, label, mirror = false, className = '' }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative rounded-xl overflow-hidden neon-border-cyan ${className}`}
      style={{ background: '#0a0a0f' }}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center gap-3 opacity-30">
            <div className="text-4xl">📷</div>
            <span className="text-xs font-mono uppercase tracking-widest">No Signal</span>
          </div>
        </div>
      )}
      {label && (
        <div className="absolute bottom-2 left-2 glass rounded px-2 py-0.5">
          <span className="text-xs font-mono text-neon-cyan">{label}</span>
        </div>
      )}
    </div>
  );
}

export { VideoFeed };
export const VideoFeedRef = React.forwardRef(({ stream, muted = false, label, mirror = false, className = '' }, ref) => {
  useEffect(() => {
    if (ref?.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream, ref]);

  return (
    <div className={`relative rounded-xl overflow-hidden neon-border-cyan ${className}`}
      style={{ background: '#0a0a0f' }}>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
      />
      {label && (
        <div className="absolute bottom-2 left-2 glass rounded px-2 py-0.5">
          <span className="text-xs font-mono text-neon-cyan">{label}</span>
        </div>
      )}
    </div>
  );
});
