import React, { useState } from 'react';
import { Shield, AlertTriangle, Check, Filter, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AlertsPanel from '../components/AlertsPanel';

const AlertsPage = ({ alerts = [], onAcknowledge = null }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'unacknowledged' && !alert.acknowledged) ||
                         alert.severity === filter;
    const matchesSearch = searchTerm === '' || 
                         alert.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.source_ip.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const exportAlerts = () => {
    const dataStr = JSON.stringify(filteredAlerts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alerts_${new Date().toISOString()}.json`;
    link.click();
  };

  const severityCounts = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-red-500" />
          Security Alerts
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Monitor and manage security incidents
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <div className="text-red-400 text-sm font-semibold">Critical</div>
          <div className="text-3xl font-bold text-white mt-1">{severityCounts.critical}</div>
        </div>
        <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4">
          <div className="text-orange-400 text-sm font-semibold">High</div>
          <div className="text-3xl font-bold text-white mt-1">{severityCounts.high}</div>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
          <div className="text-yellow-400 text-sm font-semibold">Medium</div>
          <div className="text-3xl font-bold text-white mt-1">{severityCounts.medium}</div>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
          <div className="text-blue-400 text-sm font-semibold">Low</div>
          <div className="text-3xl font-bold text-white mt-1">{severityCounts.low}</div>
        </div>
        <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4">
          <div className="text-purple-400 text-sm font-semibold">Unacknowledged</div>
          <div className="text-3xl font-bold text-white mt-1">{severityCounts.unacknowledged}</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Dropdown */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Alerts</option>
          <option value="unacknowledged">Unacknowledged</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Export Button */}
        <button
          onClick={exportAlerts}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        {/* Clear Filters */}
        {(filter !== 'all' || searchTerm !== '') && (
          <button
            onClick={() => {
              setFilter('all');
              setSearchTerm('');
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        {filteredAlerts.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No alerts found</p>
            <p className="text-sm mt-2">Adjust your filters or check back later</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                {filteredAlerts.length} Alert{filteredAlerts.length !== 1 ? 's' : ''}
              </h2>
            </div>
            <AlertsPanel 
              alerts={filteredAlerts} 
              onAcknowledge={onAcknowledge} 
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
