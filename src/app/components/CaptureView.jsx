import React, { useState, useEffect } from 'react';

export default function CaptureView({ onStartCapture, onStopCapture }) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 10); // deciseconds
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStart = async () => {
    const success = await onStartCapture();
    if (success) {
      setIsRecording(true);
    }
  };

  const handleStop = () => {
    setIsRecording(false);
    onStopCapture();
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const deciseconds = Math.floor((ms % 1000) / 100);
    return { main: `${minutes}:${seconds}`, fraction: `.${deciseconds}` };
  };

  const { main, fraction } = formatTime(elapsed * 10); // since interval is 100ms

  return (
    <div className="flex-1 flex flex-col items-center justify-center overflow-hidden antialiased bg-background-dark text-slate-100 relative w-full">
      <div className="absolute top-8 left-8 flex items-center gap-2 text-primary/70">
        <span className="material-symbols-outlined text-xl">mic_external_on</span>
        <span className="font-display font-semibold tracking-wide uppercase text-sm">Capture Studio</span>
      </div>

      <main className="w-full max-w-3xl px-6 flex flex-col items-center justify-center relative z-10 gap-12">
        {/* Header / Status */}
        <div className="flex flex-col items-center gap-3">
          <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border ${isRecording ? 'glass-panel border-primary/20' : 'bg-primary/5 text-primary/50 border-primary/10'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-record animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-primary/30'}`}></div>
            <span className={`font-display font-bold text-[10px] tracking-widest uppercase ${isRecording ? 'text-record' : 'text-primary/50'}`}>
              {isRecording ? 'Recording Active' : 'Ready to Record'}
            </span>
          </div>
          <div className="font-mono text-6xl font-light tracking-tight text-white drop-shadow-[0_0_15px_rgba(68,228,126,0.2)]">
            {main}<span className="text-primary/30">{fraction}</span>
          </div>
        </div>

        {/* Waveform Visualizer */}
        <div className="relative w-full max-w-[450px] h-36 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/5 blur-[60px] rounded-full mix-blend-screen pointer-events-none"></div>
          <div className="flex items-center justify-center gap-2 h-full w-full shadow-neon-mint rounded-full px-8 glass-panel border border-primary/20">
            {[4, 12, 8, 16, 10, 20, 14, 24, 12, 18, 8, 16, 6, 10, 4, 8].map((h, i) => (
              <div 
                key={i} 
                className={`w-2 bg-primary rounded-full shadow-glow-primary ${isRecording ? 'animate-waveform' : 'opacity-30'}`} 
                style={{ 
                  height: isRecording ? `${h * 4}px` : '4px', 
                  animationDelay: isRecording ? `${(i % 5) * 0.2}s` : '0s',
                  transition: 'height 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Live Transcript Window */}
        <div className="w-full max-w-2xl h-48 relative overflow-hidden flex flex-col justify-end pb-8" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 40%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 40%)' }}>
          <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-background-dark to-transparent z-10 pointer-events-none"></div>
          <div className="flex flex-col gap-3 font-display text-xl md:text-2xl leading-relaxed text-center px-4">
            {isRecording ? (
              <>
                <p className="animate-fade-in-up text-primary/30" style={{ animationDelay: '0s' }}>
                  Let's create a new Epic for the User Authentication overhaul.
                </p>
                <p className="animate-fade-in-up text-primary/60" style={{ animationDelay: '1.5s' }}>
                  We need a story for social login via Google and GitHub.
                </p>
                <p className="animate-fade-in-up text-white font-medium drop-shadow-md" style={{ animationDelay: '3s' }}>
                  Make sure to include a subtask for updating the database schema to handle...<span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse"></span>
                </p>
              </>
            ) : (
              <p className="text-primary/40 font-medium">Click the microphone to begin dictation.</p>
            )}
          </div>
        </div>
      </main>

      {/* Controls */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20 glass-panel p-3 rounded-pill border border-primary/20 shadow-2xl">
        <button className="w-12 h-12 rounded-full glass-panel text-primary flex items-center justify-center hover:bg-primary/20 transition-colors active:scale-95">
          <span className="material-symbols-outlined text-2xl">pause</span>
        </button>
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/40 rounded-full blur-xl group-hover:bg-primary/60 transition-all duration-500"></div>
          {isRecording ? (
            <button 
              onClick={handleStop}
              className="relative w-16 h-16 rounded-full bg-record text-white flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95"
            >
              <span className="material-symbols-outlined text-3xl font-bold">stop</span>
            </button>
          ) : (
            <button 
              onClick={handleStart}
              className="relative w-16 h-16 rounded-full bg-primary text-background-dark flex items-center justify-center hover:scale-105 transition-all shadow-glow-primary active:scale-95"
            >
              <span className="material-symbols-outlined text-3xl font-bold">mic</span>
            </button>
          )}
        </div>
        <button className="w-12 h-12 rounded-full glass-panel text-primary/60 hover:text-primary flex items-center justify-center hover:bg-primary/20 transition-colors active:scale-95">
          <span className="material-symbols-outlined text-xl">settings_voice</span>
        </button>
      </div>

      {/* Quick Footer/Shortcuts */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest pointer-events-none">
        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-primary/20 glass-panel">Space</kbd> Pause</span>
        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-primary/20 glass-panel">Enter</kbd> Stop</span>
      </div>
    </div>
  );
}
