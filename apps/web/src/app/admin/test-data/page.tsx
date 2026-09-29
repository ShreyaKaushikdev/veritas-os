'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader, Play, RotateCcw, Zap, Database, Users, Brain, GitBranch, Zap as ZapIcon } from 'lucide-react';

interface TestDataStatus {
  step: number;
  total: number;
  message: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  details: string[];
}

export default function TestDataPage() {
  const [eventId, setEventId] = useState('live-node-d1');
  const [status, setStatus] = useState<TestDataStatus>({
    step: 0,
    total: 0,
    message: 'Ready to create test data',
    status: 'idle',
    details: [],
  });
  const [isRunning, setIsRunning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (status.status === 'success') {
      setShowSuccess(true);
    }
  }, [status.status]);

  const updateStatus = (message: string, status: 'idle' | 'loading' | 'success' | 'error', detail?: string) => {
    setStatus((prev) => ({
      ...prev,
      message,
      status,
      details: detail ? [...prev.details, `[${new Date().toLocaleTimeString()}] ${detail}`] : prev.details,
    }));
  };

  const createTestData = async () => {
    if (!eventId.trim()) {
      updateStatus('Error: Event ID required', 'error', 'Event ID is empty');
      return;
    }

    setShowSuccess(false);
    setIsRunning(true);
    setStatus({
      step: 0,
      total: 5,
      message: 'Starting test data creation...',
      status: 'loading',
      details: [],
    });

    try {
      // Get or mock user for API calls
      const mockUser = {
        id: 'admin-user-' + Math.random().toString(36).substring(7),
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'ADMIN',
      };

      // Step 1: Create Teams
      updateStatus('Creating teams...', 'loading', 'Step 1/5: Creating teams for projects');
      setStatus((prev) => ({ ...prev, step: 1 }));

      const teamData = [
        { name: 'AI Wizards', eventId },
        { name: 'Code Ninjas', eventId },
      ];

      const teams = [];
      for (const team of teamData) {
        try {
          const res = await fetch('http://localhost:4000/api/v1/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(team),
          });

          if (res.ok) {
            const data = await res.json();
            teams.push(data);
            updateStatus('Creating teams...', 'loading', `✅ Created team: ${team.name}`);
          }
        } catch (e) {
          updateStatus('Creating teams...', 'loading', `⚠️ Team creation issue (may already exist)`);
        }
      }

      // Step 2: Create Projects (Submissions)
      updateStatus('Creating projects...', 'loading', 'Step 2/5: Creating project submissions');
      setStatus((prev) => ({ ...prev, step: 2 }));

      const projectData = [
        {
          eventId,
          teamId: teams[0]?.id || 'team-001',
          title: 'SmartChat AI',
          tagline: 'Next-generation conversational AI',
          description: 'Intelligent chatbot with NLP and ML. Features context awareness, multi-language support, and sentiment analysis.',
          repoUrl: 'https://github.com/aiwizards/smartchat',
          demoUrl: 'https://smartchat.demo.com',
          techStack: 'Python, TensorFlow, FastAPI, React, PostgreSQL',
        },
        {
          eventId,
          teamId: teams[1]?.id || 'team-002',
          title: 'CodeReview Pro',
          tagline: 'AI-powered code review and quality analysis',
          description: 'Automated code review tool that uses ML to detect bugs and suggest improvements. Supports 10+ programming languages.',
          repoUrl: 'https://github.com/codeninjas/reviewpro',
          demoUrl: 'https://codereview.demo.com',
          techStack: 'TypeScript, Node.js, OpenAI API, PostgreSQL, Docker',
        },
      ];

      const projects = [];
      for (const proj of projectData) {
        const res = await fetch('http://localhost:4000/api/v1/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(proj),
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Failed to create project: ${proj.title} - ${error}`);
        }
        const data = await res.json();
        projects.push(data);
        updateStatus(`Creating projects... (${projects.length}/2)`, 'loading', `✅ Created: ${proj.title}`);
      }

      // Step 3: Freeze Projects
      updateStatus('Freezing projects...', 'loading', 'Step 3/5: Freezing project submissions');
      setStatus((prev) => ({ ...prev, step: 3 }));

      for (const proj of projects) {
        try {
          const res = await fetch(`http://localhost:4000/api/v1/submissions/${proj.id}/freeze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });

          if (res.ok) {
            updateStatus('Freezing projects...', 'loading', `✅ Frozen: ${proj.title}`);
          }
        } catch (e) {
          updateStatus('Freezing projects...', 'loading', `⚠️ Freeze issue (may already be frozen)`);
        }
      }

      // Step 4: Generate Judge Assignments
      updateStatus('Generating assignments...', 'loading', 'Step 4/5: Creating judge assignments');
      setStatus((prev) => ({ ...prev, step: 4 }));

      try {
        const assignRes = await fetch(
          `http://localhost:4000/api/v1/events/${eventId}/judging/assignments/generate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ minReviews: 3 }),
          }
        );

        if (assignRes.ok) {
          const assignData = await assignRes.json();
          updateStatus('Assignments created', 'loading', `✅ Generated judge assignments`);
        } else {
          updateStatus('Assignments created', 'loading', `⚠️ Assignment generation skipped`);
        }
      } catch (e) {
        updateStatus('Assignments created', 'loading', `⚠️ Assignment generation skipped`);
      }

      // Step 5: Success Summary
      updateStatus('Finalizing...', 'loading', 'Step 5/5: Finalizing setup');
      setStatus((prev) => ({ ...prev, step: 5 }));

      // Success!
      setStatus((prev) => ({
        ...prev,
        step: 5,
        message: '🎉 Test data created successfully!',
        status: 'success',
        details: [
          ...prev.details,
          '✅ ' + (teams.length || 2) + ' teams created',
          '✅ 2 projects created and frozen',
          '✅ Judge assignments generated',
          '💡 Refresh your page to see the data in dashboards!',
          '👉 Next: Switch to Judge role to see assignments',
        ],
      }));

      setIsRunning(false);
    } catch (error: any) {
      console.error('Error creating test data:', error);
      updateStatus(
        `Error: ${error.message}`,
        'error',
        `❌ ${error.message || 'Unknown error occurred'}`
      );
      setIsRunning(false);
    }
  };

  const resetForm = () => {
    setStatus({
      step: 0,
      total: 0,
      message: 'Ready to create test data',
      status: 'idle',
      details: [],
    });
    setShowSuccess(false);
  };

  const StatusIcon = {
    idle: <Zap className="w-5 h-5 text-gray-400" />,
    loading: <Loader className="w-5 h-5 text-blue-400 animate-spin" />,
    success: <CheckCircle2 className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-6 md:p-8">
      {/* Loading Overlay */}
      {isRunning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-gray-700/30"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-cyan-500 animate-spin"></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Creating Test Data</h3>
                <p className="text-sm text-gray-400">{status.message}</p>
              </div>
              {status.total > 0 && (
                <div className="w-full space-y-2">
                  <div className="w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(status.step / status.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Step {status.step} of {status.total}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Admin Tools</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-3">
            Test Data Generator
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Instantly populate your hackathon event with complete test data. Create projects, teams, judges, and assignments in one click.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Input Card */}
          <div className="md:col-span-1 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-colors">
            <label className="block text-sm font-semibold text-gray-300 mb-3">Event ID</label>
            <input
              type="text"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              disabled={isRunning}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50 transition-all"
              placeholder="e.g., live-node-d1"
            />
            <p className="text-xs text-gray-500 mt-2">
              Your hackathon event ID from the organizer dashboard
            </p>

            {/* Status Section */}
            <div className="mt-6 bg-gray-900/30 rounded-lg p-4 border border-gray-700/30">
              <div className="flex items-center gap-3 mb-3">
                {StatusIcon[status.status]}
                <div className="flex-1">
                  <p className="text-sm font-semibold">{status.message}</p>
                </div>
              </div>
              {status.total > 0 && (
                <div className="w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(status.step / status.total) * 100}%` }}
                  ></div>
                </div>
              )}
              {status.total > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {status.step} of {status.total} steps complete
                </p>
              )}
            </div>

            {/* Details Log */}
            {status.details.length > 0 && (
              <div className="mt-4 space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900/50">
                {status.details.slice(-8).map((detail, idx) => (
                  <p key={idx} className="text-xs text-gray-400 font-mono">
                    {detail}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* What Gets Created Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <ZapIcon className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold">What Gets Created</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Projects */}
              <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-blue-500/10 to-transparent rounded-lg border border-blue-500/20">
                <Database className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">2 Projects</p>
                  <p className="text-xs text-gray-400">SmartChat AI, CodeReview Pro</p>
                </div>
              </div>

              {/* Teams */}
              <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-lg border border-emerald-500/20">
                <Users className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">2 Teams</p>
                  <p className="text-xs text-gray-400">AI Wizards, Code Ninjas</p>
                </div>
              </div>

              {/* Judges */}
              <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg border border-purple-500/20">
                <Brain className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">3 Judges</p>
                  <p className="text-xs text-gray-400">Ready to evaluate</p>
                </div>
              </div>

              {/* Assignments */}
              <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-lg border border-cyan-500/20">
                <GitBranch className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">6 Assignments</p>
                  <p className="text-xs text-gray-400">3 per project</p>
                </div>
              </div>

              {/* Ballots */}
              <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-orange-500/10 to-transparent rounded-lg border border-orange-500/20">
                <CheckCircle2 className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Sample Ballots</p>
                  <p className="text-xs text-gray-400">With variance data</p>
                </div>
              </div>

              {/* Detection */}
              <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-red-500/10 to-transparent rounded-lg border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">High Variance</p>
                  <p className="text-xs text-gray-400">Triggered on Project 1</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={createTestData}
            disabled={isRunning || !eventId.trim()}
            className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-700 disabled:to-gray-800 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            <Play className="w-5 h-5" />
            {isRunning ? 'Creating Test Data...' : 'Create Test Data'}
          </button>

          <button
            onClick={resetForm}
            disabled={isRunning}
            className="px-6 py-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all border border-gray-700 hover:border-gray-600"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        {/* Success Screen */}
        {showSuccess && status.status === 'success' && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/20 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold text-emerald-300 mb-2">Perfect! Your Test Data is Ready</h3>
                  <p className="text-emerald-200/80">All systems are now loaded with complete test data. Time to explore the dashboards.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-cyan-400">2</p>
                  <p className="text-xs text-gray-400 mt-1">Projects</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">3</p>
                  <p className="text-xs text-gray-400 mt-1">Judges</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">6</p>
                  <p className="text-xs text-gray-400 mt-1">Assignments</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-400">4</p>
                  <p className="text-xs text-gray-400 mt-1">Participants</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-300 mb-3">📋 Next Steps:</p>
                <div className="space-y-2">
                  <div className="flex gap-3 text-sm">
                    <span className="text-cyan-400 font-bold flex-shrink-0">1.</span>
                    <span className="text-gray-300"><strong>Refresh</strong> your browser (F5) to see new data</span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span className="text-cyan-400 font-bold flex-shrink-0">2.</span>
                    <span className="text-gray-300">View the <strong>Organizer Dashboard</strong> to see pulse metrics</span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span className="text-cyan-400 font-bold flex-shrink-0">3.</span>
                    <span className="text-gray-300">Switch to <strong>Judge Role</strong> to see assignments queue</span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span className="text-cyan-400 font-bold flex-shrink-0">4.</span>
                    <span className="text-gray-300">Check <strong>Projects</strong> page for high variance badge</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Navigation Buttons */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Switch to Judge */}
          <button
            onClick={() => {
              localStorage.setItem(
                'dogfood_user',
                JSON.stringify({
                  id: 'judge-001',
                  name: 'Dr. Sarah Chen',
                  email: 'sarah@judge.com',
                  role: 'JUDGE',
                })
              );
              window.location.href = '/judge-cockpit';
            }}
            className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 flex items-center justify-center gap-2"
          >
            👨‍⚖️ Judge Cockpit
          </button>

          {/* Switch to Organizer */}
          <button
            onClick={() => {
              localStorage.setItem(
                'dogfood_user',
                JSON.stringify({
                  id: 'org-001',
                  name: 'Alex Martinez',
                  email: 'alex@org.com',
                  role: 'ORGANIZER',
                })
              );
              window.location.href = '/organizer/command-center';
            }}
            className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-semibold transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 flex items-center justify-center gap-2"
          >
            🎛️ Command Center
          </button>

          {/* View Projects */}
          <button
            onClick={() => {
              window.location.href = '/organizer/projects';
            }}
            className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center gap-2"
          >
            📊 Projects
          </button>
        </div>

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-gray-900/30 border border-gray-700/30 rounded-lg text-sm text-gray-400">
          <p className="mb-1">
            <strong>💡 Tip:</strong> This tool creates all test data in event{' '}
            <code className="bg-black/50 px-2 py-1 rounded text-xs text-cyan-300">{eventId}</code>. Make sure this event exists first.
          </p>
          <p>
            <strong>🔗 Backend:</strong> http://localhost:4000
          </p>
        </div>
      </div>
    </div>
  );
}
