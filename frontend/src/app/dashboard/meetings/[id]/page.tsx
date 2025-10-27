'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { meetingsAPI } from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  ListTodo,
  Download,
  Trash2,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string | null;
  assignee: string | null;
  status: string;
  clickupTaskId: string | null;
}

interface Meeting {
  id: string;
  title: string;
  description: string;
  status: string;
  platform: string;
  duration: number;
  createdAt: string;
  recordingUrl: string | null;
  transcript: {
    content: string;
  };
  summary: {
    content: string;
  };
  tasks: Task[];
  usage: {
    cost: number;
  };
}

export default function MeetingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params?.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (meetingId) {
      loadMeeting();
    }
  }, [meetingId]);

  const loadMeeting = async () => {
    try {
      setLoading(true);
      const res = await meetingsAPI.get(meetingId);
      setMeeting(res.data.data);
    } catch (error) {
      console.error('Failed to load meeting:', error);
      toast.error('Failed to load meeting details');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === meeting?.tasks.filter((t) => !t.clickupTaskId).length) {
      setSelectedTasks(new Set());
    } else {
      const allTaskIds = meeting?.tasks.filter((t) => !t.clickupTaskId).map((t) => t.id) || [];
      setSelectedTasks(new Set(allTaskIds));
    }
  };

  const handleSyncToClickUp = async () => {
    if (selectedTasks.size === 0) {
      toast.error('Please select at least one task');
      return;
    }

    try {
      setSyncing(true);
      await meetingsAPI.syncToClickUp(meetingId);
      toast.success('Tasks synced to ClickUp successfully!');
      loadMeeting(); // Reload to get updated task status
      setSelectedTasks(new Set());
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sync tasks');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      return;
    }

    try {
      await meetingsAPI.delete(meetingId);
      toast.success('Meeting deleted successfully');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to delete meeting');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#5e72eb] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading meeting details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!meeting) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-gray-600 mb-4">Meeting not found</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[#5e72eb] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
              {meeting.description && (
                <p className="text-gray-600 mt-2">{meeting.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(meeting.createdAt), 'MMM d, yyyy h:mm a')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {meeting.duration} minutes
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                  {meeting.platform}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {meeting.recordingUrl && (
                <a
                  href={meeting.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  Recording
                </a>
              )}
              <button
                onClick={handleDeleteMeeting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        {meeting.summary && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-[#5e72eb]" />
              <h2 className="text-xl font-bold text-gray-900">AI Summary</h2>
            </div>
            <div
              className="prose max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: meeting.summary.content.replace(/\n/g, '<br/>') }}
            />
          </div>
        )}

        {/* Tasks */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-[#5e72eb]" />
                <h2 className="text-xl font-bold text-gray-900">Suggested Tasks</h2>
                <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
                  {meeting.tasks.length}
                </span>
              </div>
              {meeting.tasks.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    {selectedTasks.size === meeting.tasks.filter((t) => !t.clickupTaskId).length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                  <button
                    onClick={handleSyncToClickUp}
                    disabled={selectedTasks.size === 0 || syncing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#5e72eb] text-white rounded-lg hover:bg-[#4d5fd1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <Send className="w-4 h-4" />
                    {syncing ? 'Syncing...' : `Sync to ClickUp (${selectedTasks.size})`}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {meeting.tasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No tasks extracted from this meeting</div>
            ) : (
              meeting.tasks.map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-start gap-4">
                    {!task.clickupTaskId && (
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => handleTaskToggle(task.id)}
                        className="mt-1 w-5 h-5 text-[#5e72eb] border-gray-300 rounded focus:ring-[#5e72eb]"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.clickupTaskId && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Synced to ClickUp
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-gray-600 mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {task.assignee && <span>Assignee: {task.assignee}</span>}
                        {task.dueDate && (
                          <span>Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transcript */}
        {meeting.transcript && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Full Transcript</h2>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {meeting.transcript.content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
