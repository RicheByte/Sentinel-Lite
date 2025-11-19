import React, { useState } from 'react';
import { FileText, Download, Search, Filter, Calendar } from 'lucide-react';
import LogStream from '../components/LogStream';

const LogsPage = ({ logs = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterIP, setFilterIP] = useState('');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' ||
                         log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source_ip.includes(searchTerm);
    const matchesCountry = filterCountry === '' || log.country === filterCountry;
    const matchesIP = filterIP === '' || log.source_ip.includes(filterIP);
    return matchesSearch && matchesCountry && matchesIP;
  });

  const exportLogs = (format = 'json') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(filteredLogs, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logs_${new Date().toISOString()}.json`;
      link.click();
    } else if (format === 'csv') {
      const headers = ['Timestamp', 'Source IP', 'Country', 'Message'];
      const csvContent = [
        headers.join(','),
        ...filteredLogs.map(log => 
          [
            log.timestamp,
            log.source_ip,
            log.country || 'Unknown',
            `"${log.message.replace(/"/g, '""')}"`
          ].join(',')
        )
      ].join('\n');
      
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logs_${new Date().toISOString()}.csv`;
      link.click();
    }
  };

  const uniqueCountries = [...new Set(logs.map(l => l.country).filter(Boolean))];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-500" />
          Log Explorer
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Search, filter, and analyze security logs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Logs</div>
          <div className="text-2xl font-bold text-white mt-1">{logs.length}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Filtered</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{filteredLogs.length}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Unique IPs</div>
          <div className="text-2xl font-bold text-white mt-1">
            {[...new Set(logs.map(l => l.source_ip))].length}
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Countries</div>
          <div className="text-2xl font-bold text-white mt-1">{uniqueCountries.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <label className="text-gray-400 text-sm mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* IP Filter */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Source IP</label>
            <input
              type="text"
              placeholder="Filter by IP..."
              value={filterIP}
              onChange={(e) => setFilterIP(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Country Filter */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Country</label>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Countries</option>
              {uniqueCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => exportLogs('json')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button
            onClick={() => exportLogs('csv')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Logs Display */}
      <LogStream logs={filteredLogs} />
    </div>
  );
};

export default LogsPage;
