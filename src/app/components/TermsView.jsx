import React from 'react';

export default function TermsView() {
  return (
    <div className="w-full h-screen overflow-y-auto flex flex-col items-center p-8 relative z-10">
      <div className="w-full max-w-3xl">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-display font-bold text-white mb-4 tracking-tight">Terms of Service</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Please read these terms carefully before using VoiceTicket.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-primary/20 shadow-2xl relative overflow-hidden text-slate-300 space-y-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10 space-y-6">
            <h3 className="text-xl font-bold text-white">1. Acceptance of Terms</h3>
            <p>
              By accessing and using VoiceTicket, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h3 className="text-xl font-bold text-white">2. Description of Service</h3>
            <p>
              VoiceTicket provides an AI-powered voice-to-ticket conversion tool. We reserve the right to modify or discontinue the service with or without notice to you.
            </p>

            <h3 className="text-xl font-bold text-white">3. User Conduct</h3>
            <p>
              You agree to use VoiceTicket only for lawful purposes. You are solely responsible for the knowledge and adherence to any and all laws, rules, and regulations pertaining to your use of the services.
            </p>

            <h3 className="text-xl font-bold text-white">4. Data and Privacy</h3>
            <p>
              Your data is processed to provide the VoiceTicket services. Please review our Privacy Policy to understand how we collect, use, and protect your information.
            </p>

            <h3 className="text-xl font-bold text-white">5. Limitation of Liability</h3>
            <p>
              VoiceTicket shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
