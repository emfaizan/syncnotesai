'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { meetingsAPI } from '../../../../lib/api';
import {
  Link as LinkIcon,
  Video,
  Calendar,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewMeetingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    meetingUrl: '',
    platform: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

  // Auto-detect platform from URL
  const detectPlatform = (url: string): string => {
    if (url.includes('zoom.us')) return 'zoom';
    if (url.includes('teams.microsoft.com') || url.includes('teams.live.com'))
      return 'teams';
    if (url.includes('meet.google.com')) return 'meet';
    return 'other';
  };

  const handleUrlChange = (url: string) => {
    setFormData({
      ...formData,
      meetingUrl: url,
      platform: detectPlatform(url),
    });
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Please enter a meeting title');
      return false;
    }
    if (!formData.meetingUrl.trim()) {
      toast.error('Please enter a meeting URL');
      return false;
    }
    if (!formData.platform) {
      toast.error('Could not detect meeting platform. Please check the URL.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setStep('processing');

      const response = await meetingsAPI.create({
        title: formData.title,
        description: formData.description,
        meetingUrl: formData.meetingUrl,
        platform: formData.platform,
      });

      const meetingId = response.data.data.id;

      setStep('success');
      toast.success('Meeting bot is joining the meeting!');

      // Redirect to meeting details page after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/meetings/${meetingId}`);
      }, 2000);
    } catch (error: any) {
      setStep('form');
      const errorMessage =
        error.response?.data?.message ||
        'Failed to start recording. Please check the meeting URL and try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return '🎥';
      case 'teams':
        return '👥';
      case 'meet':
        return '📹';
      default:
        return '🎬';
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return 'Zoom';
      case 'teams':
        return 'Microsoft Teams';
      case 'meet':
        return 'Google Meet';
      default:
        return 'Unknown';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5e72eb] to-[#FF9190] flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Record New Meeting</h1>
          <p className="text-gray-600 mt-2">
            Add a bot to your meeting to automatically record and transcribe
          </p>
        </div>

        {/* Form or Status */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Meeting URL */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <LinkIcon className="w-5 h-5 text-[#5e72eb]" />
                <h2 className="text-lg font-semibold text-gray-900">Meeting Link</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.meetingUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e72eb] focus:border-transparent"
                    placeholder="https://zoom.us/j/123456789 or https://meet.google.com/abc-defg-hij"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Supports Zoom, Google Meet, and Microsoft Teams
                  </p>
                </div>

                {/* Platform Detection */}
                {formData.platform && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">
                        {getPlatformIcon(formData.platform)}{' '}
                        {getPlatformName(formData.platform)} detected
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Meeting Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#5e72eb]" />
                <h2 className="text-lg font-semibold text-gray-900">Meeting Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e72eb] focus:border-transparent"
                    placeholder="Weekly Team Standup"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e72eb] focus:border-transparent resize-none"
                    placeholder="Add notes about this meeting..."
                  />
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-2">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      A recording bot will join your meeting using the provided link
                    </li>
                    <li>
                      The bot will record audio, video, and transcribe the conversation
                    </li>
                    <li>
                      After the meeting ends, you&apos;ll get AI-generated summaries,
                      tasks, and key points
                    </li>
                    <li>You can sync tasks directly to ClickUp</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#5e72eb] text-white rounded-lg hover:bg-[#4d5fd1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg shadow-[#5e72eb]/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting Bot...
                  </>
                ) : (
                  <>
                    Start Recording
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Processing State */}
        {step === 'processing' && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 border-4 border-[#5e72eb] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Starting Recording Bot...
            </h3>
            <p className="text-gray-600">
              The bot is joining your meeting. This may take a few seconds.
            </p>
          </div>
        )}

        {/* Success State */}
        {step === 'success' && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Bot Successfully Joined!
            </h3>
            <p className="text-gray-600 mb-6">
              The recording bot is now in your meeting. Redirecting to meeting
              details...
            </p>
            <div className="inline-flex items-center gap-2 text-[#5e72eb]">
              <Clock className="w-4 h-4 animate-spin" />
              <span className="text-sm">Redirecting...</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
