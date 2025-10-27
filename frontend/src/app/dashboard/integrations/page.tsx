'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { clickupAPI, userAPI } from '@/services/apiService';
import { CheckCircle, XCircle, ExternalLink, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  status?: string;
}

export default function IntegrationsPage() {
  const [clickupConnected, setClickupConnected] = useState(false);
  const [calendarConnected, _setCalendarConnected] = useState(false);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  const loadIntegrationStatus = async () => {
    try {
      const res = await userAPI.getProfile();
      const user = res.data.data;
      setClickupConnected(user.clickupConnected || false);
      // TODO: Add calendar connection check
    } catch (_error) {
      console.error('Failed to load integration status:', _error);
    } finally {
      setLoading(false);
    }
  };

  const handleClickUpConnect = async () => {
    try {
      const res = await clickupAPI.getAuthUrl();
      const authUrl = res.data.data.url;
      // Open OAuth window
      window.location.href = authUrl;
    } catch (_error) {
      toast.error('Failed to initiate ClickUp connection');
    }
  };

  const handleClickUpDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect ClickUp? This will stop syncing tasks.')) {
      return;
    }

    try {
      await clickupAPI.disconnect();
      setClickupConnected(false);
      toast.success('ClickUp disconnected successfully');
    } catch (_error) {
      toast.error('Failed to disconnect ClickUp');
    }
  };

  const handleCalendarConnect = () => {
    toast('Google Calendar integration coming soon!', { icon: 'ℹ️' });
  };

  const integrations: Integration[] = [
    {
      id: 'clickup',
      name: 'ClickUp',
      description: 'Automatically create tasks from meeting action items in your ClickUp workspace',
      icon: '📋',
      connected: clickupConnected,
      status: clickupConnected ? 'Active' : 'Not Connected',
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Sync meeting schedules and automatically join meetings from your calendar',
      icon: '📅',
      connected: calendarConnected,
      status: calendarConnected ? 'Active' : 'Coming Soon',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">
            Connect your favorite tools to enhance your meeting workflow
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{integration.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{integration.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {integration.connected ? (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          {integration.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                          <XCircle className="w-4 h-4" />
                          {integration.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-6">{integration.description}</p>

              <div className="space-y-3">
                {integration.id === 'clickup' && (
                  <>
                    {clickupConnected ? (
                      <>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span className="text-sm text-green-800 font-medium">
                            ClickUp workspace connected
                          </span>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <button
                          onClick={handleClickUpDisconnect}
                          className="w-full px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
                        >
                          Disconnect ClickUp
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleClickUpConnect}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#5e72eb] text-white rounded-lg hover:bg-[#4d5fd1] transition-colors duration-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Connect ClickUp
                      </button>
                    )}
                  </>
                )}

                {integration.id === 'google-calendar' && (
                  <button
                    onClick={handleCalendarConnect}
                    disabled
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
                  >
                    <Calendar className="w-4 h-4" />
                    Coming Soon
                  </button>
                )}
              </div>

              {/* Features list */}
              {integration.id === 'clickup' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Features:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Auto-create tasks from meeting action items</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Assign tasks to team members</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Set due dates and priorities automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Organize tasks by lists and folders</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Help section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Need help with integrations?</h3>
          <p className="text-blue-800 mb-4">
            Check out our documentation for step-by-step guides on connecting your favorite tools.
          </p>
          <a
            href="https://docs.syncnotesai.com/integrations"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            View Documentation
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
