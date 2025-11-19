import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LogStream from './components/LogStream';
import AlertsPanel from './components/AlertsPanel';
import StatsChart from './components/StatsChart';
import { ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from './hooks/useWebSocket';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function App() {
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    total_logs: 0,
    total_alerts: 0,
    unacknowledged_alerts: 0,
    logs_last_hour: 0,
    alerts_last_hour: 0,
    top_source_ips: [],
    alerts_by_severity: {}
  });

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data) => {
    console.log('WebSocket message:', data);

    switch (data.type) {
      case 'new_log':
        setLogs(prevLogs => [data.data, ...prevLogs].slice(0, 100)); // Keep last 100 logs
        break;

      case 'new_alert':
        setAlerts(prevAlerts => [data.data, ...prevAlerts].slice(0, 50)); // Keep last 50 alerts
        // Show toast notification for critical alerts
        if (data.data.severity === 'critical') {
          toast.error(`🚨 CRITICAL: ${data.data.rule_name}`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else if (data.data.severity === 'high') {
          toast.warn(`⚠️ ${data.data.rule_name}`, {
            position: "top-right",
            autoClose: 4000,
          });
        }
        break;

      case 'stats_update':
        setStats(data.data);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

  const { isConnected, reconnectAttempt } = useWebSocket(handleWebSocketMessage);

  // Initial data fetch (fallback for when WebSocket is not connected)
  const fetchData = async () => {
    try {
      const [logsRes, alertsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/logs?limit=100`),
        fetch(`${API_BASE}/alerts?limit=50`),
        fetch(`${API_BASE}/stats`)
      ]);

      if (logsRes.ok) setLogs(await logsRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to fetch data from server");
    }
  };

  // Fetch initial data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fallback polling when WebSocket is not connected
  useEffect(() => {
    let interval;
    if (!isConnected) {
      // Poll every 5 seconds when WebSocket is down
      interval = setInterval(fetchData, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = async (alertId, acknowledgedBy) => {
    try {
      const response = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acknowledged_by: acknowledgedBy })
      });

      if (response.ok) {
        // Update local state
        setAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert.id === alertId
              ? { ...alert, acknowledged: true, acknowledged_by: acknowledgedBy, acknowledged_at: new Date().toISOString() }
              : alert
          )
        );
        toast.success('Alert acknowledged');
        // Refresh stats
        const statsRes = await fetch(`${API_BASE}/stats`);
        if (statsRes.ok) setStats(await statsRes.json());
      } else {
        toast.error('Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <ToastContainer theme="dark" />
      
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative">
            <ShieldCheck className="w-10 h-10 text-blue-500 mr-3" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Sentinel-Lite
            </h1>
            <p className="text-gray-400 text-sm">Advanced SIEM Dashboard v2.0</p>
          </div>
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

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Alerts */}
        <div className="lg:col-span-1 space-y-6">
          <StatsChart stats={stats} />
          <AlertsPanel alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />
        </div>

        {/* Right Column: Logs */}
        <div className="lg:col-span-2">
          <LogStream logs={logs} />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>Sentinel-Lite © 2024 | Real-time Security Information & Event Management</p>
      </footer>
    </div>
  );
}

export default App;
