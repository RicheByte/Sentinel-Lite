import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import AlertsPage from './pages/AlertsPage';
import LogsPage from './pages/LogsPage';
import RulesPage from './pages/RulesPage';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';

import { useWebSocket } from './hooks/useWebSocket';
import { useNotifications } from './hooks/useNotifications';

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

  // Initialize notifications hook
  const { sendNotification, permission } = useNotifications();

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data) => {
    console.log('WebSocket message:', data);

    switch (data.type) {
      case 'new_log':
        setLogs(prevLogs => [data.data, ...prevLogs].slice(0, 100)); // Keep last 100 logs
        break;

      case 'new_alert':
        const alert = data.data;
        setAlerts(prevAlerts => [alert, ...prevAlerts]);
        
        // Show toast notification
        const toastOptions = {
          position: "top-right",
          autoClose: alert.severity === 'CRITICAL' ? false : 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        };

        if (alert.severity === 'CRITICAL') {
          toast.error(`🚨 CRITICAL: ${alert.description}`, toastOptions);
        } else if (alert.severity === 'HIGH') {
          toast.warn(`⚠️ HIGH: ${alert.description}`, toastOptions);
        }

        // Send desktop notification for critical/high severity
        if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
          sendNotification({
            title: `${alert.severity} Alert`,
            body: alert.description,
            severity: alert.severity
          });
        }
        break;

      case 'stats_update':
        setStats(data.data);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, [sendNotification]);

  // Initialize WebSocket
  const { isConnected } = useWebSocket(handleWebSocketMessage);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [logsRes, alertsRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/logs?limit=100`),
          fetch(`${API_BASE}/alerts?limit=50`),
          fetch(`${API_BASE}/stats`)
        ]);

        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData);
        }

        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          setAlerts(alertsData);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        toast.error('Failed to connect to backend');
      }
    };

    fetchInitialData();
  }, []);

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const response = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });

      if (response.ok) {
        setAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
          )
        );
        toast.success('Alert acknowledged');
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  // Common props for all pages
  const pageProps = {
    logs,
    alerts,
    stats,
    isConnected,
    onAcknowledgeAlert: handleAcknowledgeAlert
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <ToastContainer theme="dark" position="top-right" />
        
        {/* SIDEBAR */}
        <Sidebar />
        
        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard {...pageProps} />} />
            <Route path="/alerts" element={<AlertsPage alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />} />
            <Route path="/logs" element={<LogsPage logs={logs} />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
