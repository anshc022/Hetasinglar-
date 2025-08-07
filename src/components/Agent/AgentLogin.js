import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { agentAuth } from '../../services/agentApi';

const AgentLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ agentId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await agentAuth.login(credentials.agentId, credentials.password);
      navigate('/agent/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-rose-200 to-pink-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Agent Login</h1>
          <p className="text-gray-600 mt-2">Access your agent dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm text-gray-600 block mb-2">Agent ID</label>
            <input
              type="text"
              value={credentials.agentId}
              onChange={(e) => setCredentials({ ...credentials, agentId: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white/70 border border-gray-300 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white/70 border border-gray-300 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
              required
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-500 to-pink-600 text-white rounded-lg font-semibold
              hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </motion.button>
        </form>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-center"
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AgentLogin;
