'use client';

/**
 * PARTICIPANT MISSION CONTROL
 * Your personal command center for completing the hackathon
 * 
 * Design Philosophy:
 * - Answer "What should I do next?" immediately
 * - Show hackathon journey progress at a glance  
 * - Surface critical deadlines and actions
 * - Make project status crystal clear
 * - Integrate team collaboration naturally
 * - Showcase unique DOGFOOD OS capabilities (versioning, freezing, idea intelligence)
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Rocket,
  Users,
  FolderKanban,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Lock,
  Zap,
  TrendingUp,
  GitBranch,
  Eye,
  Edit3,
  Send,
  Award,
  Target,
  Brain,
  Activity,
  BarChart3,
  MessageSquare,
  HelpCircle,
  Calendar,
  Layers,
  Package,
  Shield,
  Terminal,
  Code2,
  Play,
  ExternalLink,
  ArrowRight,
  Lightbulb,
  Users2,
  FileText,
  Grid3x3,
  Cpu,
  Plus
} from 'lucide-react';
import { getCurrentUser } from '@/lib/rbac';
import { teams, events, submissions, intelligence, support, projects, IdeaReport, HackathonEvent, getToken, setToken } from '@/lib/api';
import PotentialRadarScene from '@/components/3d/PotentialRadarScene';
import AuthModal from '@/components/AuthModal';

// Types
type ProjectStatus = 'NOT_STARTED' | 'DRAFT' | 'IN_PROGRESS' | 'READY' | 'SUBMITTED' | 'FROZEN';
type HackathonStage = 'REGISTER' | 'TEAM' | 'IDEA' | 'BUILD' | 'SUBMIT' | 'JUDGING' | 'RESULTS';

interface TeamData {
  id: string;
  name: string;
  inviteCode?: string;
  members?: Array<{ id: string; name: string; email: string; role?: string }>;
  createdAt?: string;
}

interface ProjectData {
  id: string;
  title: string;
  tagline?: string;
  description?: string;
  status?: ProjectStatus;
  track?: string;
  repoUrl?: string;
  demoUrl?: string;
  version?: number;
  isFrozen?: boolean;
  frozenAt?: string;
  lastUpdated?: string;
  teamId?: string;
  versions?: Array<{
    versionNumber: number;
    title: string;
    contentHash: string;
    createdAt: string;
    reason?: string;
  }>;
}

interface EventData extends HackathonEvent {
  description?: string;
  submissionDeadline?: string;
  tracks?: Array<{ id: string; name: string; description?: string }>;
  prizes?: Array<{ id: string; title: string; amount?: string }>;
}

export default function ParticipantMissionControl() {
  const router = useRouter();
  const [user] = useState(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'project' | 'team' | 'idea' | 'activity'>('overview');
  
  // Data states
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
  const [team, setTeam] = useState<TeamData | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [ideaReport, setIdeaReport] = useState<IdeaReport | null>(null);
  
  // UI states
  const [showIdeaLab, setShowIdeaLab] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Team Form states
  const [teamNameInput, setTeamNameInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [teamActionLoading, setTeamActionLoading] = useState(false);
  const [teamActionError, setTeamActionError] = useState<string | null>(null);
  const [teamActionSuccess, setTeamActionSuccess] = useState<string | null>(null);

  // Project Form states
  const [projectForm, setProjectForm] = useState({
    title: '',
    tagline: '',
    description: '',
    trackId: '',
    repoUrl: '',
    demoUrl: '',
    techStack: '',
  });
  
  // Idea Lab form
  const [ideaForm, setIdeaForm] = useState({
    title: '',
    description: '',
    techStack: '',
    hours: 48,
  });
  const [generatingReport, setGeneratingReport] = useState(false);

  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    if (user.role !== 'PARTICIPANT' && user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user) {
      loadParticipantData();
    }
  }, [user]);
  useEffect(() => {
    if (!currentEvent?.submissionDeadline) return;
    
    const interval = setInterval(() => {
      const deadline = new Date(currentEvent.submissionDeadline!);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Deadline passed');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentEvent]);

  async function loadParticipantData() {
    setLoading(true);
    try {
      // Load event
      const eventsData = await events.list();
      const activeEvent = eventsData.events?.[0];
      if (activeEvent) {
        const eventDetails = await events.get(activeEvent.id);
        setCurrentEvent(eventDetails as EventData);

        // Load team
        try {
          const teamData = await teams.mine(activeEvent.id);
          setTeam(teamData as TeamData);
        } catch (e) {
          console.log('No team yet');
        }

        // Load project (demo for now)
        try {
          const projectsData = await projects.list();
          if (projectsData.data?.length > 0) {
            setProject(projectsData.data[0] as any);
          }
        } catch (e) {
          console.log('No project yet');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamNameInput.trim()) return;
    const token = getToken();
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    const eventId = currentEvent?.id || 'b8a16308-26a2-4d42-86f7-77e0f2a6f01f';
    setTeamActionLoading(true);
    setTeamActionError(null);
    try {
      const res: any = await teams.create(eventId, teamNameInput.trim());
      setTeam(res as TeamData);
      setShowCreateTeam(false);
      setTeamNameInput('');
      setTeamActionSuccess('Team created successfully!');
      setTimeout(() => setTeamActionSuccess(null), 4000);
      await loadParticipantData();
    } catch (err: any) {
      setTeamActionError(err.message || 'Failed to create team');
    } finally {
      setTeamActionLoading(false);
    }
  }

  async function handleJoinTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const token = getToken();
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setTeamActionLoading(true);
    setTeamActionError(null);
    try {
      const res: any = await teams.join(joinCodeInput.trim().toUpperCase());
      setTeam(res as TeamData);
      setShowJoinTeam(false);
      setJoinCodeInput('');
      setTeamActionSuccess('Joined team successfully!');
      setTimeout(() => setTeamActionSuccess(null), 4000);
      await loadParticipantData();
    } catch (err: any) {
      setTeamActionError(err.message || 'Failed to join team');
    } finally {
      setTeamActionLoading(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!projectForm.title.trim()) return;
    const token = getToken();
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    const eventId = currentEvent?.id || 'b8a16308-26a2-4d42-86f7-77e0f2a6f01f';
    setTeamActionLoading(true);
    setTeamActionError(null);
    try {
      const res: any = await submissions.saveDraft({
        eventId,
        title: projectForm.title,
        tagline: projectForm.tagline,
        description: projectForm.description,
        trackId: projectForm.trackId || currentEvent?.tracks?.[0]?.id,
        repoUrl: projectForm.repoUrl,
        demoUrl: projectForm.demoUrl,
        techStack: projectForm.techStack,
      });
      setProject(res as ProjectData);
      setShowCreateProject(false);
      setTeamActionSuccess('Project created and saved as draft!');
      setTimeout(() => setTeamActionSuccess(null), 4000);
      await loadParticipantData();
    } catch (err: any) {
      setTeamActionError(err.message || 'Failed to save project');
    } finally {
      setTeamActionLoading(false);
    }
  }

  function getCurrentStage(): HackathonStage {
    if (!team) return 'TEAM';
    if (!project) return 'IDEA';
    if (project?.isFrozen) return 'JUDGING';
    if (project?.status === 'SUBMITTED') return 'SUBMIT';
    return 'BUILD';
  }

  function getNextAction(): { title: string; description: string; cta: string; onClick: () => void; urgent: boolean } {
    const stage = getCurrentStage();
    
    switch (stage) {
      case 'TEAM':
        return {
          title: 'Form Your Team',
          description: "You're registered, but haven't joined a team yet. Create a team or join an existing one to start building.",
          cta: 'Create Team',
          onClick: () => {
            if (!getToken()) setShowAuthModal(true);
            else setShowCreateTeam(true);
          },
          urgent: true
        };
      case 'IDEA':
        return {
          title: 'Define Your Project',
          description: 'Your team is ready. Use the Idea Lab to pressure-test your concept before you start building.',
          cta: 'Start Project',
          onClick: () => {
            if (!getToken()) setShowAuthModal(true);
            else setShowCreateProject(true);
          },
          urgent: true
        };
      case 'BUILD':
        return {
          title: 'Complete Your Project',
          description: `Continue building your project. ${project?.version || 0} version${project?.version === 1 ? '' : 's'} saved so far.`,
          cta: 'Continue Building',
          onClick: () => setShowCreateProject(true),
          urgent: false
        };
      case 'SUBMIT':
        return {
          title: 'Review Before Submission',
          description: 'Your project looks good! Review all details and freeze your final version when ready.',
          cta: 'Review & Freeze',
          onClick: () => setShowCreateProject(true),
          urgent: true
        };
      case 'JUDGING':
        return {
          title: 'Submission Locked',
          description: 'Your final version is frozen and ready for judging. Good luck!',
          cta: 'View Submission',
          onClick: () => setShowCreateProject(true),
          urgent: false
        };
      default:
        return {
          title: 'Get Started',
          description: 'Begin your hackathon journey.',
          cta: 'Start Now',
          onClick: () => setShowCreateTeam(true),
          urgent: false
        };
    }
  }

  function getSubmissionReadiness(): { percentage: number; items: Array<{ label: string; complete: boolean }> } {
    const items = [
      { label: 'Team formed', complete: !!team },
      { label: 'Project created', complete: !!project },
      { label: 'Project description', complete: !!(project?.description && project.description.length > 50) },
      { label: 'Repository URL', complete: !!project?.repoUrl },
      { label: 'Demo URL', complete: !!project?.demoUrl },
      { label: 'Version saved', complete: !!(project?.version && project.version > 0) },
      { label: 'Ready to freeze', complete: !project?.isFrozen && !!project?.status },
    ];
    
    const completed = items.filter(i => i.complete).length;
    const percentage = Math.round((completed / items.length) * 100);
    
    return { percentage, items };
  }

  async function generateIdeaReport() {
    if (!currentEvent?.id || !ideaForm.title || !ideaForm.description) return;
    
    setGeneratingReport(true);
    try {
      const report = await intelligence.createReport(currentEvent.id, {
        ideaTitle: ideaForm.title,
        ideaDescription: ideaForm.description,
        techStack: ideaForm.techStack,
        features: [], // Could parse from description
        teamHours: ideaForm.hours,
      });
      setIdeaReport(report);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(false);
    }
  }

  const nextAction = getNextAction();
  const readiness = getSubmissionReadiness();
  const currentStage = getCurrentStage();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 font-mono text-sm">Loading Mission Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Hero / Command Center */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
          
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  Mission Control
                </span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">
                BUILD. BREAK. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">PROVE.</span>
              </h1>
              <p className="text-lg text-slate-300">
                {project ? (
                  <>You're building <span className="font-bold text-white">{project.title}</span> for <span className="font-bold text-white">{currentEvent?.name || 'the hackathon'}</span></>
                ) : (
                  <>Welcome to <span className="font-bold text-white">{currentEvent?.name || 'your hackathon'}</span></>
                )}
              </p>
            </div>

            {/* Stage Progress */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-2">
              {(['REGISTER', 'TEAM', 'IDEA', 'BUILD', 'SUBMIT', 'JUDGING', 'RESULTS'] as HackathonStage[]).map((stage, idx) => {
                const stageIndex = ['REGISTER', 'TEAM', 'IDEA', 'BUILD', 'SUBMIT', 'JUDGING', 'RESULTS'].indexOf(stage);
                const currentIndex = ['REGISTER', 'TEAM', 'IDEA', 'BUILD', 'SUBMIT', 'JUDGING', 'RESULTS'].indexOf(currentStage);
                const isComplete = stageIndex < currentIndex;
                const isCurrent = stageIndex === currentIndex;
                const isUpcoming = stageIndex > currentIndex;

                return (
                  <React.Fragment key={stage}>
                    <div
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all ${
                        isComplete
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isCurrent
                          ? 'bg-emerald-500 text-white border border-emerald-400 shadow-lg shadow-emerald-500/50'
                          : 'bg-slate-800/50 text-slate-500 border border-slate-700/50'
                      }`}
                    >
                      {isComplete && <CheckCircle2 className="w-3 h-3" />}
                      {isCurrent && <Activity className="w-3 h-3 animate-pulse" />}
                      <span>{stage}</span>
                    </div>
                    {idx < 6 && (
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isComplete ? 'text-emerald-500' : 'text-slate-700'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Deadline Counter */}
            {currentEvent?.submissionDeadline && timeRemaining && currentStage !== 'JUDGING' && currentStage !== 'RESULTS' && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-xs font-mono text-slate-400">SUBMISSION DEADLINE</div>
                    <div className="text-2xl font-bold font-mono text-amber-400">{timeRemaining}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {currentStage === 'BUILD' && 'Keep building'}
                  {currentStage === 'SUBMIT' && 'Ready to freeze?'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* YOUR NEXT MOVE - Most Important */}
        <div className={`relative overflow-hidden rounded-3xl p-8 border-2 ${
          nextAction.urgent 
            ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30' 
            : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center space-x-2">
                <Zap className={`w-5 h-5 ${nextAction.urgent ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Your Next Move
                </span>
              </div>
              <h2 className="text-3xl font-extrabold">{nextAction.title}</h2>
              <p className="text-slate-300 text-lg leading-relaxed max-w-2xl">
                {nextAction.description}
              </p>
            </div>
            
            <a
              href={nextAction.ctaLink}
              onClick={(e) => {
                e.preventDefault();
                if (nextAction.ctaLink === '#team') setActiveTab('team');
                else if (nextAction.ctaLink === '#project') setActiveTab('project');
                else if (nextAction.ctaLink === '#idea') setShowIdeaLab(true);
              }}
              className={`inline-flex items-center space-x-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap ${
                nextAction.urgent
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/50'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/50'
              }`}
            >
              <span>{nextAction.cta}</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Project & Team Status */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Project Command Card */}
            {project ? (
              <div className="rounded-3xl bg-slate-900/50 border border-slate-700/50 p-6 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <FolderKanban className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{project.title}</h3>
                      <p className="text-xs text-slate-400 font-mono">{project.tagline || 'Your hackathon project'}</p>
                    </div>
                  </div>
                  
                  {project.isFrozen && (
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                      <Lock className="w-3 h-3" />
                      <span>FROZEN</span>
                    </div>
                  )}
                </div>

                {project.description && (
                  <p className="text-sm text-slate-300 leading-relaxed">{project.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {project.track && (
                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="text-xs text-slate-400 font-mono">TRACK</div>
                      <div className="text-sm font-bold mt-0.5">{project.track}</div>
                    </div>
                  )}
                  {project.version !== undefined && (
                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="text-xs text-slate-400 font-mono">VERSION</div>
                      <div className="text-sm font-bold mt-0.5 flex items-center space-x-1">
                        <GitBranch className="w-3 h-3" />
                        <span>v{project.version || 1}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all">
                    <Eye className="w-4 h-4" />
                    <span>View Project</span>
                  </button>
                  {!project.isFrozen && (
                    <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold transition-all">
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-900/50 border border-slate-700/50 border-dashed p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
                  <FolderKanban className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">No Project Yet</h3>
                  <p className="text-sm text-slate-400">Create your project to start building</p>
                </div>
                <button className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all">
                  <span>Create Project</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Version History */}
            {project?.versions && project.versions.length > 0 && (
              <div className="rounded-3xl bg-slate-900/50 border border-slate-700/50 p-6 space-y-4 backdrop-blur-xl">
                <div className="flex items-center space-x-2">
                  <GitBranch className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold">Version History</h3>
                </div>
                
                <div className="space-y-2">
                  {project.versions.slice(0, 5).map((version) => (
                    <div key={version.versionNumber} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                          <span className="text-xs font-mono font-bold text-emerald-400">v{version.versionNumber}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{version.title}</div>
                          {version.reason && <div className="text-xs text-slate-400">{version.reason}</div>}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {new Date(version.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Command Center */}
            {team ? (
              <div className="rounded-3xl bg-slate-900/50 border border-slate-700/50 p-6 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                      <Users2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{team.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">Your Team</p>
                    </div>
                  </div>
                  
                  {team.inviteCode && (
                    <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-xs">
                      Code: <span className="text-emerald-400 font-bold">{team.inviteCode}</span>
                    </div>
                  )}
                </div>

                {team.members && team.members.length > 0 && (
                  <div className="space-y-2">
                    {team.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{member.name}</div>
                          <div className="text-xs text-slate-400">{member.email}</div>
                        </div>
                        {member.role && (
                          <div className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                            {member.role}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold transition-all">
                  <Users className="w-4 h-4" />
                  <span>View Team Details</span>
                </button>
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-900/50 border border-slate-700/50 border-dashed p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
                  <Users2 className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">No Team Yet</h3>
                  <p className="text-sm text-slate-400">Create a team or enter an invite code to join one</p>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      if (!getToken()) setShowAuthModal(true);
                      else setShowCreateTeam(true);
                    }}
                    className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
                  >
                    <span>Create Team</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!getToken()) setShowAuthModal(true);
                      else setShowJoinTeam(true);
                    }}
                    className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold transition-all cursor-pointer active:scale-95"
                  >
                    <span>Join Team</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Readiness, Idea Lab, Activity */}
          <div className="space-y-6">
            
            {/* Submission Readiness */}
            <div className="rounded-3xl bg-slate-900/50 border border-slate-700/50 p-6 space-y-4 backdrop-blur-xl">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold">Submission Readiness</h3>
              </div>
              
              <div className="text-center py-4">
                <div className="text-5xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  {readiness.percentage}%
                </div>
                <div className="text-xs text-slate-400 mt-1">Complete</div>
              </div>

              <div className="space-y-2">
                {readiness.items.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-sm">
                    {item.complete ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-600 flex-shrink-0" />
                    )}
                    <span className={item.complete ? 'text-slate-300' : 'text-slate-500'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Idea Lab */}
            <div className="rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold">Idea Lab</h3>
              </div>
              
              <p className="text-sm text-slate-300 leading-relaxed">
                Pressure-test your idea before you build. Get intelligent feedback on feasibility, risks, and opportunities.
              </p>

              <button
                onClick={() => setShowIdeaLab(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-all"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Analyze Your Idea</span>
              </button>
            </div>

            {/* Hackathon Info */}
            {currentEvent && (
              <div className="rounded-3xl bg-slate-900/50 border border-slate-700/50 p-6 space-y-4 backdrop-blur-xl">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold">Hackathon</h3>
                </div>
                
                <div>
                  <div className="text-lg font-bold">{currentEvent.name}</div>
                  {currentEvent.description && (
                    <p className="text-sm text-slate-400 mt-1">{currentEvent.description}</p>
                  )}
                </div>

                {currentEvent.status && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono text-slate-400">
                      Status: <span className="text-emerald-400 font-bold">{currentEvent.status}</span>
                    </span>
                  </div>
                )}

                <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold transition-all text-sm">
                  <span>View Full Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="rounded-3xl bg-slate-900/50 border border-slate-700/50 p-6 space-y-3 backdrop-blur-xl">
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Quick Actions</h3>
              
              <Link
                href="/gallery"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <Grid3x3 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium">Project Gallery</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </Link>

              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium">Get Help</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Project Gallery Preview */}
        <div className="rounded-3xl bg-slate-900/50 border border-slate-700/50 p-6 space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold">Explore What Others Are Building</h3>
            </div>
            <Link
              href="/gallery"
              className="inline-flex items-center space-x-1 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="text-sm text-slate-400">
            Get inspired by other projects in the hackathon
          </div>

          <Link
            href="/gallery"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-bold transition-all"
          >
            <span>Explore Gallery</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Idea Lab Modal */}
      {showIdeaLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-slate-900 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Idea Lab</h2>
                  <p className="text-xs text-slate-400">Pressure-test your concept before you build</p>
                </div>
              </div>
              <button
                onClick={() => setShowIdeaLab(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center transition-all"
              >
                <span className="text-lg">×</span>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Input Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={ideaForm.title}
                    onChange={(e) => setIdeaForm({ ...ideaForm, title: e.target.value })}
                    placeholder="e.g., Real-time Collaboration Engine"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tech Stack
                  </label>
                  <input
                    type="text"
                    value={ideaForm.techStack}
                    onChange={(e) => setIdeaForm({ ...ideaForm, techStack: e.target.value })}
                    placeholder="e.g., React, Node.js, PostgreSQL, Redis"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Hours Available
                  </label>
                  <input
                    type="number"
                    value={ideaForm.hours}
                    onChange={(e) => setIdeaForm({ ...ideaForm, hours: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Architecture & Implementation Plan
                  </label>
                  <textarea
                    rows={8}
                    value={ideaForm.description}
                    onChange={(e) => setIdeaForm({ ...ideaForm, description: e.target.value })}
                    placeholder="Describe your architecture, key features, and implementation approach..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-white placeholder-slate-500 resize-none"
                  />
                </div>

                <button
                  onClick={generateIdeaReport}
                  disabled={generatingReport || !ideaForm.title || !ideaForm.description}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg"
                >
                  {generatingReport ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Generate Report</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right: Report Display */}
              <div className="space-y-4">
                {ideaReport ? (
                  <>
                    <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400 uppercase">Feasibility</span>
                        <span className={`text-sm font-bold ${
                          ideaReport.scopePressure === 'ACHIEVABLE' ? 'text-emerald-400' :
                          ideaReport.scopePressure === 'AT_RISK' ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {ideaReport.scopePressure}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">{ideaReport.scopeReason}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400 uppercase">Confidence</span>
                        <span className="text-sm font-bold text-emerald-400">{ideaReport.confidence}</span>
                      </div>
                      <p className="text-sm text-slate-300">{ideaReport.confidenceReason}</p>
                    </div>

                    {ideaReport.criteriaBands && Object.keys(ideaReport.criteriaBands).length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-mono text-slate-400 uppercase">Score Bands</div>
                        {Object.entries(ideaReport.criteriaBands).map(([key, value]: [string, any]) => (
                          <div key={key} className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-300">{key}</span>
                              <span className="text-xs font-mono font-bold text-emerald-400">{value.band}</span>
                            </div>
                            <p className="text-xs text-slate-400">{value.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 3D Visualization */}
                    <div className="h-64 rounded-xl overflow-hidden border border-slate-700">
                      <PotentialRadarScene />
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4 border-2 border-dashed border-slate-700 rounded-xl">
                    <Cpu className="w-12 h-12 text-slate-600" />
                    <div>
                      <div className="font-bold text-lg mb-2">No Report Yet</div>
                      <p className="text-sm text-slate-400">
                        Fill in your project details and generate a report to see intelligent feedback
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Success Notification */}
      {teamActionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-mono text-sm shadow-2xl flex items-center space-x-3 backdrop-blur-xl animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{teamActionSuccess}</span>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 max-w-md w-full p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Create New Team</h3>
                  <p className="text-xs text-slate-400 font-mono">Lead your squad in {currentEvent?.name || 'Hackathon'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateTeam(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {teamActionError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{teamActionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={teamNameInput}
                  onChange={(e) => setTeamNameInput(e.target.value)}
                  placeholder="e.g., CyberPulse Pioneers"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">💡 What happens next?</div>
                <div>You will get a unique invite code (e.g. <span className="font-mono text-emerald-400">INV-88F4</span>) to share with your teammates.</div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTeam(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs font-mono transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={teamActionLoading || !teamNameInput.trim()}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs font-mono transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
                >
                  {teamActionLoading ? <span>Creating...</span> : <span>Create Squad</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 max-w-md w-full p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Join a Team</h3>
                  <p className="text-xs text-slate-400 font-mono">Enter team invitation code</p>
                </div>
              </div>
              <button
                onClick={() => setShowJoinTeam(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {teamActionError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{teamActionError}</span>
              </div>
            )}

            <form onSubmit={handleJoinTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  required
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g., INV-HYPER88"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-mono text-sm uppercase tracking-wider"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinTeam(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs font-mono transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={teamActionLoading || !joinCodeInput.trim()}
                  className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold text-xs font-mono transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2"
                >
                  {teamActionLoading ? <span>Joining...</span> : <span>Join Squad</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 max-w-2xl w-full p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Project Draft Workspace</h3>
                  <p className="text-xs text-slate-400 font-mono">Build, save versions, and prepare for judging</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateProject(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {teamActionError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{teamActionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  placeholder="e.g., OmniQuery Vector Cache"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">Tagline</label>
                <input
                  type="text"
                  value={projectForm.tagline}
                  onChange={(e) => setProjectForm({ ...projectForm, tagline: e.target.value })}
                  placeholder="One sentence elevator pitch..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">Description & Architecture</label>
                <textarea
                  rows={4}
                  required
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Detailed technical description, how it works, and what makes it defensible..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">Repository URL</label>
                  <input
                    type="url"
                    value={projectForm.repoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, repoUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    value={projectForm.demoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, demoUrl: e.target.value })}
                    placeholder="https://my-app.vercel.app"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateProject(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs font-mono transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={teamActionLoading || !projectForm.title.trim()}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs font-mono transition-all shadow-lg shadow-emerald-500/20"
                >
                  {teamActionLoading ? <span>Saving...</span> : <span>Save Project Draft</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal Trigger for unauthenticated actions */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user, token) => {
          setToken(token);
          loadParticipantData();
        }}
      />
    </div>
  );
}
