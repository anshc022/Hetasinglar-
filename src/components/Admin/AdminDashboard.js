import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { adminAuth } from '../../services/adminApi';
import AgentManagement from './AgentManagement';
import SubscriptionStats from './SubscriptionStats';
import CoinPurchaseStats from './CoinPurchaseStats';
import SubscriptionPlansManagement from './SubscriptionPlansManagement';
import EarningsManagement from './EarningsManagement';
import UserAssignmentManagement from './UserAssignmentManagement';
import EscortManagement from './EscortManagement';
import AffiliateLinksOverview from './AffiliateLinksOverview';
import { FaEye, FaUser, FaBell, FaEnvelope, FaUsers, FaClock, FaPlus, FaComments, FaUserCog, FaUserShield, FaDollarSign, FaCog, FaHeart, FaLink, FaBars, FaTimes } from 'react-icons/fa';
import AddAgentModal from './AddAgentModal';

const Sidebar = ({ activeTab, setActiveTab, admin, isOpen, toggleSidebar }) => (
  <>
    {/* Mobile Overlay */}
    {isOpen && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={toggleSidebar}
      />
    )}
    
    {/* Sidebar */}
    <div className={`
      bg-gray-900 text-gray-300 min-h-screen flex flex-col transition-transform duration-300 ease-in-out z-50
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
      lg:translate-x-0 lg:relative lg:z-auto
      fixed lg:static w-64 lg:w-64
    `}>
      <div className="p-4 lg:p-6 border-b border-gray-700">
        {/* Mobile close button */}
        <div className="flex justify-between items-center lg:block">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white text-lg lg:text-xl font-bold">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden lg:block">
              <h3 className="text-base lg:text-lg font-semibold">{admin?.name || 'Admin'}</h3>
              <p className="text-xs lg:text-sm text-gray-500">ID: {admin?.adminId}</p>
            </div>
          </div>
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {/* Mobile admin info */}
        <div className="mt-3 lg:hidden">
          <h3 className="text-base font-semibold">{admin?.name || 'Admin'}</h3>
          <p className="text-xs text-gray-500">ID: {admin?.adminId}</p>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <div className="flex-1 p-3 lg:p-4 space-y-1 lg:space-y-2">
        {[
          { name: 'Overview', icon: FaEye },
          { name: 'Agents', icon: FaUsers },
          { name: 'User Assignments', icon: FaUserShield },
          { name: 'Earnings', icon: FaDollarSign },
          { name: 'Statistics', icon: FaComments },
          { name: 'Coin Purchases', icon: FaUser },
          { name: 'Affiliate Links', icon: FaLink },
          { name: 'Plans', icon: FaUserCog },
          { name: 'Escorts', icon: FaHeart }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => {
                setActiveTab(item.name.toLowerCase());
                toggleSidebar(); // Close sidebar on mobile after selection
              }}
              className={`w-full text-left px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-all flex items-center gap-2 lg:gap-3 text-sm lg:text-base ${
                activeTab === item.name.toLowerCase()
                  ? 'bg-rose-600 text-white'
                  : 'hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  </>
);

const StatsDashboard = ({ stats }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
    <div className="bg-gray-800/50 rounded-lg p-3 lg:p-4 border border-gray-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <FaEnvelope className="text-blue-400 text-lg lg:text-xl" />
        <span className="text-xs lg:text-sm text-gray-400">Live</span>
      </div>
      <div className="text-xl lg:text-2xl font-bold text-white mb-1">
        {stats.messageCounts.liveMessages}
      </div>
      <div className="text-xs lg:text-sm text-gray-400">Messages</div>
    </div>

    <div className="bg-gray-800/50 rounded-lg p-3 lg:p-4 border border-gray-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <FaComments className="text-green-400 text-lg lg:text-xl" />
        <span className="text-xs lg:text-sm text-gray-400">Total</span>
      </div>
      <div className="text-xl lg:text-2xl font-bold text-white mb-1">
        {stats.messageCounts.totalMessages}
      </div>
      <div className="text-xs lg:text-sm text-gray-400">Messages</div>
    </div>

    <div className="bg-gray-800/50 rounded-lg p-3 lg:p-4 border border-gray-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <FaUsers className="text-purple-400 text-lg lg:text-xl" />
        <span className="text-xs lg:text-sm text-gray-400">Active</span>
      </div>
      <div className="text-xl lg:text-2xl font-bold text-white mb-1">
        {stats.activeAgents}
      </div>
      <div className="text-xs lg:text-sm text-gray-400">Agents</div>
    </div>

    <div className="bg-gray-800/50 rounded-lg p-3 lg:p-4 border border-gray-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <FaUser className="text-rose-400 text-lg lg:text-xl" />
        <span className="text-xs lg:text-sm text-gray-400">Total</span>
      </div>
      <div className="text-xl lg:text-2xl font-bold text-white mb-1">
        {stats.agents.length}
      </div>
      <div className="text-xs lg:text-sm text-gray-400">Agents</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    messageCounts: {
      totalMessages: 0,
      liveMessages: 0
    },
    activeAgents: 0,
    agents: [],
    subscriptionStats: null
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [admin, setAdmin] = useState(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const fetchAgents = async () => {
    try {
      const data = await adminAuth.getAgents();
      setStats(prev => ({
        ...prev,
        agents: data
      }));
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const dashboardStats = await adminAuth.getDashboardStats();
        setStats({
          messageCounts: dashboardStats.messageCounts,
          activeAgents: dashboardStats.activeAgents,
          agents: dashboardStats.agentPerformance,
          subscriptionStats: dashboardStats.subscriptionStats
        });
        
        // Get admin profile
        const adminProfile = await adminAuth.getProfile();
        setAdmin(adminProfile);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // Poll for updates every minute
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    adminAuth.logout();
    navigate('/admin/login');
  };

  const handleEditAgent = (agent) => {
    setSelectedAgent(agent);
    setShowAgentModal(true);
  };

  const handleDeleteAgent = async (agentId) => {
    try {
      // Mock deletion for now
      console.log("Delete agent", agentId);
      setStats(prev => ({
        ...prev,
        agents: prev.agents.filter(a => a.id !== agentId)
      }));
      
      // Uncomment for real API
      // await adminAuth.deleteAgent(agentId);
      // setStats(prev => ({
      //   ...prev,
      //   agents: prev.agents.filter(a => a.id !== agentId)
      // }));
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const handleUpdatePermissions = async (agentId, permissions) => {
    try {
      await adminAuth.updateAgentPermissions(agentId, permissions);
      // Refresh agents list
      const updatedAgents = await adminAuth.getAgents();
      setStats(prev => ({ ...prev, agents: updatedAgents }));
    } catch (error) {
      console.error('Failed to update permissions:', error);
    }
  };

  const handleCreateAgent = async (agentData) => {
    try {
      await adminAuth.createAgent(agentData);
      // Refresh the agent list
      fetchAgents();
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error; // Propagate error back to the modal form
    }
  };

  const handleUpdateAgent = async (agentData) => {
    try {
      await adminAuth.updateAgent(selectedAgent.id, agentData);
      setSelectedAgent(null);
      // Refresh the agent list
      fetchAgents();
    } catch (error) {
      console.error('Failed to update agent:', error);
      throw error; // Propagate error back to the modal form
    }
  };

  const handleAgentSubmit = async (agentData) => {
    if (selectedAgent) {
      return handleUpdateAgent(agentData);
    } else {
      return handleCreateAgent(agentData);
    }
  };

  const handleEditPermissions = (agent) => {
    setSelectedAgent(agent);
    setSelectedPermissions({
      ...agent.permissions,
      agentId: agent.agentId,
      name: agent.name,
      id: agent.id
    });
    setShowPermissionsModal(true);
  };

  const handlePermissionsSave = async () => {
    try {
      await adminAuth.updateAgentPermissions(selectedPermissions.id, {
        canMessage: selectedPermissions.canMessage || false,
        canModerate: selectedPermissions.canModerate || false,
        canViewStats: selectedPermissions.canViewStats || false,
        canCreateEscorts: selectedPermissions.canCreateEscorts || false,
        hasAdminAccess: selectedPermissions.hasAdminAccess || false
      });
      
      // Refresh agents list
      const updatedAgents = await adminAuth.getAgents();
      setStats(prev => ({ ...prev, agents: updatedAgents }));
      setShowPermissionsModal(false);
    } catch (error) {
      console.error('Failed to update permissions:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-2xl text-rose-500 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
          <div>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900 relative">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        admin={admin} 
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      
      <div className="flex-1 min-w-0 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"
          >
            <FaBars size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
          >
            Logout
          </button>
        </div>

        {/* Main Content */}
        <div className="p-4 lg:p-8 overflow-x-auto">
          {/* Desktop Header */}
          <div className="hidden lg:flex mb-8 justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          {activeTab === 'overview' && (
            <>
              <StatsDashboard stats={stats} />
              
              <div className="mt-6 lg:mt-10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                  <h2 className="text-lg lg:text-xl font-semibold text-white">Agent Overview</h2>
                </div>
                
                {/* Responsive Table View */}
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left bg-gray-800 rounded-lg shadow-lg min-w-full">
                    <thead className="text-gray-400 text-xs sm:text-sm uppercase">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left">Name</th>
                        <th className="px-3 sm:px-6 py-3 text-left hidden sm:table-cell">ID</th>
                        <th className="px-3 sm:px-6 py-3 text-left">Role</th>
                        <th className="px-3 sm:px-6 py-3 text-center">Live</th>
                        <th className="px-3 sm:px-6 py-3 text-center">Total</th>
                        <th className="px-3 sm:px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {stats.agents?.map(agent => (
                        <tr key={agent.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div>
                              <div className="font-semibold text-sm sm:text-base">{agent.name}</div>
                              <div className="text-xs text-gray-400 sm:hidden">{agent.agentId}</div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-400 hidden sm:table-cell">
                            {agent.agentId}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300">
                              {agent.role}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-sm">
                            {agent.stats?.liveMessageCount || 0}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-sm">
                            {agent.stats?.totalMessagesSent || 0}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                              <button
                                onClick={() => handleEditAgent(agent)}
                                className="px-2 sm:px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAgent(agent.id)}
                                className="px-2 sm:px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs sm:text-sm"
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
              </div>
            </>
          )}

          {activeTab === 'agents' && (
            <div className="space-y-6 lg:space-y-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-lg lg:text-xl font-semibold text-white">Agent Management</h2>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedAgent(null);
                    setShowAgentModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
                >
                  <div className="flex items-center justify-center gap-2">
                    <FaPlus />
                    Add New Agent
                  </div>
                </motion.button>
              </div>

              {/* Responsive Table View */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left bg-gray-800 rounded-lg shadow-lg min-w-full">
                  <thead className="text-gray-400 text-xs sm:text-sm uppercase">
                    <tr>
                      <th className="px-2 sm:px-4 lg:px-6 py-3">Name</th>
                      <th className="px-2 sm:px-4 lg:px-6 py-3 hidden md:table-cell">ID</th>
                      <th className="px-2 sm:px-4 lg:px-6 py-3">Role</th>
                      <th className="px-2 sm:px-4 lg:px-6 py-3 hidden lg:table-cell">Stats</th>
                      <th className="px-2 sm:px-4 lg:px-6 py-3 text-center">Perms</th>
                      <th className="px-2 sm:px-4 lg:px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {stats.agents?.map(agent => (
                      <tr key={agent.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                        <td className="px-2 sm:px-4 lg:px-6 py-3 lg:py-4">
                          <div>
                            <div className="font-semibold text-sm lg:text-base">{agent.name}</div>
                            <div className="text-xs text-gray-400 md:hidden">{agent.agentId}</div>
                            <div className="text-xs text-gray-400 lg:hidden mt-1">
                              Msgs: {agent.stats?.totalMessagesSent || 0} | Customers: {agent.stats?.activeCustomers || 0}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-400 hidden md:table-cell">
                          {agent.agentId}
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-3 lg:py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            agent.role === 'supervisor' ? 'bg-purple-500/20 text-purple-300' : 
                            agent.role === 'senior_agent' ? 'bg-blue-500/20 text-blue-300' : 
                            'bg-green-500/20 text-green-300'
                          }`}>
                            {agent.role === 'senior_agent' ? 'Senior' : 
                             agent.role === 'supervisor' ? 'Supervisor' : 'Agent'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-3 lg:py-4 hidden lg:table-cell">
                          <div className="flex flex-col text-xs">
                            <span>
                              <span className="text-gray-400">Messages:</span> {agent.stats?.totalMessagesSent || 0}
                            </span>
                            <span>
                              <span className="text-gray-400">Customers:</span> {agent.stats?.activeCustomers || 0}
                            </span>
                            <span>
                              <span className="text-gray-400">Response:</span> {agent.stats?.avgResponseTime || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-3 lg:py-4 text-center">
                          <motion.button
                            onClick={() => handleEditPermissions(agent)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center justify-center p-1.5 lg:p-2 bg-indigo-500/30 text-indigo-300 rounded-lg hover:bg-indigo-500/50 transition-colors"
                            title="Edit permissions"
                          >
                            <FaUserShield size={14} />
                          </motion.button>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-3 lg:py-4">
                          <div className="flex flex-col sm:flex-row gap-1 lg:gap-2">
                            <button
                              onClick={() => handleEditAgent(agent)}
                              className="px-2 lg:px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs lg:text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="px-2 lg:px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs lg:text-sm"
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
            </div>
          )}
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <h2 className="text-lg lg:text-xl font-semibold mb-4 text-white">Platform Statistics</h2>
              
              {/* Overall Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-xl lg:text-2xl font-bold text-blue-400">{stats.agents?.length || 0}</div>
                  <div className="text-sm text-gray-400">Total Agents</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-xl lg:text-2xl font-bold text-green-400">{stats.activeAgents || 0}</div>
                  <div className="text-sm text-gray-400">Active Agents</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-xl lg:text-2xl font-bold text-purple-400">
                    {stats.agents?.reduce((sum, agent) => sum + (agent.stats?.totalMessages || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-gray-400">Total Messages</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-xl lg:text-2xl font-bold text-orange-400">
                    {stats.agents?.reduce((sum, agent) => sum + (agent.stats?.activeCustomers || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-gray-400">Active Customers</div>
                </div>
              </div>

              {/* Mobile Card View for Statistics */}
              <div className="block lg:hidden space-y-4">
                {stats.agents?.length > 0 ? stats.agents.map(agent => (
                  <div key={agent.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-white">{agent.name || 'Unknown'}</h3>
                        <p className="text-sm text-gray-500">{agent.agentId}</p>
                        <span className="inline-block mt-1 px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">
                          {agent.role || 'agent'}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        agent.stats?.isOnline ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {agent.stats?.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Messages:</span>
                        <p className="text-white font-medium">{agent.stats?.totalMessages || 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Active Customers:</span>
                        <p className="text-white font-medium">{agent.stats?.activeCustomers || 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Customers:</span>
                        <p className="text-white font-medium">{agent.stats?.totalCustomersServed || 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Chat Sessions:</span>
                        <p className="text-white font-medium">{agent.stats?.totalChatSessions || 0}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">Avg Response Time:</span>
                        <p className="text-white font-medium">
                          {agent.stats?.avgResponseTime > 0 
                            ? `${agent.stats.avgResponseTime} min` 
                            : 'No data'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
                    <FaComments className="text-4xl mb-4 text-gray-600 mx-auto" />
                    <p className="text-lg font-medium text-gray-400">No agents found</p>
                    <p className="text-sm text-gray-500">Create some agents to see their statistics here.</p>
                  </div>
                )}
              </div>

              {/* Desktop Table View for Statistics */}
              <div className="hidden lg:block overflow-x-auto w-full">
                <table className="w-full text-left bg-gray-800 rounded-lg shadow-lg">
                  <thead className="text-gray-400 text-sm uppercase">
                    <tr>
                      <th className="px-6 py-3">Agent</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Messages Sent</th>
                      <th className="px-6 py-3">Active Customers</th>
                      <th className="px-6 py-3">Total Customers</th>
                      <th className="px-6 py-3">Chat Sessions</th>
                      <th className="px-6 py-3">Avg Response Time</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {stats.agents?.length > 0 ? stats.agents.map(agent => (
                      <tr key={agent.id} className="border-t border-gray-700 hover:bg-gray-750">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{agent.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{agent.agentId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-900 text-blue-300">
                            {agent.role || 'agent'}
                          </span>
                        </td>
                        <td className="px-6 py-4">{agent.stats?.totalMessages || 0}</td>
                        <td className="px-6 py-4">{agent.stats?.activeCustomers || 0}</td>
                        <td className="px-6 py-4">{agent.stats?.totalCustomersServed || 0}</td>
                        <td className="px-6 py-4">{agent.stats?.totalChatSessions || 0}</td>
                        <td className="px-6 py-4">
                          {agent.stats?.avgResponseTime > 0 
                            ? `${agent.stats.avgResponseTime} min` 
                            : 'No data'
                          }
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            agent.stats?.isOnline ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                          }`}>
                            {agent.stats?.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <FaComments className="text-4xl mb-4 text-gray-600" />
                            <p className="text-lg font-medium">No agents found</p>
                            <p className="text-sm">Create some agents to see their statistics here.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Note about statistics */}
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mt-6">
                <div className="flex items-start">
                  <FaBell className="text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-yellow-400 font-medium">Statistics Information</h4>
                    <p className="text-yellow-300 text-sm mt-1">
                      Agent statistics are updated in real-time as agents handle customer chats. 
                      New agents will show zero values until they start processing messages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coin purchases' && (
            <CoinPurchaseStats />
          )}

          {activeTab === 'affiliate links' && (
            <AffiliateLinksOverview />
          )}

          {activeTab === 'plans' && (
            <SubscriptionPlansManagement />
          )}

          {activeTab === 'earnings' && (
            <EarningsManagement />
          )}

          {activeTab === 'user assignments' && (
            <UserAssignmentManagement />
          )}

          {activeTab === 'escorts' && (
            <EscortManagement />
          )}

          <AddAgentModal
            isOpen={showAgentModal}
            onClose={() => {
              setShowAgentModal(false);
              setSelectedAgent(null);
            }}
            agent={selectedAgent}
            onSubmit={handleAgentSubmit}
          />
          
          {/* Permissions Modal */}
          <AnimatePresence>
            {showPermissionsModal && selectedPermissions && (
              <motion.div
                className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPermissionsModal(false)}
              >
                <motion.div
                  className="bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-700"
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">
                      Edit Permissions: {selectedPermissions.name}
                    </h2>
                    <button 
                      onClick={() => setShowPermissionsModal(false)}
                      className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 bg-gray-800 p-5 rounded-lg border border-gray-700">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canMessage || false}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canMessage: e.target.checked
                          })}
                          className="w-5 h-5 rounded text-rose-500 bg-gray-700 border-gray-600 focus:ring-rose-500 focus:ring-2 focus:ring-offset-gray-800"
                        />
                        <div className="flex-1">
                          <span className="text-gray-200 font-medium">Can Message</span>
                          <p className="text-xs text-gray-400">Can send messages to users</p>
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
                          className="w-5 h-5 rounded text-rose-500 bg-gray-700 border-gray-600 focus:ring-rose-500 focus:ring-2 focus:ring-offset-gray-800"
                        />
                        <div className="flex-1">
                          <span className="text-gray-200 font-medium">Can Moderate</span>
                          <p className="text-xs text-gray-400">Can moderate content and users</p>
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
                          className="w-5 h-5 rounded text-rose-500 bg-gray-700 border-gray-600 focus:ring-rose-500 focus:ring-2 focus:ring-offset-gray-800"
                        />
                        <div className="flex-1">
                          <span className="text-gray-200 font-medium">View Statistics</span>
                          <p className="text-xs text-gray-400">Can access analytics and reports</p>
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
                          className="w-5 h-5 rounded text-rose-500 bg-gray-700 border-gray-600 focus:ring-rose-500 focus:ring-2 focus:ring-offset-gray-800"
                        />
                        <div className="flex-1">
                          <span className="text-gray-200 font-medium">Create Escorts</span>
                          <p className="text-xs text-gray-400">Can create and manage escort profiles</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.hasAdminAccess || false}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            hasAdminAccess: e.target.checked
                          })}
                          className="w-5 h-5 rounded text-rose-500 bg-gray-700 border-gray-600 focus:ring-rose-500 focus:ring-2 focus:ring-offset-gray-800"
                        />
                        <div className="flex-1">
                          <span className="text-gray-200 font-medium">Admin Access</span>
                          <p className="text-xs text-gray-400">Full administrative privileges</p>
                        </div>
                      </label>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                      <motion.button
                        type="button"
                        onClick={() => setShowPermissionsModal(false)}
                        className="px-4 py-2 border border-gray-700 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      
                      <motion.button
                        type="button"
                        onClick={handlePermissionsSave}
                        className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg shadow-md hover:shadow-lg"
                        whileHover={{ scale: 1.02, shadow: "0 5px 15px rgba(0, 0, 0, 0.3)" }}
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
      </div>
    </div>
  );
};

export default AdminDashboard;
