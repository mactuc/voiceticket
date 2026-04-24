import React from 'react';

function formatRelativeTime(isoString) {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s audio`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec}s audio`;
}

export default function DashboardView({ onStartCapture, sessions = [], onOpenSession, onClearSessions }) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto relative z-10 w-full">
      {/* Top Heavy Header Area */}
      <header className="w-full pt-20 pb-16 flex flex-col items-center justify-center border-b border-primary/5 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
        {/* Hero Capture Button */}
        <button 
          onClick={onStartCapture} 
          className="glow-button group relative flex w-[340px] h-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary text-background-dark gap-3 transition-all hover:scale-105 active:scale-100"
        >
          <span className="material-symbols-outlined text-[32px] font-bold group-hover:scale-110 transition-transform">mic</span>
          <span className="font-display text-xl font-bold tracking-tight">Start Voice Capture</span>
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        </button>
        <p className="mt-6 text-slate-400 text-sm font-medium">Click to begin dictation.</p>
      </header>
      
      {/* Content Section */}
      <section className="flex-1 w-full max-w-6xl mx-auto px-10 py-12">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-display text-2xl font-bold text-white tracking-tight">Recent Sessions</h2>
          {sessions.length > 0 && (
            <button onClick={onClearSessions} className="text-sm text-text-muted hover:text-record font-bold transition-colors flex items-center gap-1">
              Clear all <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            </button>
          )}
        </div>
        
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center border border-primary/10 mb-6">
              <span className="material-symbols-outlined text-4xl text-primary/30">mic_off</span>
            </div>
            <h3 className="font-display text-lg font-bold text-slate-300 mb-2">No sessions yet</h3>
            <p className="text-slate-500 text-sm max-w-sm">
              Start a voice capture to create your first session. Your recordings will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sessions.map((session) => (
              <SessionCard 
                key={session.id}
                title={session.title}
                time={formatRelativeTime(session.timestamp)}
                duration={formatDuration(session.durationMs)}
                tickets={`${session.ticketCount} ticket${session.ticketCount !== 1 ? 's' : ''}`}
                onClick={() => onOpenSession(session)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SessionCard({ title, time, duration, tickets, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="group flex flex-col glass-panel rounded-xl p-6 min-h-[140px] border border-primary/10 hover:border-primary/40 transition-all hover:-translate-y-1 cursor-pointer relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-display text-lg font-bold text-slate-100 group-hover:text-primary transition-colors pr-2 line-clamp-2">{title}</h3>
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md uppercase whitespace-nowrap shrink-0">{time}</span>
      </div>
      <div className="mt-auto flex items-center gap-5 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          <span className="font-medium">{duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary/70">account_tree</span>
          <span className="text-slate-200 font-medium">{tickets}</span>
        </div>
      </div>
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </div>
  );
}
