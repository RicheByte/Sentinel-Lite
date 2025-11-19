import React, { useState } from 'react';
import { AlertTriangle, Check, CheckCircle, Shield, Flame, AlertCircle, Info, X } from 'lucide-react';

const severityConfig = {
  critical: {
    icon: Flame,
    color: 'red',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-900/20',
    textColor: 'text-red-400',
    iconColor: 'text-red-500'
  },
  high: {
    icon: AlertTriangle,
    color: 'orange',
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-900/20',
    textColor: 'text-orange-400',
    iconColor: 'text-orange-500'
  },
  medium: {
    icon: AlertCircle,
    color: 'yellow',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-900/20',
    textColor: 'text-yellow-400',
    iconColor: 'text-yellow-500'
  },
  low: {
    icon: Info,
    color: 'blue',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-900/20',
    textColor: 'text-blue-400',
    iconColor: 'text-blue-500'
  }
};

const AlertsPanel = ({ alerts, onAcknowledge }) => {
  const [filter, setFilter] = useState('all'); // all, critical, high, medium, low, unacknowledged
  const [expandedAlert, setExpandedAlert] = useState(null);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unacknowledged') return !alert.acknowledged;
    return alert.severity === filter;
  });

  const handleAcknowledge = async (alertId) => {
    if (onAcknowledge) {
      await onAcknowledge(alertId, 'User');
    }
  };

  const getSeverityConfig = (severity) => {
    return severityConfig[severity?.toLowerCase()] || severityConfig.medium;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg h-96 flex flex-col">
      <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
        <div className="flex items-center">
          <Shield className="w-5 h-5 mr-2 text-red-500" />
          <h2 className="text-xl font-semibold text-white">Security Alerts</h2>
          <span className="ml-3 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded">
            {filteredAlerts.length}
          </span>
        </div>
        
        {/* Filter dropdown */}
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All</option>
          <option value="unacknowledged">Unacknowledged</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="overflow-y-auto flex-1 space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="text-gray-500 text-center mt-10 flex flex-col items-center">
            <CheckCircle className="w-12 h-12 mb-2 text-green-500" />
            <div>No alerts matching filter</div>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const config = getSeverityConfig(alert.severity);
            const Icon = config.icon;
            const isExpanded = expandedAlert === alert.id;
            
            return (
              <div 
                key={alert.id} 
                className={`${config.bgColor} p-3 rounded border-l-4 ${config.borderColor} transition-all hover:shadow-lg cursor-pointer ${
                  alert.acknowledged ? 'opacity-60' : ''
                }`}
                onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2 flex-1">
                    <Icon className={`w-4 h-4 ${config.iconColor}`} />
                    <span className={`font-bold ${config.textColor}`}>{alert.rule_name}</span>
                    {alert.acknowledged && (
                      <CheckCircle className="w-4 h-4 text-green-500" title="Acknowledged" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${config.bgColor} ${config.textColor}`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-300 mb-2">{alert.description}</div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                    <div className="text-xs text-gray-400">
                      <strong>Source IP:</strong> {alert.source_ip}
                    </div>
                    <div className="text-xs text-gray-400">
                      <strong>Full Timestamp:</strong> {new Date(alert.timestamp).toLocaleString()}
                    </div>
                    {alert.acknowledged && (
                      <>
                        <div className="text-xs text-gray-400">
                          <strong>Acknowledged by:</strong> {alert.acknowledged_by || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400">
                          <strong>Acknowledged at:</strong> {new Date(alert.acknowledged_at).toLocaleString()}
                        </div>
                      </>
                    )}
                    
                    {!alert.acknowledged && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledge(alert.id);
                        }}
                        className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Acknowledge
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
