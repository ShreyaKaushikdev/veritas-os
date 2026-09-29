'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Search, Filter, Download, Mail, UserPlus, AlertCircle,
  CheckCircle2, ChevronDown, ArrowUpDown, Eye, MoreVertical
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface Participant {
  id: string;
  name: string;
  email: string;
  role: string;
  teamName: string | null;
  track: string | null;
  emailOptIn: boolean;
  registeredAt: string;
  hasSubmitted: boolean;
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState<string>('demo-event');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'registeredAt'>('registeredAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchParticipants();
  }, [eventId]);

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/events/${eventId}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/events/${eventId}/audience/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `participants-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const filteredParticipants = participants
    .filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.teamName && p.teamName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;
      const matchesTeam = teamFilter === 'ALL' || 
        (teamFilter === 'NO_TEAM' && !p.teamName) ||
        (teamFilter === 'WITH_TEAM' && p.teamName);
      
      return matchesSearch && matchesRole && matchesTeam;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'email') {
        comparison = a.email.localeCompare(b.email);
      } else if (sortBy === 'registeredAt') {
        comparison = new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const stats = {
    total: participants.length,
    withTeams: participants.filter(p => p.teamName).length,
    withoutTeams: participants.filter(p => !p.teamName).length,
    emailOptIn: participants.filter(p => p.emailOptIn).length,
    submitted: participants.filter(p => p.hasSubmitted).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading participants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                PARTICIPANTS
              </h1>
              <p className="text-sm text-gray-400 mt-1">Manage event participants and teams</p>
            </div>
            <Link 
              href="/organizer/command-center"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              ← Back to Command Center
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-lg p-4 border border-blue-700/50">
            <Users className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-2xl font-bold font-mono">{stats.total}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
          </div>
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 rounded-lg p-4 border border-green-700/50">
            <CheckCircle2 className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-2xl font-bold font-mono">{stats.withTeams}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">In Teams</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 rounded-lg p-4 border border-yellow-700/50">
            <AlertCircle className="w-6 h-6 text-yellow-400 mb-2" />
            <p className="text-2xl font-bold font-mono">{stats.withoutTeams}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Solo</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 rounded-lg p-4 border border-purple-700/50">
            <Mail className="w-6 h-6 text-purple-400 mb-2" />
            <p className="text-2xl font-bold font-mono">{stats.emailOptIn}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Email Opt-In</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 rounded-lg p-4 border border-emerald-700/50">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2" />
            <p className="text-2xl font-bold font-mono">{stats.submitted}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Submitted</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white appearance-none"
              >
                <option value="ALL">All Roles</option>
                <option value="PARTICIPANT">Participants</option>
                <option value="JUDGE">Judges</option>
                <option value="ORGANIZER">Organizers</option>
              </select>
            </div>

            {/* Team Filter */}
            <div>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white appearance-none"
              >
                <option value="ALL">All Participants</option>
                <option value="WITH_TEAM">In Teams</option>
                <option value="NO_TEAM">Solo / No Team</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <Link
              href="/organizer/broadcast"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Send Broadcast
            </Link>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2 transition-colors">
              <UserPlus className="w-4 h-4" />
              Add Participant
            </button>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => {
                        if (sortBy === 'name') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('name');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                    >
                      Name <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => {
                        if (sortBy === 'email') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('email');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                    >
                      Email <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Track
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => {
                        if (sortBy === 'registeredAt') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('registeredAt');
                          setSortOrder('desc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                    >
                      Registered <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No participants found matching your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((participant) => (
                    <tr key={participant.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm mr-3">
                            {participant.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-medium">{participant.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {participant.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          participant.role === 'ORGANIZER' 
                            ? 'bg-purple-900/30 text-purple-400 border border-purple-700'
                            : participant.role === 'JUDGE'
                            ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-700'
                            : 'bg-blue-900/30 text-blue-400 border border-blue-700'
                        }`}>
                          {participant.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {participant.teamName || (
                          <span className="text-gray-500 italic">No team</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {participant.track || (
                          <span className="text-gray-500 italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(participant.registeredAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {participant.hasSubmitted && (
                            <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-semibold border border-green-700">
                              ✓ Submitted
                            </span>
                          )}
                          {participant.emailOptIn && (
                            <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded-full text-xs font-semibold border border-purple-700">
                              Email ✓
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing {filteredParticipants.length} of {participants.length} participants
        </div>
      </div>
    </div>
  );
}
