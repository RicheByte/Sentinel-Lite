import React, { useState } from 'react';
import { ScrollText, Search, Download, Filter, MapPin, Globe } from 'lucide-react';

const LogStream = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.source_ip.includes(searchTerm)
  );

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Timestamp', 'Source IP', 'Country', 'City', 'Message'];
    const rows = filteredLogs.map(log => [
      log.id,
      new Date(log.timestamp).toISOString(),
      log.source_ip,
      log.country || '',
      log.city || '',
      `"${log.message.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg h-96 flex flex-col">
      <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Live Logs</h2>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">
            {filteredLogs.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 text-white text-sm rounded pl-8 pr-3 py-1 w-48 border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {/* Export Dropdown */}
          <div className="relative group">
            <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-gray-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={exportToJSON}
                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600 rounded-t"
              >
                Export JSON
              </button>
              <button
                onClick={exportToCSV}
                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600 rounded-b"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 space-y-2 font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center mt-10">
            {searchTerm ? 'No logs match your search...' : 'No logs received yet...'}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div 
              key={log.id} 
              className="bg-gray-900 p-2 rounded border-l-2 border-blue-500 hover:bg-gray-850 cursor-pointer transition-colors"
              onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
            >
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{new Date(log.timestamp).toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  {log.country && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {log.country_code || log.country}
                    </span>
                  )}
                  {log.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {log.city}
                    </span>
                  )}
                  <span className="font-semibold text-blue-400">{log.source_ip}</span>
                </div>
              </div>
              
              <div className="text-gray-200 break-all">
                {log.message.length > 150 && selectedLog !== log.id
                  ? `${log.message.substring(0, 150)}...`
                  : log.message
                }
              </div>

              {selectedLog === log.id && (
                <div className="mt-2 pt-2 border-t border-gray-700 space-y-1 text-xs text-gray-400">
                  <div><strong>ID:</strong> {log.id}</div>
                  <div><strong>Type:</strong> {log.log_type || 'generic'}</div>
                  {log.user_agent && <div><strong>User Agent:</strong> {log.user_agent}</div>}
                  {log.latitude && log.longitude && (
                    <div><strong>Coordinates:</strong> {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}</div>
                  )}
                  {log.timezone && <div><strong>Timezone:</strong> {log.timezone}</div>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogStream;
