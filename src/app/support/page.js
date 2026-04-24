"use client";

import React from 'react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="w-full h-full bg-background-dark text-slate-100 font-body antialiased selection:bg-primary/30 selection:text-primary p-8 flex flex-col relative z-10">
      <div className="bg-noise-overlay"></div>
      
      <div className="w-full max-w-3xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors mb-8 font-medium">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back to Dashboard
        </Link>

        <div className="mb-10 text-center">
          <h2 className="text-4xl font-display font-bold text-white mb-4 tracking-tight">Customer Support</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Need help with VoiceTicket? We're here for you.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-primary/20 shadow-2xl relative overflow-hidden text-slate-300 space-y-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10 space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">contact_support</span>
                Contact Us
              </h3>
              <p className="mb-4">
                If you have any questions, encounter bugs, or need assistance setting up your Jira integration, please reach out to our support team.
              </p>
              <a href="mailto:support@voiceticket.com" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-background-dark font-bold hover:brightness-110 transition-all">
                <span className="material-symbols-outlined">mail</span>
                Email Support
              </a>
            </div>

            <div className="h-px w-full bg-primary/10 my-4"></div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">library_books</span>
                Frequently Asked Questions
              </h3>
              
              <div className="space-y-4">
                <div className="bg-background-dark/50 p-4 rounded-xl border border-primary/10">
                  <h4 className="text-white font-bold mb-2">How does VoiceTicket extract tickets?</h4>
                  <p className="text-sm">We use an advanced LLM (Claude-3-haiku via OpenRouter) to analyze the transcript of your audio recording, identifying project epics, stories, tasks, subtasks, and their respective acceptance criteria.</p>
                </div>
                
                <div className="bg-background-dark/50 p-4 rounded-xl border border-primary/10">
                  <h4 className="text-white font-bold mb-2">My Jira integration is failing. What should I check?</h4>
                  <p className="text-sm">Ensure that you have completed the OAuth setup in the Settings page. If syncing fails, your Jira project key might not be set correctly, or the user you authenticated as does not have permission to create issues in the selected project.</p>
                </div>

                <div className="bg-background-dark/50 p-4 rounded-xl border border-primary/10">
                  <h4 className="text-white font-bold mb-2">Is my audio recording saved?</h4>
                  <p className="text-sm">No. Audio recordings are immediately sent to the transcription service and discarded from our servers once the transcription is complete.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
