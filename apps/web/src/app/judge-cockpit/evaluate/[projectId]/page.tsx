'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Send, AlertTriangle, Eye, Lock, CheckCircle2,
  FileText, Link as LinkIcon, Github, Globe, Flag, Shield, Clock
} from 'lucide-react';

interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  minScore: number;
  maxScore: number;
  guidance: string | null;
}

interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  repoUrl: string | null;
  demoUrl: string | null;
  techStack: string | null;
  featuresList: string | null;
  track: {
    id: string;
    name: string;
  } | null;
  team: {
    name: string;
  } | null;
  blindReviewActive: boolean;
}

interface BallotScore {
  criteriaId: string;
  score: number;
  comment: string;
}

export default function EvaluateProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [rubric, setRubric] = useState<RubricCriteria[]>([]);
  const [scores, setScores] = useState<Record<string, BallotScore>>({});
  const [feedback, setFeedback] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [showRecusalModal, setShowRecusalModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [recusalReason, setRecusalReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [eventId] = useState('demo-event');

  useEffect(() => {
    fetchProjectAndRubric();
    
    // Auto-save draft every 30 seconds
    const interval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [projectId]);

  const fetchProjectAndRubric = async () => {
    try {
      const userStr = localStorage.getItem('dogfood_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      // Fetch rubric
      const rubricResponse = await fetch(`http://localhost:4000/api/v1/events/${eventId}/judging/rubric`, {
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      
      if (rubricResponse.ok) {
        const rubricData = await rubricResponse.json();
        setRubric(rubricData.criteria || []);
        
        // Initialize scores
        const initialScores: Record<string, BallotScore> = {};
        rubricData.criteria.forEach((c: RubricCriteria) => {
          initialScores[c.id] = {
            criteriaId: c.id,
            score: (c.minScore + c.maxScore) / 2, // Start at midpoint
            comment: ''
          };
        });
        setScores(initialScores);
      }

      // Fetch project details
      const assignmentsResponse = await fetch(
        `http://localhost:4000/api/v1/events/${eventId}/judging/assignments/me`,
        { headers: { 'Authorization': `Bearer ${user.id}` } }
      );
      
      if (assignmentsResponse.ok) {
        const assignments = await assignmentsResponse.json();
        const assignment = assignments.find((a: any) => a.project.id === projectId);
        
        if (assignment) {
          setProject(assignment.project);
          
          // Load existing ballot if any
          if (assignment.ballot && assignment.ballot.scores) {
            const existingScores: Record<string, BallotScore> = {};
            assignment.ballot.scores.forEach((s: any) => {
              existingScores[s.criteriaId] = {
                criteriaId: s.criteriaId,
                score: s.score,
                comment: s.comment || ''
              };
            });
            setScores(existingScores);
            setFeedback(assignment.ballot.feedback || '');
            setPrivateNotes(assignment.ballot.privateNotes || '');
            setIsFlagged(assignment.ballot.isFlagged || false);
            setFlagReason(assignment.ballot.flagReason || '');
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch project/rubric:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    // Auto-save logic would go here
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      setLastSaved(new Date());
    }, 500);
  };

  const calculateWeightedScore = () => {
    let total = 0;
    rubric.forEach((criteria) => {
      const score = scores[criteria.id]?.score || 0;
      total += score * criteria.weight;
    });
    return Math.round(total * 100) / 100;
  };

  const handleScoreChange = (criteriaId: string, newScore: number) => {
    setScores({
      ...scores,
      [criteriaId]: {
        ...scores[criteriaId],
        score: newScore
      }
    });
  };

  const handleCommentChange = (criteriaId: string, newComment: string) => {
    setScores({
      ...scores,
      [criteriaId]: {
        ...scores[criteriaId],
        comment: newComment
      }
    });
  };

  const handleSubmit = async () => {
    try {
      const userStr = localStorage.getItem('dogfood_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const ballotData = {
        eventId,
        projectId,
        judgeId: user.id,
        scores: Object.values(scores),
        feedback,
        privateNotes,
        isFlagged,
        flagReason: isFlagged ? flagReason : undefined
      };

      const response = await fetch(`http://localhost:4000/api/v1/events/${eventId}/judging/ballots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify(ballotData)
      });

      if (response.ok) {
        // Show success and redirect
        router.push('/judge-cockpit');
      } else {
        alert('Failed to submit ballot');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit ballot');
    }
  };

  const handleRecuse = async () => {
    try {
      const userStr = localStorage.getItem('dogfood_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const response = await fetch(`http://localhost:4000/api/v1/events/${eventId}/judging/recuse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          projectId,
          reason: recusalReason,
          note: 'Self-recused during evaluation'
        })
      });

      if (response.ok) {
        router.push('/judge-cockpit');
      } else {
        alert('Failed to recuse');
      }
    } catch (error) {
      console.error('Recusal error:', error);
      alert('Failed to recuse');
    }
  };

  const isComplete = () => {
    const allScored = rubric.every((c) => scores[c.id]?.score !== undefined);
    const hasFeedback = feedback.trim().length > 0;
    return allScored && hasFeedback;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading evaluation workspace...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p>Project not found</p>
          <button 
            onClick={() => router.push('/judge-cockpit')}
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg"
          >
            Back to Cockpit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/judge-cockpit')}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-xl font-bold">EVALUATION WORKSPACE</h1>
                {lastSaved && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {saving ? 'Saving...' : `Last saved ${lastSaved.toLocaleTimeString()}`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <p className="text-sm text-gray-400">Weighted Score</p>
                <p className="text-3xl font-bold font-mono text-cyan-400">{calculateWeightedScore()}</p>
              </div>
              <button
                onClick={() => saveDraft()}
                disabled={saving}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              <button
                onClick={() => setShowRecusalModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg flex items-center gap-2 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Recuse
              </button>
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={!isComplete()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Submit Ballot
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Project Information */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{project.title}</h2>
                  {project.tagline && (
                    <p className="text-lg text-gray-300 mb-4">{project.tagline}</p>
                  )}
                  {project.track && (
                    <span className="px-3 py-1 bg-purple-900/30 text-purple-400 rounded-full text-sm font-semibold border border-purple-700">
                      {project.track.name}
                    </span>
                  )}
                </div>
                {project.blindReviewActive && (
                  <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-xs font-semibold border border-yellow-700 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Blind Review
                  </span>
                )}
              </div>

              <div className="prose prose-invert max-w-none">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{project.description}</p>
              </div>

              {project.featuresList && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{project.featuresList}</p>
                </div>
              )}

              {project.techStack && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Tech Stack</h3>
                  <p className="text-gray-300">{project.techStack}</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    Repository
                  </a>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Live Demo
                  </a>
                )}
              </div>

              {!project.blindReviewActive && project.team && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h3 className="text-lg font-semibold mb-2">Team</h3>
                  <p className="text-gray-300">{project.team.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Rubric & Scoring */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                EVALUATION RUBRIC
              </h3>

              <div className="space-y-6">
                {rubric.map((criteria) => (
                  <div key={criteria.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-lg">{criteria.name}</h4>
                        <span className="text-sm text-gray-400">Weight: {(criteria.weight * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-sm text-gray-300">{criteria.description}</p>
                      {criteria.guidance && (
                        <p className="text-xs text-cyan-400 mt-1 italic">💡 {criteria.guidance}</p>
                      )}
                    </div>

                    {/* Score Slider */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Score:</span>
                        <span className="text-2xl font-bold font-mono text-cyan-400">
                          {scores[criteria.id]?.score?.toFixed(1) || criteria.minScore}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={criteria.minScore}
                        max={criteria.maxScore}
                        step={0.1}
                        value={scores[criteria.id]?.score || criteria.minScore}
                        onChange={(e) => handleScoreChange(criteria.id, parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider-cyan"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{criteria.minScore}</span>
                        <span>{criteria.maxScore}</span>
                      </div>
                    </div>

                    {/* Evidence/Notes */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Evidence & Notes</label>
                      <textarea
                        value={scores[criteria.id]?.comment || ''}
                        onChange={(e) => handleCommentChange(criteria.id, e.target.value)}
                        placeholder="What evidence supports this score?"
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:border-cyan-500 text-white text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Public Feedback */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-3">Feedback for Team</h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Constructive feedback that will be shared with the team..."
                rows={4}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
              />
            </div>

            {/* Private Notes */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-yellow-400" />
                Private Notes (Organizer Only)
              </h3>
              <textarea
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                placeholder="Internal notes not shared with team..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
              />
            </div>

            {/* Flag for Review */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFlagged}
                  onChange={(e) => setIsFlagged(e.target.checked)}
                  className="w-4 h-4"
                />
                <Flag className="w-4 h-4 text-orange-400" />
                <span className="font-semibold">Flag for Organizer Review</span>
              </label>
              {isFlagged && (
                <input
                  type="text"
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="Reason for flagging..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500 text-white mt-2"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-800 rounded-xl max-w-md w-full border border-slate-700">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-cyan-400" />
                Finalize Evaluation
              </h3>
              <p className="text-gray-300 mb-4">
                You are about to finalize and submit your evaluation for:
              </p>
              <div className="bg-slate-700 rounded-lg p-4 mb-4">
                <p className="font-semibold text-lg">{project.title}</p>
                <p className="text-sm text-gray-400 mt-1">Weighted Score: <span className="text-cyan-400 font-mono font-bold">{calculateWeightedScore()}</span></p>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-200">
                  <strong>⚠️ Important:</strong> Once submitted, your ballot will be cryptographically committed 
                  to the integrity chain and cannot be edited without organizer override.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    handleSubmit();
                  }}
                  className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold transition-colors"
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recusal Modal */}
      {showRecusalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-800 rounded-xl max-w-md w-full border border-slate-700">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
                Recuse from Evaluation
              </h3>
              <p className="text-gray-300 mb-4">
                You are recusing yourself from evaluating this project. This action is permanent and the 
                project will be reassigned to another available judge.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Reason for Recusal</label>
                <select
                  value={recusalReason}
                  onChange={(e) => setRecusalReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500 text-white"
                >
                  <option value="">Select a reason...</option>
                  <option value="CONFLICT_OF_INTEREST">Conflict of Interest</option>
                  <option value="KNOW_TEAM">Know Team Members</option>
                  <option value="INVOLVED_IN_PROJECT">Involved in Project</option>
                  <option value="LACK_EXPERTISE">Lack Domain Expertise</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRecusalModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (recusalReason) {
                      setShowRecusalModal(false);
                      handleRecuse();
                    }
                  }}
                  disabled={!recusalReason}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Recusal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider-cyan::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
          border: 2px solid #0e7490;
        }
        .slider-cyan::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
          border: 2px solid #0e7490;
        }
      `}</style>
    </div>
  );
}
