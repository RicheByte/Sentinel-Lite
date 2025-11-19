import React from 'react';
import { Settings as SettingsIcon, Bell, Volume2, Mail, Webhook } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-gray-400" />
          Settings
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Configure notification preferences and system settings
        </p>
      </div>

      {/* Notification Settings */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </h2>
        
        <div className="space-y-4">
          {/* Browser Notifications */}
          <div className="flex items-center justify-between py-3 border-b border-gray-700">
            <div>
              <h3 className="text-white font-medium">Desktop Notifications</h3>
              <p className="text-gray-400 text-sm">Receive browser push notifications for alerts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Sound Alerts */}
          <div className="flex items-center justify-between py-3 border-b border-gray-700">
            <div>
              <h3 className="text-white font-medium flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Sound Alerts
              </h3>
              <p className="text-gray-400 text-sm">Play audio for high/critical alerts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          {/* Email Notifications */}
          <div className="py-3 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Notifications
                </h3>
                <p className="text-gray-400 text-sm">Send email alerts for critical incidents</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            <div className="mt-3">
              <label className="text-gray-400 text-sm">Recipients (comma-separated)</label>
              <input
                type="text"
                placeholder="admin@example.com, security@example.com"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 mt-1"
              />
            </div>
          </div>

          {/* Webhook Notifications */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Webhook className="w-4 h-4" />
                  Webhook Integration
                </h3>
                <p className="text-gray-400 text-sm">Send alerts to Slack, Discord, or custom webhooks</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-gray-400 text-sm">Webhook URL</label>
                <input
                  type="text"
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Type</label>
                <select className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 mt-1">
                  <option value="slack">Slack</option>
                  <option value="discord">Discord</option>
                  <option value="generic">Generic Webhook</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
            Save Settings
          </button>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">System Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-400 text-sm">Version</div>
            <div className="text-white font-medium">2.0.0</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Backend API</div>
            <div className="text-white font-medium">{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
