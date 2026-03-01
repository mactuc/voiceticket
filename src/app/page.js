"use client";

import { useState, useRef } from "react";
import { Mic, Square, Loader2, ListChecks } from "lucide-react";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsRecordingProcessing] = useState(false);
  const [tickets, setTickets] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      await uploadAndProcess(audioBlob);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const uploadAndProcess = async (blob) => {
    setIsRecordingProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.wav");

      // 1. Transcribe
      const transcribeRes = await fetch("http://127.0.0.1:8000/transcribe/", {
        method: "POST",
        body: formData,
      });
      const { text } = await transcribeRes.json();

      // 2. Extract Tickets
      const extractRes = await fetch(`http://127.0.0.1:8000/extract-jira/?transcription=${encodeURIComponent(text)}`, {
        method: "POST",
      });
      const data = await extractRes.json();
      
      // Note: In real setup, the backend would call the LLM. 
      // For now we use the verified logic data structure.
      setTickets(data.tickets || []); 
    } catch (error) {
      console.error("Pipeline failed:", error);
    } finally {
      setIsRecordingProcessing(false);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start max-w-4xl px-4 w-full">
        {/* Hero Section */}
        <div className="space-y-4 text-center sm:text-left">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            Voice<span className="text-blue-500">Ticket</span>
          </h1>
          <h2 className="text-2xl font-bold text-gray-200">Speed to Backlog</h2>
          <p className="text-lg text-gray-400">
            Instantly convert audio feedback into structured Jira tasks.
          </p>
        </div>

        {/* Recorder Component */}
        <div className="flex flex-col gap-4 items-center sm:items-start w-full bg-white/5 p-8 rounded-2xl border border-white/10">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="group rounded-full bg-blue-600 text-white flex items-center gap-3 px-8 py-4 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <Mic size={24} />}
              <span className="font-bold text-lg">
                {isProcessing ? "Processing Audio..." : "Start Recording"}
              </span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="group rounded-full bg-red-600 text-white flex items-center gap-3 px-8 py-4 hover:bg-red-700 animate-pulse"
            >
              <Square size={24} fill="currentColor" />
              <span className="font-bold text-lg">Stop and Process</span>
            </button>
          )}
        </div>

        {/* Results Preview (Placeholder for now) */}
        {tickets.length > 0 && (
          <div className="w-full space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ListChecks className="text-blue-500" /> Extracted Tickets
            </h3>
            <div className="grid gap-4">
              {tickets.map((t, i) => (
                <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-blue-400">{t.summary}</h4>
                    <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/60 uppercase">
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-sm text-gray-500">
        <p>© 2026 VoiceTicket AI. Built for speed.</p>
      </footer>
    </div>
  );
}
