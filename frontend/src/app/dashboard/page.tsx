'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { meetingsAPI, billingAPI, calendarAPI } from '@/lib/api';
import { Calendar, Clock, DollarSign, TrendingUp, Play, CheckCircle, XCircle, Video, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Meeting {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  duration?: number;
  platform: string;
  tasks?: any[];
  usage?: {
    cost: number;
  };
}

interface BillingSummary {
  plan: {
    name: string;
    credits: number;
  };
  credits: number;
  monthlyUsage: {
    minutes: number;
    cost: number;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  meetingUrl?: string;
  platform?: string;
  botJoined: boolean;
}

export default function Dashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'recording' | 'processing'>('all');

  useEffect(() => {
    loadDashboardData();
    loadUpcomingEvents();
  }, [filter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load meetings
      const meetingsRes = await meetingsAPI.list({
        status: filter === 'all' ? undefined : filter,
        limit: 10,
      });
      setMeetings(meetingsRes.data.data.meetings || []);

      // Load billing summary
      const billingRes = await billingAPI.getSummary();
      setBilling(billingRes.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      setLoadingEvents(true);
      const eventsRes = await calendarAPI.getUpcomingEvents(4);
      setUpcomingEvents(eventsRes.data.data.events || []);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      // Don't show error if user hasn't connected calendar yet
      setUpcomingEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'recording':
        return 'text-blue-600 bg-blue-50';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'recording':
        return <Play className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here&apos;s what&apos;s happening with your meetings.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Meetings */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Meetings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{meetings.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Usage This Month */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usage This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {billing ? Math.round(billing.monthlyUsage.minutes / 60) : 0}h
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Credits Remaining */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Credits Remaining</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {billing ? Math.round(billing.credits / 60) : 0}h
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Cost This Month */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cost This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${billing ? billing.monthlyUsage.cost.toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Calendar Events */}
        {upcomingEvents.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <div className="p-6 border-b border-blue-200 bg-white/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Upcoming Calendar Meetings</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Meetings from your connected Google Calendar
                  </p>
                </div>
                <Link
                  href="/dashboard/settings"
                  className="text-sm text-[#5e72eb] hover:text-[#4d5fd1] font-medium"
                >
                  Manage Calendar
                </Link>
              </div>
            </div>

            <div className="p-6">
              {loadingEvents ? (
                <div className="text-center text-gray-500 py-4">Loading calendar events...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingEvents.map((event) => {
                    const startDate = new Date(event.startTime);
                    const endDate = new Date(event.endTime);
                    const now = new Date();
                    const isToday = startDate.toDateString() === now.toDateString();
                    const isPast = startDate < now;
                    const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

                    return (
                      <div
                        key={event.id}
                        className={`bg-white rounded-lg p-4 border-2 transition-all duration-200 hover:shadow-md ${
                          isPast
                            ? 'border-gray-200 opacity-60'
                            : isToday
                            ? 'border-[#5e72eb] shadow-sm'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                            {event.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          {isToday && !isPast && (
                            <span className="px-2 py-1 bg-[#5e72eb] text-white text-xs font-medium rounded-full">
                              Today
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{format(startDate, 'MMM d, yyyy')}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                              <span className="text-gray-500 ml-1">({duration} min)</span>
                            </span>
                          </div>

                          {event.platform && (
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4 text-gray-600" />
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                                {event.platform}
                              </span>
                            </div>
                          )}

                          {event.botJoined && (
                            <div className="flex items-center gap-2 mt-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">
                                Bot will auto-join
                              </span>
                            </div>
                          )}

                          {event.meetingUrl && !isPast && (
                            <a
                              href={event.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-[#5e72eb] text-white text-sm rounded-lg hover:bg-[#4d5fd1] transition-colors duration-200"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Join Meeting
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Meetings */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Meetings</h2>
              <div className="flex gap-2">
                {['all', 'completed', 'recording', 'processing'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      filter === status
                        ? 'bg-[#5e72eb] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading meetings...</div>
            ) : meetings.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No meetings found</p>
                <Link
                  href="/dashboard/meetings/new"
                  className="inline-block mt-4 px-6 py-2 bg-[#5e72eb] text-white rounded-lg hover:bg-[#4d5fd1] transition-colors duration-200"
                >
                  Start Your First Meeting
                </Link>
              </div>
            ) : (
              meetings.map((meeting) => (
                <Link
                  key={meeting.id}
                  href={`/dashboard/meetings/${meeting.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            meeting.status
                          )}`}
                        >
                          {getStatusIcon(meeting.status)}
                          {meeting.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(meeting.createdAt), 'MMM d, yyyy')}
                        </span>
                        {meeting.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {meeting.duration} min
                          </span>
                        )}
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                          {meeting.platform}
                        </span>
                        {meeting.tasks && meeting.tasks.length > 0 && (
                          <span className="text-[#5e72eb]">{meeting.tasks.length} tasks</span>
                        )}
                      </div>
                    </div>
                    {meeting.usage && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Cost</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${meeting.usage.cost.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
