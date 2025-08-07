import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AddAgentModal = ({ isOpen, onClose, agent, onSubmit }) => {
  const [formData, setFormData] = useState({
    agentId: '',
    name: '',
    email: '',
    password: '',
    role: 'agent',
    permissions: {
      canMessage: true,
      canModerate: false,
      canViewStats: true,
      canCreateEscorts: false,
      hasAdminAccess: false
    }
  });
  const [error, setError] = useState('');

  // Reset form when modal opens or agent changes
  useEffect(() => {
    if (agent) {
      setFormData({
        agentId: agent.agentId || '',
        name: agent.name || '',
        email: agent.email || '',
        password: '',
        role: agent.role || 'agent',
        permissions: {
          canMessage: agent.permissions?.canMessage ?? true,
          canModerate: agent.permissions?.canModerate ?? false,
          canViewStats: agent.permissions?.canViewStats ?? true,
          canCreateEscorts: agent.permissions?.canCreateEscorts ?? false,
          hasAdminAccess: agent.permissions?.hasAdminAccess ?? false
        }
      });
    } else {
      setFormData({
        agentId: '',
        name: '',
        email: '',
        password: '',
        role: 'agent',
        permissions: {
          canMessage: true,
          canModerate: false,
          canViewStats: true,
          canCreateEscorts: false,
          hasAdminAccess: false
        }
      });
    }
    setError('');
  }, [agent, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit form');
    }
  };

  // Animation variants for modal container
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  // Animation variants for modal content
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 25 
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -20, 
      transition: { 
        duration: 0.2,
        ease: "easeInOut"
      } 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          onClick={onClose}
        >
          <motion.div
            className="bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-700"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                {agent ? 'Edit Agent' : 'Create New Agent'}
              </h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <svg 
                  className="w-5 h-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            </div>
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-900/60 text-red-200 border border-red-700 rounded-lg"
              >
                {error}
              </motion.div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Agent ID</label>
                  <input
                    type="text"
                    value={formData.agentId}
                    onChange={(e) => setFormData({...formData, agentId: e.target.value})}
                    className="w-full p-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder-gray-500"
                    placeholder="agent123"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder-gray-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder-gray-500"
                  placeholder="agent@example.com"
                  required
                />
              </div>
              
              {!agent && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full p-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder-gray-500"
                    placeholder="••••••••"
                    required={!agent}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full p-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="agent">Agent</option>
                  <option value="senior_agent">Senior Agent</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Permissions</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <label className="flex items-center space-x-2">
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
                      className="w-4 h-4 text-rose-500 bg-gray-700 border-gray-600 rounded focus:ring-rose-500 focus:ring-offset-gray-800"
                    />
                    <span className="text-sm text-gray-300">Can Message</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
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
                      className="w-4 h-4 text-rose-500 bg-gray-700 border-gray-600 rounded focus:ring-rose-500 focus:ring-offset-gray-800"
                    />
                    <span className="text-sm text-gray-300">Can Moderate</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
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
                      className="w-4 h-4 text-rose-500 bg-gray-700 border-gray-600 rounded focus:ring-rose-500 focus:ring-offset-gray-800"
                    />
                    <span className="text-sm text-gray-300">Can View Stats</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canCreateEscorts}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          canCreateEscorts: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-rose-500 bg-gray-700 border-gray-600 rounded focus:ring-rose-500 focus:ring-offset-gray-800"
                    />
                    <span className="text-sm text-gray-300">Can Create Escorts</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.hasAdminAccess}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          hasAdminAccess: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-rose-500 bg-gray-700 border-gray-600 rounded focus:ring-rose-500 focus:ring-offset-gray-800"
                    />
                    <span className="text-sm text-gray-300">Has Admin Access</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-700 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.02, shadow: "0 5px 15px rgba(0, 0, 0, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  {agent ? 'Update Agent' : 'Create Agent'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddAgentModal;