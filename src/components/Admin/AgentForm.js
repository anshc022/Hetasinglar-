import React, { useState } from 'react';
import { motion } from 'framer-motion';

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
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Failed to submit form');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {agent ? 'Edit Agent' : 'Create New Agent'}
        </h2>
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ...existing form fields... */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600"
            >
              {agent ? 'Update Agent' : 'Create Agent'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AgentForm;
