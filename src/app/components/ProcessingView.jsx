import React, { useEffect, useRef } from 'react';

export default function ProcessingView({ 
  logs = [], 
  progress = 0, 
  statusText = "Transcribing audio...", 
  description = "Analyzing audio for epics, stories, and sub-tasks.", 
  phaseText = "Phase 1 of 3" 
}) {
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const formatLog = (text) => {
    if (text.startsWith("> Found Epic") || text.startsWith("> Found Story") || text.startsWith("> Found Subtask") || text.startsWith("> Found Task")) {
      const parts = text.split(": ");
      if (parts.length >= 2) {
        return (
          <div>
            <span className="text-primary font-bold">{parts[0]}:</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 ml-1">{parts.slice(1).join(": ")}</span>
          </div>
        );
      }
    }
    if (text.startsWith("- Extracting AC:")) {
      return (
        <div className="pl-4 border-l border-primary/10 ml-1 text-slate-400">
            {text}
        </div>
      );
    }
    return <span>{text}</span>;
  };

  return (
    <div className="flex-1 flex flex-col w-full relative h-full">
      {/* Header / Nav */}
      <header className="w-full flex items-center justify-between p-6 relative z-10 border-b border-primary/10 glass-panel">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 shadow-glow-primary">
            <span className="material-symbols-outlined text-primary text-[20px]">graphic_eq</span>
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">VoiceTicket <span className="text-primary/60 font-normal">Hub</span></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Engine Active</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row items-stretch relative z-10 w-full max-w-[1440px] mx-auto overflow-hidden">
        {/* Left/Center: Visualization & Status */}
        <section className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 relative">
          <div className="text-center mb-16 h-24 flex flex-col justify-end">
            <h1 className="font-display font-bold text-[32px] md:text-[40px] text-slate-100 leading-tight tracking-tight">
              {statusText}
            </h1>
            <p className="text-slate-400 font-body text-[15px] mt-2 h-6">{description}</p>
          </div>

          {/* Pipeline Visualization */}
          <div className="w-full max-w-2xl relative h-64 flex items-center justify-between px-8">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-primary/10 z-0"></div>
            
            {/* Moving Nodes - simulated with CSS classes */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-glow-primary z-20" style={{animation: 'move-node 3s linear infinite'}}></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-glow-primary z-20" style={{animation: 'move-node 3s linear infinite 1s'}}></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-glow-primary z-20" style={{animation: 'move-node 3s linear infinite 2s'}}></div>

            <div className="glass-panel w-24 h-24 rounded-xl flex flex-col items-center justify-center gap-2 relative z-30">
              <span className="material-symbols-outlined text-slate-400 text-[32px]">mic</span>
              <span className="font-bold text-[10px] text-slate-500 uppercase">Audio In</span>
            </div>
            <div className="w-32 h-32 bg-primary rounded-full border-4 border-primary/50 flex flex-col items-center justify-center gap-1 relative z-30 shadow-glow-primary">
              <span className="material-symbols-outlined text-background-dark text-[40px] animate-pulse">psychology</span>
              <span className="font-bold text-[10px] text-background-dark uppercase">AI Inference</span>
            </div>
            <div className="glass-panel w-24 h-24 rounded-xl flex flex-col items-center justify-center gap-2 relative z-30">
              <span className="material-symbols-outlined text-slate-400 text-[32px]">database</span>
              <span className="font-bold text-[10px] text-slate-500 uppercase">Entities</span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-16 w-full max-w-md flex flex-col gap-2">
            <div className="flex justify-between items-end mb-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {phaseText}
              </span>
              <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2.5 bg-primary/10 rounded-full overflow-hidden border border-primary/5">
              <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-300 relative" style={{width: `${progress}%`}}>
                <div className="absolute inset-0 bg-white/10 w-full" style={{animation: 'translateX 1s linear infinite'}}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Terminal Log */}
        <section className="w-full lg:w-[400px] xl:w-[480px] glass-panel border-l border-primary/10 flex flex-col relative">
          <div className="p-4 border-b border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">list_alt</span>
              <h2 className="font-display font-bold text-sm text-slate-100">Live Entity Log</h2>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary/10"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-primary/10"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-primary/40 shadow-glow-primary"></div>
            </div>
          </div>
          
          <div className="flex-1 p-6 font-mono text-[12px] leading-relaxed overflow-y-hidden flex flex-col justify-end relative h-full">
            <div className="absolute inset-x-6 bottom-6 top-6 overflow-y-auto flex flex-col flex-1 pb-4 no-scrollbar">
              <div className="mt-auto flex flex-col justify-end min-h-full">
                {logs.map((log, i) => (
                  <div key={i} className="animate-fade-in-up flex gap-3 text-slate-200 mb-3">
                    <span className="text-slate-500 opacity-50 shrink-0">[{log.time}]</span>
                    <div className="flex-1">{formatLog(log.text)}</div>
                  </div>
                ))}
                {progress < 100 && (
                  <div className="animate-fade-in-up flex gap-3 text-slate-200 mt-4">
                    <span className="text-slate-500 opacity-50 shrink-0">[{new Date().toTimeString().split(" ")[0]}]</span>
                    <span>&gt; Processing...<span className="bg-primary w-2 h-3 inline-block ml-1 align-middle" style={{animation: 'blink 1s step-end infinite'}}></span></span>
                  </div>
                )}
                <div ref={logEndRef} className="h-6" />
              </div>
            </div>
          </div>
          <div className="absolute top-[57px] left-0 right-0 h-12 bg-gradient-to-b from-background-dark to-transparent pointer-events-none opacity-50"></div>
        </section>
      </main>
      
      {/* Global CSS for component animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes move-node {
          0% { transform: translateX(-100%) scale(0.8); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(500%) scale(0.8); opacity: 0; }
        }
        @keyframes translateX {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}} />
    </div>
  );
}
