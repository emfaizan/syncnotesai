'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { meetingsAPI } from '@/services/apiService';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  ChevronDown,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Download,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Meeting {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  duration?: number;
  platform: string;
  meetingUrl?: string;
  tasks?: any[];
  usage?: {
    cost: number;
  };
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, [statusFilter, platformFilter]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const response = await meetingsAPI.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setMeetings(response.data.data.meetings || []);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeetings = meetings.filter((meeting) => {
    const matchesSearch =
      searchQuery === '' ||
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform =
      platformFilter === 'all' || meeting.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'recording':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'recording':
        return <Play className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const platforms = ['all', 'zoom', 'teams', 'meet', 'other'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
            <p className="text-gray-600 mt-2">
              View and manage all your recorded meetings
            </p>
          </div>
          <Link
            href="/dashboard/meetings/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5e72eb] text-white rounded-lg hover:bg-[#4d5fd1] transition-colors duration-200 shadow-lg shadow-[#5e72eb]/20"
          >
            <Plus className="w-5 h-5" />
            New Meeting
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5e72eb] focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              <Filter className="w-5 h-5" />
              Filters
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  showFilters ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5e72eb] focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="recording">Recording</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Platform Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5e72eb] focus:border-transparent"
                >
                  {platforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Meetings List */}
        <div className="bg-white rounded-xl border border-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-[#5e72eb] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading meetings...</p>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">
                No meetings found
              </p>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'all' || platformFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by recording your first meeting'}
              </p>
              <Link
                href="/dashboard/meetings/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5e72eb] text-white rounded-lg hover:bg-[#4d5fd1] transition-colors duration-200"
              >
                <Plus className="w-5 h-5" />
                Start Your First Meeting
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    {/* Meeting Info */}
                    <div className="flex-1">
                      <Link
                        href={`/dashboard/meetings/${meeting.id}`}
                        className="group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#5e72eb] transition-colors duration-200">
                            {meeting.title}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              meeting.status
                            )}`}
                          >
                            {getStatusIcon(meeting.status)}
                            {meeting.status}
                          </span>
                        </div>
                      </Link>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(meeting.createdAt), 'MMM d, yyyy')} at{' '}
                          {format(new Date(meeting.createdAt), 'h:mm a')}
                        </span>
                        {meeting.duration && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {meeting.duration} min
                          </span>
                        )}
                        <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium">
                          {meeting.platform}
                        </span>
                        {meeting.tasks && meeting.tasks.length > 0 && (
                          <span className="text-[#5e72eb] font-medium">
                            {meeting.tasks.length} task
                            {meeting.tasks.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {meeting.meetingUrl && (
                        <div className="mt-2">
                          <a
                            href={meeting.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#5e72eb] hover:text-[#4d5fd1] hover:underline"
                          >
                            View original meeting
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Actions and Cost */}
                    <div className="flex items-center gap-4 ml-6">
                      {meeting.usage && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Cost</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ${meeting.usage.cost.toFixed(2)}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/meetings/${meeting.id}`}
                          className="p-2 text-gray-600 hover:text-[#5e72eb] hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          title="View details"
                        >
                          <Download className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                'Are you sure you want to delete this meeting?'
                              )
                            ) {
                              // TODO: Implement delete
                              console.log('Delete meeting:', meeting.id);
                            }
                          }}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete meeting"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && filteredMeetings.length > 0 && (
          <div className="text-center text-sm text-gray-600">
            Showing {filteredMeetings.length} of {meetings.length} meeting
            {meetings.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
