import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Activity, TrendingUp, Globe, AlertTriangle } from 'lucide-react';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const StatsChart = ({ stats }) => {
  const totalData = [
    { name: 'Total Logs', count: stats.total_logs || 0, fill: '#3B82F6' },
    { name: 'Total Alerts', count: stats.total_alerts || 0, fill: '#EF4444' },
  ];

  const recentData = [
    { name: 'Logs (1h)', count: stats.logs_last_hour || 0 },
    { name: 'Alerts (1h)', count: stats.alerts_last_hour || 0 },
  ];

  // Prepare severity data for pie chart
  const severityData = stats.alerts_by_severity
    ? Object.entries(stats.alerts_by_severity).map(([severity, count]) => ({
        name: severity.charAt(0).toUpperCase() + severity.slice(1),
        value: count
      }))
    : [];

  return (
    <div className="space-y-4">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="text-2xl font-bold text-white">{stats.total_logs || 0}</span>
          </div>
          <div className="text-sm text-gray-400">Total Logs</div>
          <div className="text-xs text-green-400 mt-1">
            +{stats.logs_last_hour || 0} in last hour
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-2xl font-bold text-white">{stats.total_alerts || 0}</span>
          </div>
          <div className="text-sm text-gray-400">Total Alerts</div>
          <div className="text-xs text-red-400 mt-1">
            +{stats.alerts_last_hour || 0} in last hour
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
        <div className="flex items-center mb-4 border-b border-gray-700 pb-2">
          <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Activity Overview</h3>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={totalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                cursor={{ fill: '#374151' }}
              />
              <Bar dataKey="count" fill="#60A5FA" barSize={40} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert Severity Distribution */}
      {severityData.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex items-center mb-4 border-b border-gray-700 pb-2">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Alert Severity</h3>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Source IPs */}
      {stats.top_source_ips && stats.top_source_ips.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex items-center mb-3 border-b border-gray-700 pb-2">
            <Globe className="w-5 h-5 mr-2 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Top Source IPs (24h)</h3>
          </div>
          <div className="space-y-2">
            {stats.top_source_ips.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-gray-400 font-mono">{index + 1}.</span>
                  <span className="text-white font-mono">{item.ip}</span>
                  <span className="text-xs text-gray-500">({item.country})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden" style={{ width: '80px' }}>
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min((item.count / stats.top_source_ips[0].count) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-blue-400 font-semibold w-12 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unacknowledged Alerts Indicator */}
      {stats.unacknowledged_alerts > 0 && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-semibold">
              {stats.unacknowledged_alerts} unacknowledged alert{stats.unacknowledged_alerts > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsChart;
