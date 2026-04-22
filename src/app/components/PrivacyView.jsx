import React from 'react';

export default function PrivacyView() {
  return (
    <div className="w-full h-screen overflow-y-auto flex flex-col items-center p-8 relative z-10">
      <div className="w-full max-w-3xl">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-display font-bold text-white mb-4 tracking-tight">Privacy Policy</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            How we collect, use, and protect your data.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-primary/20 shadow-2xl relative overflow-hidden text-slate-300 space-y-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10 space-y-6">
            <h3 className="text-xl font-bold text-white">Information We Collect</h3>
            <p>
              We collect information you provide directly to us, such as your email address, name, and profile picture when you sign in via Google. We also temporarily process the audio data you record to generate transcripts.
            </p>

            <h3 className="text-xl font-bold text-white">How We Use Information</h3>
            <p>
              We use the information we collect to provide, maintain, and improve our services, to process your voice recordings into structured tickets, and to sync them with your linked third-party services like Jira.
            </p>

            <h3 className="text-xl font-bold text-white">Audio Processing</h3>
            <p>
              Your voice recordings are processed by our backend for transcription and analysis. Audio files are not permanently stored and are discarded after processing is complete. Transcripts and generated tickets are saved to your session history.
            </p>

            <h3 className="text-xl font-bold text-white">Third-Party Services</h3>
            <p>
              If you choose to integrate with services like Atlassian Jira, we store the OAuth tokens required to communicate with those services on your behalf. We only request the scopes necessary to perform the syncing actions you request.
            </p>

            <h3 className="text-xl font-bold text-white">Data Security</h3>
            <p>
              We implement reasonable security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
