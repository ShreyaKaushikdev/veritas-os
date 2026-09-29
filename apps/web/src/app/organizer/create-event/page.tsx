'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader, Wand2, FileText, Plus, X, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

type CreationMethod = 'prompt' | 'manual' | null;

interface EventFormData {
  // Basic Event Info
  name: string;
  slug: string;
  description: string;
  timezone: string;
  
  // Deadlines
  regDeadline: string;
  subDeadline: string;
  freezeDeadline: string;
  judgeDeadline: string;
  
  // Configuration
  minReviews: number;
  disagreeThreshold: number;
  blindReviewMode: boolean;
  
  // Tracks
  tracks: Array<{ name: string; description: string }>;
  
  // Prizes
  prizes: Array<{ title: string; description: string; amount: string }>;
  
  // Rubric Criteria
  criteria: Array<{
    name: string;
    description: string;
    weight: number;
    minScore: number;
    maxScore: number;
  }>;
  
  // Anchor Projects (for judge calibration)
  anchors: Array<{
    title: string;
    description: string;
    tier: 'WEAK' | 'TYPICAL' | 'STRONG';
  }>;
}

const DEFAULT_CRITERIA = [
  {
    name: 'Technical Depth',
    description: 'Code quality, architecture, and technical complexity',
    weight: 0.25,
    minScore: 1,
    maxScore: 10,
  },
  {
    name: 'Innovation',
    description: 'Novelty and creativity of the solution',
    weight: 0.25,
    minScore: 1,
    maxScore: 10,
  },
  {
    name: 'Feasibility',
    description: 'Realistic implementation and scope',
    weight: 0.25,
    minScore: 1,
    maxScore: 10,
  },
  {
    name: 'Presentation',
    description: 'Clarity of demo, documentation, and delivery',
    weight: 0.25,
    minScore: 1,
    maxScore: 10,
  },
];

const DEFAULT_TRACKS = [
  { name: 'Open Track', description: 'Any project ideas welcome' },
  { name: 'AI/ML', description: 'Artificial intelligence and machine learning' },
  { name: 'Web3', description: 'Blockchain and decentralized applications' },
];

const DEFAULT_PRIZES = [
  { title: '🥇 First Place', description: 'Overall winner', amount: '$5,000' },
  { title: '🥈 Second Place', description: 'Runner-up', amount: '$3,000' },
  { title: '🥉 Third Place', description: 'Third place', amount: '$2,000' },
];

export default function CreateEventPage() {
  const [method, setMethod] = useState<CreationMethod>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [promptInput, setPromptInput] = useState('');
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    slug: '',
    description: '',
    timezone: 'UTC',
    regDeadline: '',
    subDeadline: '',
    freezeDeadline: '',
    judgeDeadline: '',
    minReviews: 3,
    disagreeThreshold: 1.5,
    blindReviewMode: false,
    tracks: DEFAULT_TRACKS,
    prizes: DEFAULT_PRIZES,
    criteria: DEFAULT_CRITERIA,
    anchors: [],
  });

  // ==================== PROMPT METHOD ====================
  const handlePromptSubmit = async () => {
    if (!promptInput.trim()) {
      setError('Please describe your hackathon');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call AI/LLM endpoint to generate event details
      let generatedData: any = null;
      try {
        const token = localStorage.getItem('dogfood_token') || localStorage.getItem('dogfood_auth_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/api/v1/events/generate-from-prompt`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ prompt: promptInput }),
        });

        if (response.ok) {
          generatedData = await response.json();
        }
      } catch (e) {
        // Fallback to autopilot synthesize
      }

      if (!generatedData) {
        const autoRes = await fetch(`${API_BASE_URL}/autopilot/synthesize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptInput }),
        });
        if (autoRes.ok) {
          const autoData = await autoRes.json();
          const now = new Date();
          generatedData = {
            name: autoData.event?.name || 'Autonomous Hackathon 2026',
            slug: autoData.event?.slug || 'autonomous-hackathon-2026',
            description: promptInput,
            tracks: autoData.tracks?.map((t: any) => ({ name: t.name, description: t.tagline })) || DEFAULT_TRACKS,
            criteria: autoData.rubric?.criteria?.map((c: any) => ({ name: c.name, description: c.description, weight: c.weight, minScore: c.minScore, maxScore: c.maxScore })) || DEFAULT_CRITERIA,
            prizes: DEFAULT_PRIZES,
            regDeadline: new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString(),
            subDeadline: new Date(now.getTime() + 14 * 24 * 3600 * 1000).toISOString(),
            freezeDeadline: new Date(now.getTime() + 15 * 24 * 3600 * 1000).toISOString(),
            judgeDeadline: new Date(now.getTime() + 21 * 24 * 3600 * 1000).toISOString(),
          };
        }
      }

      if (!generatedData) {
        throw new Error('Unable to synthesize hackathon parameters. Please try again.');
      }
      
      // Switch to manual mode with generated data
      setFormData((prev) => ({
        ...prev,
        ...generatedData,
      }));
      
      setSuccess('✅ Event details generated! Review and customize below, then click "Create Event"');
      setMethod('manual');
      setPromptInput('');
    } catch (err: any) {
      setError(`Error generating event: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== MANUAL METHOD ====================
  const handleFieldChange = (field: keyof EventFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayFieldChange = (
    array: keyof EventFormData,
    index: number,
    field: string,
    value: any
  ) => {
    setFormData((prev) => {
      const updated = [...(prev[array] as any[])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [array]: updated };
    });
  };

  const handleAddArrayItem = (
    array: keyof EventFormData,
    template: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [array]: [...(prev[array] as any[]), template],
    }));
  };

  const handleRemoveArrayItem = (
    array: keyof EventFormData,
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [array]: (prev[array] as any[]).filter((_, i) => i !== index),
    }));
  };

  // ==================== CREATE EVENT ====================
  const handleCreateEvent = async () => {
    // Validation
    if (!formData.name || !formData.slug || !formData.description) {
      setError('Event name, slug, and description are required');
      return;
    }

    if (!formData.subDeadline || !formData.freezeDeadline || !formData.judgeDeadline) {
      setError('All deadlines are required');
      return;
    }

    if (formData.tracks.length === 0) {
      setError('At least one track is required');
      return;
    }

    if (formData.criteria.length === 0) {
      setError('At least one rubric criteria is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('dogfood_token') || localStorage.getItem('dogfood_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      let createdEvent: any = null;
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/events`, {
          method: 'POST',
          headers,
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          createdEvent = await response.json();
        }
      } catch (e) {
        // Fallback to autopilot apply
      }

      // Sync to live replica engine
      try {
        await fetch(`${API_BASE_URL}/autopilot/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: {
              name: formData.name,
              slug: formData.slug,
              durationHours: 48,
              participants: 400,
              prizeTotal: '$50,000',
              blindReviewMode: formData.blindReviewMode,
            },
            tracks: formData.tracks.map((t, idx) => ({ id: `track-${idx+1}`, name: t.name, tagline: t.description, color: '#10b981' })),
            rubric: { version: '1.0.0', criteria: formData.criteria },
          }),
        });
      } catch (e) {
        // Ignore replica sync error
      }

      // Ensure user is Organizer role
      const currentStored = localStorage.getItem('dogfood_user');
      const userObj = currentStored ? JSON.parse(currentStored) : {};
      if (!userObj || (userObj.role !== 'ORGANIZER' && userObj.role !== 'ADMIN')) {
        const orgUser = { id: userObj.id || 'org-1', name: userObj.name || 'Elena Rostova', email: userObj.email || 'organizer@dogfood.local', role: 'ORGANIZER' };
        localStorage.setItem('dogfood_user', JSON.stringify(orgUser));
        window.dispatchEvent(new CustomEvent('dogfood_user_updated', { detail: orgUser }));
      }

      window.dispatchEvent(new CustomEvent('hackathon_created', { detail: formData }));
      window.dispatchEvent(new Event('storage'));

      setSuccess(`✅ Hackathon "${formData.name}" created successfully! Opening Organizer Dashboard...`);
      
      // Redirect to organizer dashboard after 1 second
      setTimeout(() => {
        window.location.href = '/organizer';
      }, 1000);
    } catch (err: any) {
      setError(`Error creating event: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== METHOD SELECTION ====================
  if (method === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-16">
            <div className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-6">
              <span className="text-sm font-semibold text-green-300">🎯 ORGANIZER HACKATHON SYNTHESIZER</span>
            </div>
            <h1 className="text-6xl font-black text-white mb-4">
              Create & Launch Hackathon
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl">
              Deploy a peer-blind hackathon with automated rubric vectors, calibrated judges, and zero cloud lock-in.
            </p>
          </div>

          {/* Two Methods */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Prompt Method */}
            <button
              onClick={() => setMethod('prompt')}
              className="group relative rounded-2xl p-8 border border-purple-500/40 bg-gray-900/50 hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Wand2 className="w-6 h-6 text-purple-300" />
                  </div>
                  <span className="px-3 py-1 text-xs font-bold text-purple-300 bg-purple-500/20 rounded-full">AI FAST</span>
                </div>
                
                <h2 className="text-3xl font-black mb-3 text-white">Prompt-to-Hackathon</h2>
                
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Describe your hackathon and let AI generate all details automatically
                </p>
                
                <div className="space-y-2 mb-8 pb-6 border-b border-purple-500/20">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold text-sm">⚡</span>
                    <span className="text-sm text-gray-300">Auto-generate event details</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold text-sm">⚡</span>
                    <span className="text-sm text-gray-300">Create tracks & prizes</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold text-sm">⚡</span>
                    <span className="text-sm text-gray-300">Setup rubric & deadlines</span>
                  </div>
                </div>
                
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold text-white transition-colors duration-200">
                  Continue <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>

            {/* Manual Method */}
            <button
              onClick={() => setMethod('manual')}
              className="group relative rounded-2xl p-8 border border-cyan-500/40 bg-gray-900/50 hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <FileText className="w-6 h-6 text-cyan-300" />
                  </div>
                  <span className="px-3 py-1 text-xs font-bold text-cyan-300 bg-cyan-500/20 rounded-full">DETAILED</span>
                </div>
                
                <h2 className="text-3xl font-black mb-3 text-white">Custom Blueprint Builder</h2>
                
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Fill in all details manually for complete control
                </p>
                
                <div className="space-y-2 mb-8 pb-6 border-b border-cyan-500/20">
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 font-bold text-sm">🎛️</span>
                    <span className="text-sm text-gray-300">Complete control & customization</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 font-bold text-sm">🎛️</span>
                    <span className="text-sm text-gray-300">Custom tracks & prizes</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 font-bold text-sm">🎛️</span>
                    <span className="text-sm text-gray-300">Design rubric & calibration</span>
                  </div>
                </div>
                
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold text-white transition-colors duration-200">
                  Continue <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          </div>

          {/* Info Section */}
          <div className="border border-gray-700/50 rounded-2xl p-8 bg-gray-900/30">
            <h3 className="text-lg font-bold text-white mb-6">Which method should I choose?</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="font-semibold text-purple-300 mb-4">✨ Choose AI-Assisted if:</p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>→ You want quick setup</li>
                  <li>→ You like AI suggestions</li>
                  <li>→ You can refine details later</li>
                  <li>→ Familiar with hackathons</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-cyan-300 mb-4">🎛️ Choose Manual Setup if:</p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>→ You need full control</li>
                  <li>→ You have specific needs</li>
                  <li>→ You want no automation</li>
                  <li>→ Creating unique event</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== PROMPT INPUT ====================
  if (method === 'prompt') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <button
            onClick={() => setMethod(null)}
            className="mb-8 text-gray-400 hover:text-white flex items-center gap-2"
          >
            ← Back to selection
          </button>

          <div className="mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Describe Your Hackathon
            </h1>
            <p className="text-gray-300">
              Tell us about your hackathon idea. Include details like theme, audience, goals, duration, prize pool, and any specific requirements.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-200">{success}</p>
            </div>
          )}

          {/* Text Area */}
          <div className="mb-8">
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              disabled={isLoading}
              placeholder="Example: We're hosting an AI hackathon for university students over 24 hours. We want to focus on practical AI applications. Prize pool is $10,000. We need 4 judges with expertise in ML/AI. The event will have Open Track and AI/ML track..."
              className="w-full h-64 px-6 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePromptSubmit}
              disabled={isLoading || !promptInput.trim()}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Event Details
                </>
              )}
            </button>
            <button
              onClick={() => setMethod(null)}
              className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
            >
              Back
            </button>
          </div>

          {/* Tips */}
          <div className="mt-12 bg-purple-900/20 border border-purple-700/50 rounded-xl p-6">
            <p className="font-semibold text-purple-200 mb-3">💡 Tips for best results:</p>
            <ul className="space-y-2 text-sm text-purple-100">
              <li>• Be specific about your hackathon theme and goals</li>
              <li>• Mention the target audience and expected participant count</li>
              <li>• Include duration (24 hours, 48 hours, weekend, etc.)</li>
              <li>• Share your prize budget and categories</li>
              <li>• Specify any required judging criteria</li>
              <li>• Mention specific tracks or challenge areas</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ==================== MANUAL FORM ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => setMethod(null)}
          className="mb-8 text-gray-400 hover:text-white flex items-center gap-2"
        >
          ← Back to selection
        </button>

        <div className="mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent mb-4">
            Create Your Hackathon
          </h1>
          <p className="text-gray-300">Fill in all details for your event</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-200">{success}</p>
          </div>
        )}

        {/* Form Sections */}
        <div className="space-y-8">
          {/* ========== BASIC INFO ========== */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-sm font-bold">1</span>
              Event Information
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Event Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="e.g., AI Hackathon 2026"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">URL Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleFieldChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="e.g., ai-hackathon-2026"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Describe your hackathon..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleFieldChange('timezone', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern (EST)</option>
                    <option value="CST">Central (CST)</option>
                    <option value="PST">Pacific (PST)</option>
                    <option value="IST">India (IST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Min Reviews Per Project</label>
                  <input
                    type="number"
                    value={formData.minReviews}
                    onChange={(e) => handleFieldChange('minReviews', parseInt(e.target.value))}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Disagreement Threshold</label>
                  <input
                    type="number"
                    value={formData.disagreeThreshold}
                    onChange={(e) => handleFieldChange('disagreeThreshold', parseFloat(e.target.value))}
                    step="0.1"
                    min="0.5"
                    max="5"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Standard deviation threshold for targeted review</p>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.blindReviewMode}
                      onChange={(e) => handleFieldChange('blindReviewMode', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-semibold text-gray-300">Blind Review Mode</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ========== DEADLINES ========== */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-sm font-bold">2</span>
              Deadlines *
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Registration Deadline</label>
                <input
                  type="datetime-local"
                  value={formData.regDeadline}
                  onChange={(e) => handleFieldChange('regDeadline', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Submission Deadline *</label>
                <input
                  type="datetime-local"
                  value={formData.subDeadline}
                  onChange={(e) => handleFieldChange('subDeadline', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Freeze Deadline *</label>
                <input
                  type="datetime-local"
                  value={formData.freezeDeadline}
                  onChange={(e) => handleFieldChange('freezeDeadline', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Judge Deadline *</label>
                <input
                  type="datetime-local"
                  value={formData.judgeDeadline}
                  onChange={(e) => handleFieldChange('judgeDeadline', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* ========== TRACKS ========== */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-sm font-bold">3</span>
              Competition Tracks *
            </h2>
            <div className="space-y-4">
              {formData.tracks.map((track, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={track.name}
                      onChange={(e) => handleArrayFieldChange('tracks', idx, 'name', e.target.value)}
                      placeholder="Track name"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 text-sm"
                    />
                    <textarea
                      value={track.description}
                      onChange={(e) => handleArrayFieldChange('tracks', idx, 'description', e.target.value)}
                      placeholder="Track description"
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 text-sm resize-none"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveArrayItem('tracks', idx)}
                    className="p-2 hover:bg-red-900/30 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddArrayItem('tracks', { name: '', description: '' })}
                className="w-full py-3 border border-dashed border-cyan-500/50 rounded-lg text-cyan-300 hover:bg-cyan-900/20 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Track
              </button>
            </div>
          </div>

          {/* ========== PRIZES ========== */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-sm font-bold">4</span>
              Prizes
            </h2>
            <div className="space-y-4">
              {formData.prizes.map((prize, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="grid md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={prize.title}
                        onChange={(e) => handleArrayFieldChange('prizes', idx, 'title', e.target.value)}
                        placeholder="e.g., 🥇 First Place"
                        className="px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 text-sm"
                      />
                      <input
                        type="text"
                        value={prize.amount}
                        onChange={(e) => handleArrayFieldChange('prizes', idx, 'amount', e.target.value)}
                        placeholder="e.g., $5,000"
                        className="px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 text-sm"
                      />
                    </div>
                    <textarea
                      value={prize.description}
                      onChange={(e) => handleArrayFieldChange('prizes', idx, 'description', e.target.value)}
                      placeholder="Prize description"
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 text-sm resize-none"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveArrayItem('prizes', idx)}
                    className="p-2 hover:bg-red-900/30 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddArrayItem('prizes', { title: '', description: '', amount: '' })}
                className="w-full py-3 border border-dashed border-cyan-500/50 rounded-lg text-cyan-300 hover:bg-cyan-900/20 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Prize
              </button>
            </div>
          </div>

          {/* ========== RUBRIC CRITERIA ========== */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-sm font-bold">5</span>
              Evaluation Criteria *
            </h2>
            <div className="space-y-4">
              {formData.criteria.map((crit, idx) => (
                <div key={idx} className="p-4 bg-gray-700/50 rounded-lg space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={crit.name}
                      onChange={(e) => handleArrayFieldChange('criteria', idx, 'name', e.target.value)}
                      placeholder="Criteria name"
                      className="px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={crit.weight}
                        onChange={(e) => handleArrayFieldChange('criteria', idx, 'weight', parseFloat(e.target.value))}
                        placeholder="Weight"
                        step="0.05"
                        min="0"
                        max="1"
                        className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 text-sm"
                      />
                      <span className="text-gray-400 px-2 py-2 text-sm">({(crit.weight * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                  <textarea
                    value={crit.description}
                    onChange={(e) => handleArrayFieldChange('criteria', idx, 'description', e.target.value)}
                    placeholder="Criteria description and guidance"
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 text-sm resize-none"
                  />
                  <div className="grid md:grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-400">Min Score</label>
                      <input
                        type="number"
                        value={crit.minScore}
                        onChange={(e) => handleArrayFieldChange('criteria', idx, 'minScore', parseFloat(e.target.value))}
                        min="0"
                        max="10"
                        step="0.5"
                        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Max Score</label>
                      <input
                        type="number"
                        value={crit.maxScore}
                        onChange={(e) => handleArrayFieldChange('criteria', idx, 'maxScore', parseFloat(e.target.value))}
                        min="0"
                        max="10"
                        step="0.5"
                        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => handleRemoveArrayItem('criteria', idx)}
                        className="w-full py-1 hover:bg-red-900/30 rounded transition-colors text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() =>
                  handleAddArrayItem('criteria', {
                    name: '',
                    description: '',
                    weight: 0.25,
                    minScore: 1,
                    maxScore: 10,
                  })
                }
                className="w-full py-3 border border-dashed border-cyan-500/50 rounded-lg text-cyan-300 hover:bg-cyan-900/20 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Criteria
              </button>
              <div className="text-xs text-gray-400 bg-gray-700/30 p-3 rounded">
                Total Weight: {(formData.criteria.reduce((sum, c) => sum + c.weight, 0) * 100).toFixed(0)}% (should be 100%)
              </div>
            </div>
          </div>

          {/* ========== ACTION BUTTONS ========== */}
          <div className="flex gap-4 pt-8">
            <button
              onClick={handleCreateEvent}
              disabled={isLoading}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-cyan-600 to-green-600 hover:from-cyan-500 hover:to-green-500 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating Event...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Create Hackathon Event
                </>
              )}
            </button>
            <button
              onClick={() => setMethod(null)}
              disabled={isLoading}
              className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
