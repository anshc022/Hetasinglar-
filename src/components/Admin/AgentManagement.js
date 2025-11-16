import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAuth } from '../../services/adminApi';

const AgentForm = ({ agent, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    agentId: agent?.agentId || '',
    name: agent?.name || '',
    email: agent?.email || '',
    password: '',
    role: agent?.role || 'agent',
    permissions: agent?.permissions || {
      canMessage: true,
      canModerate: false,
      canViewStats: true
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {agent ? 'Edit Agent' : 'Create New Agent'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Agent ID</label>
            <input
              type="text"
              value={formData.agentId}
              onChange={(e) => setFormData({...formData, agentId: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          {!agent && (
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="agent">Agent</option>
              <option value="senior_agent">Senior Agent</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Permissions</label>
            <div className="space-y-1">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.permissions.canMessage}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      canMessage: e.target.checked
                    }
                  })}
                  className="mr-2"
                />
                Can Message Customers
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.permissions.canModerate}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      canModerate: e.target.checked
                    }
                  })}
                  className="mr-2"
                />
                Can Moderate Content
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.permissions.canViewStats}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      canViewStats: e.target.checked
                    }
                  })}
                  className="mr-2"
                />
                Can View Statistics
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600"
            >
              {agent ? 'Update Agent' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

// Responsive AgentsTable component with mobile cards and desktop table
const AgentsTable = ({ agents, onEdit, onDelete, onEditPermissions }) => (
  <>
    {/* Mobile Card View */}
    <div className="block md:hidden space-y-4">
      {agents.map(agent => (
        <div key={agent.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          {/* Header with agent info */}
          <div className="flex items-center mb-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {agent.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <h3 className="text-gray-900 font-semibold text-base truncate">{agent.name}</h3>
              <p className="text-gray-500 text-sm truncate">{agent.email}</p>
              <p className="text-gray-400 text-xs">ID: {agent.agentId}</p>
            </div>
          </div>
          
          {/* Role Badge */}
          <div className="mb-3">
            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
              {agent.role}
            </span>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{agent.stats?.totalMessages || 0}</div>
              <div className="text-xs text-gray-500">Messages</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{agent.stats?.totalCustomers || 0}</div>
              <div className="text-xs text-gray-500">Customers</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900">{agent.stats?.avgResponseTime || 'N/A'}</div>
              <div className="text-xs text-gray-500">Resp. Time</div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="grid grid-cols-3 gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onEditPermissions(agent)}
              className="flex items-center justify-center px-3 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Perms
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onEdit(agent)}
              className="flex items-center justify-center px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
            >
              Edit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onDelete(agent.id)}
              className="flex items-center justify-center px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
            >
              Delete
            </motion.button>
          </div>
        </div>
      ))}
    </div>

    {/* Desktop Table View */}
    <div className="hidden md:block overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg shadow-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resp. Time</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {agents.map(agent => (
            <tr key={agent.id} className="hover:bg-gray-50">
              <td className="py-4 px-4">
                <div>
                  <div className="font-medium text-gray-900">{agent.name}</div>
                  <div className="text-sm text-gray-500">{agent.email}</div>
                  <div className="text-xs text-gray-400">ID: {agent.agentId}</div>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                  {agent.role}
                </span>
              </td>
              <td className="py-4 px-4 font-medium">
                {agent.stats?.totalMessages || 0}
              </td>
              <td className="py-4 px-4 font-medium">
                {agent.stats?.totalCustomers || 0}
              </td>
              <td className="py-4 px-4 font-medium">
                {agent.stats?.avgResponseTime || 'N/A'}
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEditPermissions(agent)}
                    className="p-2 text-purple-500 hover:bg-purple-50 rounded-full"
                    title="Edit Permissions"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onEdit(agent)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(agent.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await adminAuth.getAgents();
      setAgents(data);
      setError('');
    } catch (error) {
      setError('Failed to load agents. Please try again.');
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (formData) => {
    try {
      setError('');
      await adminAuth.createAgent(formData);
      setShowForm(false);
      await loadAgents();
    } catch (error) {
      setError(error.message || 'Failed to create agent');
      console.error('Failed to create agent:', error);
    }
  };

  const handleUpdateAgent = async (formData) => {
    try {
      setError('');
      await adminAuth.updateAgent(selectedAgent.id, formData);
      setShowForm(false);
      setSelectedAgent(null);
      await loadAgents();
    } catch (error) {
      setError(error.message || 'Failed to update agent');
      console.error('Failed to update agent:', error);
    }
  };
  const handleDeleteAgent = async (agentId) => {
    // eslint-disable-next-line no-restricted-globals
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        setError('');
        await adminAuth.deleteAgent(agentId);
        await loadAgents();
      } catch (error) {
        setError(error.message || 'Failed to delete agent');
        console.error('Failed to delete agent:', error);
      }
    }
  };

  const handleEditPermissions = (agent) => {
    setSelectedPermissions({
      id: agent.id,
      name: agent.name,
      ...agent.permissions
    });
    setShowPermissionsModal(true);
  };

  const handlePermissionsSave = async () => {
    try {
      setError('');
      const { id, name, ...permissions } = selectedPermissions;
      await adminAuth.updateAgentPermissions(id, permissions);
      setShowPermissionsModal(false);
      await loadAgents();
    } catch (error) {
      setError(error.message || 'Failed to update permissions');
      console.error('Failed to update permissions:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Agent Management</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
        >
          Add New Agent
        </motion.button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {showForm && (
        <AgentForm
          agent={selectedAgent}
          onSubmit={selectedAgent ? handleUpdateAgent : handleCreateAgent}
          onCancel={() => {
            setShowForm(false);
            setSelectedAgent(null);
          }}
        />
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
        </div>
      ) : agents.length > 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <AgentsTable 
            agents={agents} 
            onEdit={(agent) => {
              setSelectedAgent(agent);
              setShowForm(true);
            }}
            onDelete={handleDeleteAgent}
            onEditPermissions={handleEditPermissions}
          />
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg text-center">
          <p className="text-gray-600 mb-4">No agents found</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
          >
            Add Your First Agent
          </button>
        </div>
      )}

      {/* Permissions Modal */}
      <AnimatePresence>
        {showPermissionsModal && selectedPermissions && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPermissionsModal(false)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  Edit Permissions: {selectedPermissions.name}
                </h2>
                <button 
                  onClick={() => setShowPermissionsModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.canMessage || false}
                      onChange={(e) => setSelectedPermissions({
                        ...selectedPermissions,
                        canMessage: e.target.checked
                      })}
                      className="w-5 h-5 rounded text-rose-500"
                    />
                    <div className="flex-1">
                      <span className="font-medium">Can Message</span>
                      <p className="text-xs text-gray-500">Can send messages to users</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.canModerate || false}
                      onChange={(e) => setSelectedPermissions({
                        ...selectedPermissions,
                        canModerate: e.target.checked
                      })}
                      className="w-5 h-5 rounded text-rose-500"
                    />
                    <div className="flex-1">
                      <span className="font-medium">Can Moderate</span>
                      <p className="text-xs text-gray-500">Can moderate content and users</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.canViewStats || false}
                      onChange={(e) => setSelectedPermissions({
                        ...selectedPermissions,
                        canViewStats: e.target.checked
                      })}
                      className="w-5 h-5 rounded text-rose-500"
                    />
                    <div className="flex-1">
                      <span className="font-medium">View Statistics</span>
                      <p className="text-xs text-gray-500">Can access analytics and reports</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.canCreateEscorts || false}
                      onChange={(e) => setSelectedPermissions({
                        ...selectedPermissions,
                        canCreateEscorts: e.target.checked
                      })}
                      className="w-5 h-5 rounded text-rose-500"
                    />
                    <div className="flex-1">
                      <span className="font-medium">Create Escorts</span>
                      <p className="text-xs text-gray-500">Can create and manage escort profiles</p>
                    </div>
                  </label>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <motion.button
                    type="button"
                    onClick={() => setShowPermissionsModal(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    type="button"
                    onClick={handlePermissionsSave}
                    className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg shadow-md hover:shadow-lg"
                    whileHover={{ scale: 1.02, shadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Save Permissions
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentManagement;
