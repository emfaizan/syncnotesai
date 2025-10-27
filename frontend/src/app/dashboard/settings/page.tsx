'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { userAPI, calendarAPI } from '@/services/apiService';
import { User, Bell, Trash2, Globe, Save, Calendar, RefreshCw, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    company: '',
  });
  const [settings, setSettings] = useState({
    autoRecord: true,
    notifications: {
      email: true,
      meetingComplete: true,
      lowCredits: true,
    },
    language: 'en',
    timezone: 'America/Los_Angeles',
  });
  const [calendarSettings, setCalendarSettings] = useState({
    autoJoinEnabled: false,
    autoJoinLeadTime: 2,
  });
  const [calendarConnections, setCalendarConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingCalendar, setConnectingCalendar] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [profileRes, calendarSettingsRes, connectionsRes] = await Promise.all([
        userAPI.getProfile(),
        calendarAPI.getSettings(),
        calendarAPI.getConnections(),
      ]);

      const user = profileRes.data.data;
      setProfile({
        name: user.name || '',
        email: user.email || '',
        company: user.company || '',
      });

      const calSettings = calendarSettingsRes.data.data;
      if (calSettings) {
        setCalendarSettings({
          autoJoinEnabled: calSettings.autoJoinEnabled || false,
          autoJoinLeadTime: calSettings.autoJoinLeadTime || 2,
        });
      }

      const connections = connectionsRes.data.data.connections || [];
      setCalendarConnections(connections);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await userAPI.updateProfile(profile);

      // Update localStorage with new user data
      const updatedUser = response.data.data.user || response.data.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('Profile updated successfully');

      // Reload the page to reflect changes in the sidebar
      window.location.reload();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await userAPI.updateSettings(settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      setConnectingCalendar(true);
      const res = await calendarAPI.getGoogleAuthUrl();
      const authUrl = res.data.data.authUrl;
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error) {
      toast.error('Failed to initiate calendar connection');
      setConnectingCalendar(false);
    }
  };

  const handleSyncCalendar = async (connectionId: string) => {
    try {
      setSyncingCalendar(connectionId);
      await calendarAPI.syncConnection(connectionId);
      toast.success('Calendar synced successfully');
      await loadSettings();
    } catch (error) {
      toast.error('Failed to sync calendar');
    } finally {
      setSyncingCalendar(null);
    }
  };

  const handleDisconnectCalendar = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this calendar?')) {
      return;
    }

    try {
      await calendarAPI.disconnectCalendar(connectionId);
      toast.success('Calendar disconnected successfully');
      await loadSettings();
    } catch (error) {
      toast.error('Failed to disconnect calendar');
    }
  };

  const handleSaveCalendarSettings = async () => {
    try {
      setSaving(true);
      await calendarAPI.updateSettings(calendarSettings);
      toast.success('Auto-join settings updated successfully');
    } catch (error) {
      toast.error('Failed to update auto-join settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'This will permanently delete your account and all data. Type "DELETE" to confirm:'
    );

    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      await userAPI.deleteAccount();
      toast.success('Account deleted successfully');
      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#5e72eb] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Profile Settings */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#5e72eb]" />
              <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e72eb] focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e72eb] focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company (Optional)
              </label>
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e72eb] focus:border-transparent"
                placeholder="Acme Inc."
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#5e72eb] text-white rounded-lg hover:bg-[#4d5fd1] disabled:opacity-50 transition-colors duration-200"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Calendar Integration */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#5e72eb]" />
              <h2 className="text-xl font-bold text-gray-900">Calendar Integration</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Connect your calendar to automatically join meetings
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Connected Calendars */}
            {calendarConnections.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Connected Calendars</h3>
                {calendarConnections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#5e72eb] rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {connection.calendarName || connection.calendarEmail}
                        </div>
                        <div className="text-sm text-gray-600">{connection.calendarEmail}</div>
                        {connection.lastSyncAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Last synced: {new Date(connection.lastSyncAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      {connection.isActive && connection.syncEnabled && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSyncCalendar(connection.id)}
                        disabled={syncingCalendar === connection.id}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${
                            syncingCalendar === connection.id ? 'animate-spin' : ''
                          }`}
                        />
                        {syncingCalendar === connection.id ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <button
                        onClick={() => handleDisconnectCalendar(connection.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No calendars connected</p>
                <button
                  onClick={handleConnectGoogleCalendar}
                  disabled={connectingCalendar}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#5e72eb] text-white rounded-lg hover:bg-[#4d5fd1] disabled:opacity-50 transition-colors duration-200"
                >
                  <Calendar className="w-4 h-4" />
                  {connectingCalendar ? 'Connecting...' : 'Connect Google Calendar'}
                </button>
              </div>
            )}

            {/* Auto-Join Settings */}
            {calendarConnections.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mt-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Auto-Join Settings</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Enable Auto-Join</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Automatically join meetings from your calendar
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setCalendarSettings({
                        ...calendarSettings,
                        autoJoinEnabled: !calendarSettings.autoJoinEnabled,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      calendarSettings.autoJoinEnabled ? 'bg-[#5e72eb]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        calendarSettings.autoJoinEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {calendarSettings.autoJoinEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Join Lead Time (minutes before meeting)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={calendarSettings.autoJoinLeadTime}
                      onChange={(e) =>
                        setCalendarSettings({
                          ...calendarSettings,
                          autoJoinLeadTime: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e72eb] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The bot will join {calendarSettings.autoJoinLeadTime} minute(s) before the meeting starts
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSaveCalendarSettings}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#5e72eb] text-white rounded-lg hover:bg-[#4d5fd1] disabled:opacity-50 transition-colors duration-200"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Auto-Join Settings'}
                </button>
              </div>
            )}

            {/* Add Another Calendar Button */}
            {calendarConnections.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <button
                  onClick={handleConnectGoogleCalendar}
                  disabled={connectingCalendar}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                >
                  <Calendar className="w-4 h-4" />
                  {connectingCalendar ? 'Connecting...' : 'Connect Another Calendar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#5e72eb]" />
              <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-600 mt-1">Receive email updates and alerts</p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: !settings.notifications.email },
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  settings.notifications.email ? 'bg-[#5e72eb]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Meeting Complete Alerts</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Notify when meeting processing is complete
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      meetingComplete: !settings.notifications.meetingComplete,
                    },
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  settings.notifications.meetingComplete ? 'bg-[#5e72eb]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    settings.notifications.meetingComplete ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Low Credits Warning</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Alert when credits are running low
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      lowCredits: !settings.notifications.lowCredits,
                    },
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  settings.notifications.lowCredits ? 'bg-[#5e72eb]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    settings.notifications.lowCredits ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#5e72eb] text-white rounded-lg hover:bg-[#4d5fd1] disabled:opacity-50 transition-colors duration-200"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Language & Region */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#5e72eb]" />
              <h2 className="text-xl font-bold text-gray-900">Language & Region</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e72eb] focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e72eb] focus:border-transparent"
              >
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#5e72eb] text-white rounded-lg hover:bg-[#4d5fd1] disabled:opacity-50 transition-colors duration-200"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl">
          <div className="p-6 border-b border-red-200">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-red-900">Danger Zone</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-red-900">Delete Account</h3>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete your account and all associated data. This action cannot be
                  undone.
                </p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
