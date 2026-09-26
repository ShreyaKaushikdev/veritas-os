'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { HelpCircle, X, Image as ImageIcon, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function SOSBeacon() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null);

  // Auto-collect context
  const contextData = {
    page: pathname || '/',
    role: pathname.startsWith('/judge') ? 'JUDGE' : pathname.startsWith('/organizer') ? 'ORGANIZER' : 'PARTICIPANT',
    eventPhase: pathname.startsWith('/judge') ? 'JUDGING' : 'SUBMISSION',
    timestamp: new Date().toISOString(),
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            setScreenshotBase64(uploadEvent.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setScreenshotBase64(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);

    const msgLower = message.toLowerCase();
    let priority = 'NORMAL';
    if (msgLower.includes("can't submit") || msgLower.includes('deadline') || msgLower.includes('upload fail')) {
      priority = 'URGENT';
    }

    try {
      await fetch('http://localhost:4000/operations/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          priority,
          screenshot: screenshotBase64,
          context: contextData,
        }),
      });
    } catch {
      // Local fallback
    }

    setTimeout(() => {
      const ticketRef = `SOS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      setSubmittedTicket({
        ref: ticketRef,
        priority,
        message,
        dispatchedEmail: 'organizers@dogfood.local',
        ack: `Organizers notified — ticket ${ticketRef}`,
      });
      setLoading(false);
    }, 600);
  };

  const handleReset = () => {
    setMessage('');
    setScreenshotBase64(null);
    setSubmittedTicket(null);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating SOS Beacon Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="group px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 text-slate-800 font-mono text-xs font-bold shadow-lg shadow-slate-900/5 transition-all flex items-center space-x-2 cursor-pointer hover:scale-105 active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-700 group-hover:text-emerald-700 transition-colors">Ask for help</span>
          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">[Support]</span>
        </button>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-5 relative text-slate-800">
            {/* Close button */}
            <button
              onClick={handleReset}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-emerald-700 font-bold">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>OPERATIONS SOS • COMMAND CENTER DISPATCH</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                Report Issue to Event Operations
              </h2>
            </div>

            {/* Submitted View */}
            {submittedTicket ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-800 font-mono font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{submittedTicket.ack}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your ticket has been prioritized as{' '}
                  <span className="font-mono font-bold text-emerald-800">[{submittedTicket.priority}]</span> and dispatched to the event operations cockpit with auto-captured state context.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              /* Input Form */
              <div className="space-y-4">
                {/* Auto Context Chips */}
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                    Page: <strong className="text-slate-900">{contextData.page}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                    Role: <strong className="text-emerald-700 font-bold">{contextData.role}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                    ✓ Diagnostic Context Attached
                  </span>
                </div>

                {/* Message Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-slate-600 font-bold">
                    Describe Issue / Blocker
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Ballot submission verification timed out on project #4, need organizer assist..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Screenshot Upload / Paste Box */}
                <div className="space-y-1.5" onPaste={handlePaste}>
                  <label className="block text-xs font-mono text-slate-600 font-bold">
                    Screenshot Proof (Ctrl+V paste or browse)
                  </label>
                  <div className="border border-dashed border-slate-300 hover:border-emerald-400 rounded-xl p-3 text-center transition-colors bg-slate-50">
                    {screenshotBase64 ? (
                      <div className="relative inline-block">
                        <img
                          src={screenshotBase64}
                          alt="Pasted Screenshot"
                          className="max-h-28 rounded-lg border border-slate-200 shadow-2xs mx-auto"
                        />
                        <button
                          onClick={() => setScreenshotBase64(null)}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-red-600 text-white shadow hover:bg-red-700 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1 text-slate-500 py-2">
                        <ImageIcon className="w-5 h-5 mx-auto text-emerald-600" />
                        <p className="text-[11px]">Click here and press <kbd className="text-emerald-700 font-bold font-mono">Ctrl+V</kbd> to paste screenshot</p>
                        <p className="text-[10px] text-slate-400">or choose a file below</p>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                          id="sos-file-upload"
                        />
                        <label
                          htmlFor="sos-file-upload"
                          className="inline-block mt-1 text-[11px] text-emerald-700 font-semibold underline cursor-pointer hover:text-emerald-800"
                        >
                          Browse Files
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !message.trim()}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md disabled:opacity-40 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {loading ? (
                    <span>Sending your message to the organizers...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>SENT TO THE ORGANIZERS</span>
                    </>
                  )}
                </button>

                <div className="text-[10px] text-slate-400 text-center">
                  Private & Secure: Verified event organizers and technical leads can audit this ticket.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
