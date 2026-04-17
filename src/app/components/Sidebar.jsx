import React from 'react';

export default function Sidebar({ setView }) {
  return (
    <aside className="w-[280px] h-screen glass-panel border-r border-primary/10 flex flex-col justify-between py-8 px-6 z-10 shrink-0">
      <div className="flex flex-col gap-10">
        {/* Brand */}
        <div className="px-2">
          <h1 className="font-display font-bold text-xl tracking-tight text-white flex items-center gap-3">
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-background-dark">
              <span className="material-symbols-outlined text-[20px] font-bold">mic</span>
            </div>
            VoiceTicket
          </h1>
          <p className="text-[10px] text-primary/70 uppercase tracking-widest mt-1 ml-11 font-bold">Soft Tech Mint Edition</p>
        </div>
        {/* Nav Links */}
        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setView('dashboard')} 
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/20 text-primary font-semibold border border-primary/20 transition-all shadow-inner-edge w-full text-left"
          >
            <span className="material-symbols-outlined text-[22px]">dashboard</span>
            <span className="text-sm">Dashboard</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 font-medium transition-colors cursor-not-allowed w-full text-left">
            <span className="material-symbols-outlined text-[22px]">library_books</span>
            <span className="text-sm">Templates</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 font-medium transition-colors cursor-not-allowed w-full text-left">
            <span className="material-symbols-outlined text-[22px]">settings</span>
            <span className="text-sm">Settings</span>
          </button>
        </nav>
      </div>
      {/* Integration Status Widget */}
      <div className="flex flex-col gap-1 mt-auto">
        <div className="flex items-center gap-3 px-4 py-4 rounded-xl glass-panel border border-primary/10">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </div>
          <div className="flex flex-col">
            <p className="text-white text-xs font-bold">Connected</p>
            <p className="text-slate-400 text-[11px]">Acme Corp Jira</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
