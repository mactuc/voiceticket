"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import CaptureView from "./components/CaptureView";
import ProcessingView from "./components/ProcessingView";
import BlueprintView from "./components/BlueprintView";
import JiraSyncModal from "./components/JiraSyncModal";
import { useAuth } from './components/AuthProvider';

export default function Home() {
  const [view, setView] = useState('dashboard');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartRef = useRef(null);
  const recordingDurationRef = useRef(0);
  const { fetchWithAuth } = useAuth();

  // Load sessions from backend on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await fetchWithAuth('/api/sessions');
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch (e) {
        console.error("Failed to load sessions:", e);
      }
    };
    loadSessions();
  }, [fetchWithAuth]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support audio recording, or you are not on a secure connection (HTTPS/localhost).");
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        recordingDurationRef.current = Date.now() - (recordingStartRef.current || Date.now());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setView('processing');
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      recordingStartRef.current = Date.now();
      return true;
    } catch (err) {
      console.error("Error accessing microphone:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Microphone access was denied. Please click the lock/site-info icon in your browser's address bar, allow microphone access, and reload the page.");
      } else if (err.name === 'NotFoundError') {
        alert("No microphone was found. Please connect a microphone and try again.");
      } else {
        alert("Could not access the microphone: " + err.message);
      }
      return false;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudio = async (blob) => {
    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.wav");

      // 1. Transcribe
      console.log("[VoiceTicket] Sending audio to /api/transcribe...");
      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      
      if (!transcribeRes.ok) {
        console.error("[VoiceTicket] Transcription failed:", transcribeRes.status);
        setTickets(getFallbackTickets("Transcription service unavailable."));
        return;
      }

      const transcribeData = await transcribeRes.json();
      const text = transcribeData.text;
      console.log("[VoiceTicket] Transcription:", text);

      if (!text || text.trim().length === 0) {
        console.warn("[VoiceTicket] Empty transcription received.");
        setTickets(getFallbackTickets("No speech detected in recording."));
        return;
      }
      
      // 2. Extract Tickets via LLM
      console.log("[VoiceTicket] Sending transcription to /api/extract-jira...");
      const extractRes = await fetch(`/api/extract-jira?transcription=${encodeURIComponent(text)}`, {
        method: "POST",
      });
      
      if (!extractRes.ok) {
        console.error("[VoiceTicket] Extraction failed:", extractRes.status);
        setTickets(getFallbackTickets(text));
        return;
      }

      const extractData = await extractRes.json();
      console.log("[VoiceTicket] Extraction response:", extractData);

      let finalTickets;
      if (extractData.status === "success" && Array.isArray(extractData.tickets) && extractData.tickets.length > 0) {
        console.log("[VoiceTicket] Using real extracted tickets:", extractData.tickets.length, "items");
        finalTickets = extractData.tickets;
      } else {
        console.warn("[VoiceTicket] Extraction returned no tickets, using transcription as single ticket.");
        finalTickets = getFallbackTickets(text);
      }
      setTickets(finalTickets);
      saveSession(finalTickets, text);
    } catch (error) {
      console.error("[VoiceTicket] Pipeline error:", error);
      setTickets(getFallbackTickets("Processing failed. Is the backend running?"));
    }
  };

  // Only used when backend is unreachable or returns no data
  const getFallbackTickets = (text) => {
    return [
      {
        type: "Story",
        summary: "Voice Capture Result",
        description: text,
        priority: "Medium",
        acceptance_criteria: [],
        subtasks: []
      }
    ];
  };

  const saveSession = useCallback((finalTickets, transcription) => {
    const totalTickets = finalTickets.reduce((acc, t) => acc + 1 + (t.subtasks ? t.subtasks.length : 0), 0);
    const durationMs = recordingDurationRef.current || 0;
    const firstSummary = finalTickets[0]?.summary || 'Voice Session';

    const session = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: firstSummary,
      timestamp: new Date().toISOString(),
      durationMs,
      ticketCount: totalTickets,
      tickets: finalTickets,
      transcription: transcription || '',
    };

    // Save to backend asynchronously, then update local state
    fetchWithAuth('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    }).catch(e => console.error("Failed to save session:", e));

    setSessions(prev => [session, ...prev]);
  }, [fetchWithAuth]);

  const handleProcessingComplete = () => {
    setView('blueprint');
  };

  const handleSync = () => {
    setShowSyncModal(true);
  };

  const handleReturn = () => {
    setShowSyncModal(false);
    setView('dashboard');
    setTickets([]);
  };

  const handleOpenSession = (session) => {
    setTickets(session.tickets);
    setView('blueprint');
  };

  const handleClearSessions = async () => {
    try {
      await fetchWithAuth('/api/sessions', { method: 'DELETE' });
    } catch(e) {
      console.error("Failed to clear sessions:", e);
    }
    setSessions([]);
  };

  return (
    <div className="flex bg-background-dark min-h-screen text-slate-100 font-body antialiased overflow-hidden selection:bg-primary/30 selection:text-primary">
      {/* Decorative Background */}
      <div className="bg-noise-overlay"></div>

      {view !== 'blueprint' && view !== 'capture' && view !== 'processing' && (
        <Sidebar setView={setView} />
      )}

      {view === 'dashboard' && <DashboardView onStartCapture={() => setView('capture')} sessions={sessions} onOpenSession={handleOpenSession} onClearSessions={handleClearSessions} />}
      {view === 'capture' && <CaptureView onStartCapture={startRecording} onStopCapture={stopRecording} />}
      {view === 'processing' && <ProcessingView onComplete={handleProcessingComplete} />}
      
      {view === 'blueprint' && (
        <BlueprintView 
          tickets={tickets} 
          setTickets={setTickets} 
          onSync={handleSync}
          onCancel={() => setView('dashboard')}
        />
      )}

      {showSyncModal && (
        <JiraSyncModal 
          count={tickets.reduce((acc, current) => acc + 1 + (current.subtasks ? current.subtasks.length : 0), 0)} 
          onReturn={handleReturn} 
        />
      )}
    </div>
  );
}
