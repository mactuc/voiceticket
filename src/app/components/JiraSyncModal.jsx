import React from 'react';

export default function JiraSyncModal({ count, keys, onReturn }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-md">
      {/* Decorative Background Elements */}
      <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
      </div>
      
      {/* Sync Complete Modal */}
      <div className="relative z-20 w-full max-w-lg mx-4">
        <div className="glass-panel rounded-xl p-10 flex flex-col items-center text-center relative overflow-hidden shadow-surface-drop">
          {/* Subtle internal gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
          
          {/* Pulsing Success Icon */}
          <div className="relative flex items-center justify-center w-24 h-24 mb-8">
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse shadow-glow-primary border border-primary/20"></div>
            <div className="relative w-16 h-16 bg-primary/20 border border-primary/40 rounded-full flex items-center justify-center">
              <span aria-hidden="true" className="material-symbols-outlined text-primary text-4xl font-bold">check</span>
            </div>
          </div>
          
          {/* Header Content */}
          <h1 className="font-display text-3xl font-bold text-slate-100 mb-3 tracking-tight">{count} Tickets Synced</h1>
          <p className="text-slate-400 text-[15px] mb-8 max-w-sm leading-relaxed">
            Your voice capture has been successfully parsed and pushed to Jira. The epic and all associated stories are now live.
          </p>
          
          {/* Generated Tags / Issue Keys */}
          <div className="w-full bg-black/20 rounded-lg p-6 mb-8 border border-primary/10">
            <div className="text-[11px] font-bold text-slate-500 mb-4 uppercase tracking-[0.2em] text-left opacity-70">Generated Issues</div>
            <div className="flex flex-wrap gap-3 justify-center">
              {keys && keys.length > 0 ? (
                <>
                  {keys.slice(0, 5).map((key, index) => (
                    <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 glass-panel hover:bg-primary/10 border border-primary/20 rounded-md transition-all">
                        <span className="material-symbols-outlined text-[16px] text-primary/80">
                          {index === 0 ? 'bolt' : index === 1 ? 'link' : 'task'}
                        </span>
                        <span className="font-mono text-[13px] text-primary font-medium">{key}</span>
                    </span>
                  ))}
                  {keys.length > 5 && (
                    <div className="inline-flex items-center px-3 py-1.5 text-slate-500 font-mono text-[13px] italic">
                        + {keys.length - 5} more
                    </div>
                  )}
                </>
              ) : (
                <div className="text-slate-500 text-sm italic">No issue keys returned</div>
              )}
            </div>
          </div>
          
          {/* Call to Action */}
          <button 
            onClick={onReturn}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-background-dark font-display font-bold text-base rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 glow-button"
          >
            <span>Return to Dashboard</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
