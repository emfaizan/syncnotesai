'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { meetingsAPI, billingAPI } from '@/lib/api';
import { Calendar, Clock, DollarSign, TrendingUp, Play, CheckCircle, XCircle } from 'lucide-react';
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

export default function Dashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'recording' | 'processing'>('all');

  useEffect(() => {
    loadDashboardData();
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
