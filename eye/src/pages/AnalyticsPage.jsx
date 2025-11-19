import React from 'react';
import { Activity, TrendingUp, TrendingDown, Shield } from 'lucide-react';

const AnalyticsPage = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Activity className="w-8 h-8 text-purple-500" />
          Analytics & Insights
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Advanced security analytics and trend analysis
        </p>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-gray-800 rounded-lg p-12 text-center">
        <Activity className="w-16 h-16 text-purple-500 mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-white mb-2">Advanced Analytics</h2>
        <p className="text-gray-400 mb-6">
          This feature is coming soon. It will include:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-2xl mx-auto">
          <div className="bg-gray-700/50 rounded-lg p-4 text-left">
            <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
            <h3 className="text-white font-semibold mb-1">Trend Analysis</h3>
            <p className="text-gray-400 text-sm">Track security trends over time</p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4 text-left">
            <Shield className="w-6 h-6 text-blue-400 mb-2" />
            <h3 className="text-white font-semibold mb-1">Threat Intelligence</h3>
            <p className="text-gray-400 text-sm">Integration with threat feeds</p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4 text-left">
            <Activity className="w-6 h-6 text-purple-400 mb-2" />
            <h3 className="text-white font-semibold mb-1">Attack Patterns</h3>
            <p className="text-gray-400 text-sm">Visualize attack chains and patterns</p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4 text-left">
            <TrendingDown className="w-6 h-6 text-orange-400 mb-2" />
            <h3 className="text-white font-semibold mb-1">Risk Scoring</h3>
            <p className="text-gray-400 text-sm">Automated risk assessment</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
