import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'react-toastify';

import LogStream from '../components/LogStream';
import AlertsPanel from '../components/AlertsPanel';
import StatsChart from '../components/StatsChart';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const Dashboard = ({ 
  logs = [], 
  alerts = [], 
  stats = {}, 
  isConnected = false, 
  reconnectAttempt = 0,
  onAcknowledgeAlert = null 
}) => {
  return (
    <div className="p-6">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time monitoring and threat detection</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* WebSocket Status */}
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-400 animate-pulse" />
                <span className="text-green-400 text-sm font-semibold">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-semibold">
                  {reconnectAttempt > 0 ? `Reconnecting... (${reconnectAttempt})` : 'Disconnected'}
                </span>
              </>
            )}
          </div>

          {/* System Status */}
          <div className="text-right bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">System Status</div>
            <div className="flex items-center text-green-400 font-semibold">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Active
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Alerts */}
        <div className="lg:col-span-1 space-y-6">
          <StatsChart stats={stats} />
          <AlertsPanel 
            alerts={alerts.slice(0, 10)} 
            onAcknowledge={onAcknowledgeAlert} 
          />
        </div>

        {/* Right Column: Logs */}
        <div className="lg:col-span-2">
          <LogStream logs={logs} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
