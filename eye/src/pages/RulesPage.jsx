import React, { useState, useEffect } from 'react';
import { Database, Plus, Eye, EyeOff, Edit, Trash2, X, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const RulesPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    severity: 'medium',
    threshold: 1,
    time_window: 60,
    condition_type: 'substring',
    condition: '',
    description: '',
    enabled: true,
    priority: 5
  });

  // Fetch rules
  const fetchRules = async () => {
    try {
      const response = await fetch(`${API_BASE}/rules`);
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      } else {
        toast.error('Failed to fetch rules');
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingRule 
        ? `${API_BASE}/rules/${editingRule.id}`
        : `${API_BASE}/rules`;
      
      const method = editingRule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingRule ? 'Rule updated' : 'Rule created');
        setIsModalOpen(false);
        fetchRules();
      } else {
        toast.error('Failed to save rule');
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Error saving rule');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/rules/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Rule deleted');
        fetchRules();
      } else {
        toast.error('Failed to delete rule');
      }
    } catch (error) {
      toast.error('Error deleting rule');
    }
  };

  // Handle toggle
  const handleToggle = async (rule) => {
    try {
      const response = await fetch(`${API_BASE}/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !rule.enabled })
      });

      if (response.ok) {
        toast.success(`Rule ${rule.enabled ? 'disabled' : 'enabled'}`);
        fetchRules();
      }
    } catch (error) {
      toast.error('Failed to toggle rule');
    }
  };

  const openModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        rule_name: rule.rule_name,
        severity: rule.severity,
        threshold: rule.threshold,
        time_window: rule.time_window,
        condition_type: rule.condition_type || 'substring',
        condition: rule.condition || '',
        description: rule.description || '',
        enabled: rule.enabled,
        priority: rule.priority || 5
      });
    } else {
      setEditingRule(null);
      setFormData({
        rule_name: '',
        severity: 'medium',
        threshold: 1,
        time_window: 60,
        condition_type: 'substring',
        condition: '',
        description: '',
        enabled: true,
        priority: 5
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 relative">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-500" />
            Detection Rules
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage security detection rules and thresholds
          </p>
        </div>
        <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      {/* Rules Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rule Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Condition</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Threshold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-white font-medium">{rule.rule_name}</div>
                  <div className="text-xs text-gray-500">{rule.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${
                    rule.severity === 'critical' ? 'bg-red-900/20 text-red-400' :
                    rule.severity === 'high' ? 'bg-orange-900/20 text-orange-400' :
                    'bg-yellow-900/20 text-yellow-400'
                  }`}>
                    {rule.severity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                  <span className="text-xs bg-gray-700 px-1 rounded mr-1">{rule.condition_type}</span>
                  {rule.condition}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {rule.threshold} / {rule.time_window}s
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleToggle(rule)} className="flex items-center gap-2">
                    {rule.enabled ? (
                      <>
                        <Eye className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm">Enabled</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-500 text-sm">Disabled</span>
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => openModal(rule)} className="text-blue-400 hover:text-blue-300">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(rule.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rules.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No rules found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingRule ? 'Edit Rule' : 'New Rule'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Rule Name</label>
                <Input
                  required
                  value={formData.rule_name}
                  onChange={e => setFormData({...formData, rule_name: e.target.value})}
                  placeholder="e.g., SQL Injection Attempt"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={e => setFormData({...formData, severity: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Condition Type</label>
                  <select
                    value={formData.condition_type}
                    onChange={e => setFormData({...formData, condition_type: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="substring">Substring</option>
                    <option value="exact">Exact Match</option>
                    <option value="regex">Regex</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Match Condition
                  {formData.condition_type === 'regex' && <span className="text-xs text-yellow-500 ml-2">(Python Regex)</span>}
                </label>
                <Input
                  required
                  value={formData.condition}
                  onChange={e => setFormData({...formData, condition: e.target.value})}
                  placeholder={formData.condition_type === 'regex' ? 'e.g., ^admin.*' : 'e.g., failed password'}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Threshold (Events)</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.threshold}
                    onChange={e => setFormData({...formData, threshold: parseInt(e.target.value)})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Time Window (sec)</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.time_window}
                    onChange={e => setFormData({...formData, time_window: parseInt(e.target.value)})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Alert description..."
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Rule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesPage;
