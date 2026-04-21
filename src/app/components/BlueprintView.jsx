import React, { useState, useEffect } from 'react';

export default function BlueprintView({ tickets, setTickets, onSync, onCancel }) {
  const [selectedPath, setSelectedPath] = useState(tickets.length > 0 ? "0" : null);
  const [editForm, setEditForm] = useState(null);

  const getSelectedItem = () => {
    if (!selectedPath) return null;
    const parts = selectedPath.split('-');
    if (parts.length === 1) return tickets[parts[0]];
    if (parts.length === 2) return tickets[parts[0]].subtasks[parts[1]];
    return null;
  };

  const selectedItem = getSelectedItem();

  useEffect(() => {
    if (selectedItem) {
      setEditForm({
        summary: selectedItem.summary || "",
        description: selectedItem.description || "",
        type: selectedItem.type || "Task",
        priority: selectedItem.priority || "Medium",
        acceptance_criteria: selectedItem.acceptance_criteria ? selectedItem.acceptance_criteria.join("\n") : ""
      });
    } else {
      setEditForm(null);
    }
  }, [selectedPath, tickets]);

  const saveEdit = (overrideForm = null) => {
    if (!selectedPath) return;
    const currentForm = overrideForm || editForm;
    const newTickets = [...tickets];
    const pathParts = selectedPath.split('-');
    
    // Safety check, in a real app this would strictly parse
    const acStr = currentForm.acceptance_criteria || "";
    const ac = acStr.split("\n").filter(a => a.trim().length > 0);
    
    const theItem = getSelectedItem();
    const updatedItem = { ...theItem, ...currentForm, acceptance_criteria: ac };

    if (pathParts.length === 1) {
       newTickets[pathParts[0]] = updatedItem;
    } else if (pathParts.length === 2) {
       const pIdx = pathParts[0];
       const sIdx = pathParts[1];
       const parent = { ...newTickets[pIdx] };
       const subs = [...parent.subtasks];
       subs[sIdx] = updatedItem;
       parent.subtasks = subs;
       newTickets[pIdx] = parent;
    }
    setTickets(newTickets);
  };

  // Auto-save on blur or explicitly
  const handleBlur = () => { saveEdit(); };

  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'epic': return 'castle';
      case 'story': return 'menu_book';
      default: return 'check_circle';
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden relative w-full h-screen bg-background-dark text-text-main">
      {/* Top Navigation overlaying the split */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between whitespace-nowrap border-b border-primary/20 bg-background-dark/80 backdrop-blur-md px-6 py-4 z-20 glass-panel h-16">
        <div className="flex items-center gap-3">
          <div className="size-6 text-primary drop-shadow-[0_0_8px_rgba(68,228,126,0.5)] flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">record_voice_over</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">VoiceTicket</h2>
          <span className="mx-2 text-primary/20">|</span>
          <span className="text-text-muted text-sm font-medium">Ticket Blueprint</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card">
            <div className="size-2 rounded-full bg-primary animate-pulse shadow-glow-active"></div>
            <span className="text-xs text-text-muted font-mono">Parsed: {tickets.length} Items</span>
          </div>
          <button onClick={onCancel} className="text-text-muted hover:text-white transition-colors p-2 rounded-md hover:bg-primary/10">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex flex-1 overflow-hidden relative pt-16 w-full">
        {/* Left Pane: Tree View (40%) */}
        <section className="w-[40%] min-w-[320px] max-w-[500px] border-r border-primary/10 bg-background-dark flex flex-col z-0">
          <div className="p-4 border-b border-primary/10 shrink-0 flex justify-between items-center bg-background-dark/95 z-10 sticky top-0">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Hierarchy</h3>
            <div className="flex gap-2">
              <button className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Expand All">
                <span className="material-symbols-outlined text-sm">unfold_more</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-24 relative space-y-4">
            {tickets.map((t, i) => (
              <div key={i} className="relative group/tree cursor-pointer">
                {i !== tickets.length - 1 && <div className="absolute left-[23px] top-[40px] bottom-[-16px] w-[1px] bg-gradient-to-b from-primary/30 to-primary/10 z-0"></div>}
                
                <div 
                  onClick={() => setSelectedPath(`${i}`)}
                  className={`flex items-center gap-3 p-2.5 rounded-md glass-card transition-colors relative z-10 ${selectedPath === `${i}` ? 'border-primary/60 bg-primary/10 shadow-glow-active' : 'border-primary/20 hover:border-primary/40'}`}
                >
                  <div className="flex items-center justify-center size-6 rounded bg-primary/20 text-primary shrink-0">
                    <span className="material-symbols-outlined text-sm">{getIcon(t.type)}</span>
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium truncate">{t.summary || "Untitled Epic"}</p>
                    <p className="text-xs text-text-muted font-mono mt-0.5">{t.type}</p>
                  </div>
                </div>

                {t.subtasks && t.subtasks.map((sub, j) => (
                  <div key={j} className="pl-8 relative mt-2">
                    <div className="absolute left-[-20px] top-[24px] w-[20px] h-[1px] bg-primary/30 z-0"></div>
                    {j !== t.subtasks.length - 1 && <div className="absolute left-[23px] top-[40px] bottom-[-16px] w-[1px] bg-gradient-to-b from-primary/30 to-primary/10 z-0"></div>}
                    <div 
                      onClick={(e) => { e.stopPropagation(); setSelectedPath(`${i}-${j}`); }}
                      className={`flex items-center gap-3 p-2 rounded-md transition-colors relative z-10 ${selectedPath === `${i}-${j}` ? 'bg-primary/20 shadow-glow-active border border-primary/30' : 'hover:bg-primary/10 border border-transparent'}`}
                    >
                      <div className="flex items-center justify-center size-4 rounded bg-primary/10 text-primary shrink-0">
                        <span className="material-symbols-outlined text-[10px]">{getIcon(sub.type)}</span>
                      </div>
                      <p className="text-sm truncate">{sub.summary || "Untitled Item"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Right Pane: Detail Editor (60%) */}
        <section className="flex-1 bg-background-dark/30 flex flex-col relative z-0 glass-panel">
          {selectedItem && editForm ? (
            <>
              <div className="p-4 border-b border-primary/10 shrink-0 flex justify-between items-center bg-background-dark/80 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                    <span className="material-symbols-outlined text-[14px]">edit_square</span>
                    <span className="text-xs font-semibold tracking-wide uppercase">Item Editor</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 pb-32">
                <div className="max-w-3xl mx-auto space-y-8">
                  {/* Title Input */}
                  <div>
                    <input 
                      className="w-full bg-transparent border-b border-primary/20 hover:border-primary/40 focus:border-primary focus:ring-0 px-0 py-2 text-3xl font-bold text-white outline-none transition-colors" 
                      placeholder="Ticket Title..." 
                      value={editForm.summary}
                      onChange={e => setEditForm({...editForm, summary: e.target.value})}
                      onBlur={handleBlur}
                    />
                  </div>
                  
                  {/* Metadata Row */}
                  <div className="flex flex-wrap gap-6 p-4 rounded-lg glass-card border-primary/10">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-primary uppercase tracking-wider">Type</label>
                      <select 
                        className="bg-background-dark/50 border border-primary/20 rounded px-3 py-1.5 text-sm outline-none focus:border-primary"
                        value={editForm.type}
                        onChange={e => {
                          const newForm = {...editForm, type: e.target.value};
                          setEditForm(newForm);
                          saveEdit(newForm);
                        }}
                      >
                        <option value="Epic">Epic</option>
                        <option value="Story">Story</option>
                        <option value="Task">Task</option>
                        <option value="Subtask">Subtask</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-primary uppercase tracking-wider">Priority</label>
                      <select 
                        className="bg-background-dark/50 border border-primary/20 rounded px-3 py-1.5 text-sm outline-none focus:border-primary"
                        value={editForm.priority}
                        onChange={e => {
                          const newForm = {...editForm, priority: e.target.value};
                          setEditForm(newForm);
                          saveEdit(newForm);
                        }}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  {/* Description Editor */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-primary flex justify-between items-end">
                      Description
                    </label>
                    <textarea 
                      className="w-full min-h-[150px] p-4 rounded-lg bg-background-dark/50 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary shadow-inner-edge transition-all outline-none resize-y text-sm text-slate-200"
                      value={editForm.description}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      onBlur={handleBlur}
                      placeholder="Write description here..."
                    />
                  </div>

                  {/* Acceptance Criteria Editor */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-primary flex justify-between items-end">
                      Acceptance Criteria (One per line)
                    </label>
                    <textarea 
                      className="w-full min-h-[150px] p-4 rounded-lg bg-background-dark/50 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary shadow-inner-edge transition-all outline-none resize-y text-sm text-slate-200"
                      value={editForm.acceptance_criteria}
                      onChange={e => setEditForm({...editForm, acceptance_criteria: e.target.value})}
                      onBlur={handleBlur}
                      placeholder="Given [context],\nWhen [action],\nThen [outcome]..."
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-primary/40 font-bold uppercase tracking-widest text-sm">
              Select an item to edit
            </div>
          )}
        </section>

        {/* Floating Action Button */}
        <div className="absolute bottom-6 right-6 z-50">
          <button 
            onClick={onSync}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-background-dark font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(68,228,126,0.3)] hover:brightness-110 hover:scale-[1.02] transition-all active:scale-95 group"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">rocket_launch</span>
            Sync to Jira
          </button>
        </div>
      </main>
    </div>
  );
}
