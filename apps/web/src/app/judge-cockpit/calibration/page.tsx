'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Target, TrendingUp, TrendingDown, Minus, CheckCircle2,
  AlertCircle, Info, Award, FileText
} from 'lucide-react';

interface AnchorProject {
  id: string;
  title: string;
  description: string;
  tier: string;
  targetScores: Record<string, number>;
}

interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  minScore: number;
  maxScore: number;
}

interface CalibrationResult {
  judgeId: string;
  calibrationBias: number;
  guidance: string;
}

export default function CalibrationPage() {
  const [anchors, setAnchors] = useState<AnchorProject[]>([]);
  const [rubric, setRubric] = useState<RubricCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventId] = useState('demo-event');
  const [currentAnchorIndex, setCurrentAnchorIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCalibrationData();
  }, [eventId]);

  const fetchCalibrationData = async () => {
    try {
      const userStr = localStorage.getItem('dogfood_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      // Fetch anchor projects
      const anchorsResponse = await fetch(
        `http://localhost:4000/api/v1/events/${eventId}/judging/anchors`,
        { headers: { 'Authorization': `Bearer ${user.id}` } }
      );

      // Fetch rubric
      const rubricResponse = await fetch(
        `http://localhost:4000/api/v1/events/${eventId}/judging/rubric`,
        { headers: { 'Authorization': `Bearer ${user.id}` } }
      );

      if (anchorsResponse.ok && rubricResponse.ok) {
        const anchorsData = await anchorsResponse.json();
        const rubricData = await rubricResponse.json();
        
        setAnchors(anchorsData);
        setRubric(rubricData.criteria || []);

        // Initialize scores
        const initialScores: Record<string, Record<string, number>> = {};
        anchorsData.forEach((anchor: AnchorProject) => {
          initialScores[anchor.id] = {};
          rubricData.criteria.forEach((c: RubricCriteria) => {
            initialScores[anchor.id][c.id] = (c.minScore + c.maxScore) / 2;
          });
        });
        setScores(initialScores);
      }
    } catch (error) {
      console.error('Failed to fetch calibration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (anchorId: string, criteriaId: string, newScore: number) => {
    setScores({
      ...scores,
      [anchorId]: {
        ...scores[anchorId],
        [criteriaId]: newScore
      }
    });
  };

  const calculateWeightedScore = (anchorId: string) => {
    let total = 0;
    rubric.forEach((criteria) => {
      const score = scores[anchorId]?.[criteria.id] || 0;
      total += score * criteria.weight;
    });
    return Math.round(total * 100) / 100;
  };

  const handleSubmitCalibration = async () => {
    setSubmitting(true);
    try {
      const userStr = localStorage.getItem('dogfood_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      // Calculate average scores per anchor
      const anchorScores: Record<string, number> = {};
      anchors.forEach((anchor) => {
        anchorScores[anchor.id] = calculateWeightedScore(anchor.id);
      });

      const response = await fetch(
        `http://localhost:4000/api/v1/events/${eventId}/judging/calibration`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.id}`
          },
          body: JSON.stringify({
            judgeId: user.id,
            anchorScores
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        setCalibrationResult(result);
      } else {
        alert('Failed to submit calibration');
      }
    } catch (error) {
      console.error('Calibration submission error:', error);
      alert('Failed to submit calibration');
    } finally {
      setSubmitting(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'WEAK': return 'text-red-400';
      case 'TYPICAL': return 'text-yellow-400';
      case 'STRONG': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getTierBg = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'WEAK': return 'bg-red-900/30 border-red-700';
      case 'TYPICAL': return 'bg-yellow-900/30 border-yellow-700';
      case 'STRONG': return 'bg-green-900/30 border-green-700';
      default: return 'bg-gray-700 border-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading calibration...</p>
        </div>
      </div>
    );
  }

  if (calibrationResult) {
    const biasLabel = calibrationResult.calibrationBias < -0.4 
      ? 'Systematically Harsh'
      : calibrationResult.calibrationBias > 0.4
      ? 'Systematically Lenient'
      : 'Well Calibrated';

    const biasIcon = calibrationResult.calibrationBias < -0.4 
      ? TrendingDown
      : calibrationResult.calibrationBias > 0.4
      ? TrendingUp
      : Minus;

    const BiasIcon = biasIcon;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Calibration Complete</h1>
              <Link 
                href="/judge-cockpit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
              >
                Back to Cockpit
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-6 text-green-400" />
            <h2 className="text-3xl font-bold mb-4">Calibration Successful!</h2>
            
            <div className="bg-slate-700/50 rounded-lg p-6 mb-6 max-w-md mx-auto">
              <p className="text-sm text-gray-400 mb-2">Your Calibration Bias</p>
              <div className="flex items-center justify-center gap-3 mb-2">
                <BiasIcon className="w-8 h-8 text-cyan-400" />
                <span className="text-5xl font-bold font-mono text-cyan-400">
                  {calibrationResult.calibrationBias >= 0 ? '+' : ''}
                  {calibrationResult.calibrationBias.toFixed(2)}
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-300">{biasLabel}</p>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <p className="text-blue-200 text-left">
                <strong>Interpretation:</strong> {calibrationResult.guidance}
              </p>
            </div>

            <p className="text-gray-400 mb-6">
              This bias adjustment will be automatically applied to your scores during ranking calculations 
              to ensure fairness across the judging panel.
            </p>

            <Link
              href="/judge-cockpit"
              className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold transition-colors"
            >
              Continue to Assignments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (anchors.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Judge Calibration</h1>
              <Link 
                href="/judge-cockpit"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h2 className="text-2xl font-bold mb-2">No Calibration Projects Available</h2>
          <p className="text-gray-400 mb-6">
            The organizer has not configured anchor projects for this event. You can proceed directly to judging.
          </p>
          <Link
            href="/judge-cockpit"
            className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold transition-colors"
          >
            Back to Cockpit
          </Link>
        </div>
      </div>
    );
  }

  const currentAnchor = anchors[currentAnchorIndex];
  const isLastAnchor = currentAnchorIndex === anchors.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 text-cyan-400" />
                JUDGE CALIBRATION
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Score {currentAnchorIndex + 1} of {anchors.length} anchor projects
              </p>
            </div>
            <Link 
              href="/judge-cockpit"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentAnchorIndex + 1) / anchors.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Banner */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-200 mb-1">What is Calibration?</h3>
              <p className="text-sm text-blue-200">
                Calibration helps ensure fairness across judges. You'll score pre-selected anchor projects 
                representing different quality tiers. Your scores will be compared to panel averages to detect 
                systematic bias (too harsh or too lenient), which will be factored into final rankings.
              </p>
            </div>
          </div>
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Anchor Project */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTierBg(currentAnchor.tier)}`}>
                  <Award className={`w-4 h-4 inline mr-1 ${getTierColor(currentAnchor.tier)}`} />
                  {currentAnchor.tier.toUpperCase()} Tier
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-4">{currentAnchor.title}</h2>

              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{currentAnchor.description}</p>
              </div>

              <div className="mt-6 bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-400">Expected Score Range</h3>
                <p className="text-sm text-gray-300">
                  This is a <strong className={getTierColor(currentAnchor.tier)}>{currentAnchor.tier.toLowerCase()}</strong> project. 
                  Score it as you would any submission, using the rubric criteria.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Rubric Scoring */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Score This Project
                </h3>
                <span className="text-3xl font-bold font-mono text-cyan-400">
                  {calculateWeightedScore(currentAnchor.id)}
                </span>
              </div>

              <div className="space-y-6">
                {rubric.map((criteria) => (
                  <div key={criteria.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold">{criteria.name}</h4>
                        <span className="text-sm text-gray-400">Weight: {(criteria.weight * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-sm text-gray-300">{criteria.description}</p>
                    </div>

                    {/* Score Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Score:</span>
                        <span className="text-xl font-bold font-mono text-cyan-400">
                          {scores[currentAnchor.id]?.[criteria.id]?.toFixed(1) || criteria.minScore}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={criteria.minScore}
                        max={criteria.maxScore}
                        step={0.1}
                        value={scores[currentAnchor.id]?.[criteria.id] || criteria.minScore}
                        onChange={(e) => handleScoreChange(currentAnchor.id, criteria.id, parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider-cyan"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{criteria.minScore}</span>
                        <span>{criteria.maxScore}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-6">
                {currentAnchorIndex > 0 && (
                  <button
                    onClick={() => setCurrentAnchorIndex(currentAnchorIndex - 1)}
                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
                  >
                    ← Previous
                  </button>
                )}
                {!isLastAnchor ? (
                  <button
                    onClick={() => setCurrentAnchorIndex(currentAnchorIndex + 1)}
                    className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold transition-colors"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitCalibration}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Complete Calibration'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
