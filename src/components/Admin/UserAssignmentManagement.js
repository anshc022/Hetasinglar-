import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, 
  FaUserCheck, 
  FaUserTimes, 
  FaChartLine, 
  FaCalendar, 
  FaShieldAlt,
  FaTrophy
} from 'react-icons/fa';
import adminApi from '../../services/adminApi';

const UserAssignmentManagement = () => {
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [unassignedUsers, setUnassignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all-users');

  useEffect(() => {
    fetchUsers();
    fetchAgents();
    fetchAssignments();
  }, []);

  useEffect(() => {
    // Calculate unassigned users when users or assignments change
    if (users.length > 0 && assignments.length >= 0) {
      const assignedUserIds = assignments.map(assignment => assignment.customerId);
      const unassigned = users.filter(user => !assignedUserIds.includes(user._id));
      setUnassignedUsers(unassigned);
    }
  }, [users, assignments]);

  const fetchUsers = async () => {
    try {
      const response = await adminApi.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await adminApi.get('/admin/agents');
      setAgents(response.data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get('/admin/assignments');
      setAssignments(response.data.assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleAssignUser = async (userId, agentId) => {
    if (!userId || !agentId) {
      alert('Please select both a user and an agent');
      return;
    }

    try {
      await adminApi.post('/admin/assignments', {
        userId: userId,
        agentId: agentId
      });
      
      alert('User assigned successfully');
      fetchAssignments();
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Error assigning user: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUnassignUser = async (assignmentId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to unassign this user?')) {
      return;
    }

    try {
      await adminApi.delete(`/admin/assignments/${assignmentId}`);
      
      alert('User unassigned successfully');
      fetchAssignments();
    } catch (error) {
      console.error('Error unassigning user:', error);
      alert('Error unassigning user');
    }
  };

  const getAssignmentForUser = (userId) => {
    return assignments.find(assignment => assignment.customerId === userId);
  };

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a._id === agentId);
    return agent ? `${agent.name} (${agent.agentId})` : 'Unknown Agent';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-300">Loading user assignment data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview - Simple One Line */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <FaUsers className="mr-2" />
          User Assignment Management
        </h2>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <FaUsers className="text-blue-500" />
            <span className="text-gray-400">Total Users:</span>
            <span className="text-white font-semibold">{users.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaUserCheck className="text-green-500" />
            <span className="text-gray-400">Assigned:</span>
            <span className="text-white font-semibold">{assignments.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaUserTimes className="text-red-500" />
            <span className="text-gray-400">Unassigned:</span>
            <span className="text-white font-semibold">{unassignedUsers.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaShieldAlt className="text-purple-500" />
            <span className="text-gray-400">Agents:</span>
            <span className="text-white font-semibold">{agents.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaChartLine className="text-orange-500" />
            <span className="text-gray-400">Coverage:</span>
            <span className="text-white font-semibold">
              {users.length > 0 ? Math.round((assignments.length / users.length) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FaTrophy className="text-yellow-500" />
            <span className="text-gray-400">Avg per Agent:</span>
            <span className="text-white font-semibold">
              {agents.length > 0 ? Math.round(assignments.length / agents.length) : 0}
            </span>
          </div>
        </div>
      </div>      {/* Tab Navigation */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setActiveTab('all-users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all-users'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            All Users ({users.length})
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setActiveTab('assigned')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'assigned'
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            Assigned ({assignments.length})
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setActiveTab('unassigned')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'unassigned'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            Unassigned ({unassignedUsers.length})
          </motion.button>
        </nav>
      </div>

        {/* Tab Content */}
        {activeTab === 'all-users' && (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-blue-500/10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-300 flex items-center">
                  <FaUsers className="mr-2" />
                  All Users & Assignment Management
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    Showing {users.length} users
                  </span>
                </div>
              </div>
            </div>
            
            {users.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FaUsers className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg">No users found</p>
                <p className="text-sm mt-2">No users are registered in the system yet.</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block md:hidden p-4 space-y-4">
                  {users.map((user) => {
                    const assignment = getAssignmentForUser(user._id);
                    const isAssigned = !!assignment;
                    
                    return (
                      <div key={user._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        {/* Header with user info */}
                        <div className="flex items-center mb-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                            {user.username?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-base truncate">{user.username}</h3>
                            <p className="text-gray-400 text-sm truncate">{user.email}</p>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="mb-3">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            isAssigned 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {isAssigned ? (
                              <>
                                <FaUserCheck className="mr-1 h-3 w-3" />
                                Assigned
                              </>
                            ) : (
                              <>
                                <FaUserTimes className="mr-1 h-3 w-3" />
                                Unassigned
                              </>
                            )}
                          </span>
                        </div>
                        
                        {/* Assignment Details */}
                        {isAssigned && (
                          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Assigned Agent:</div>
                            <div className="text-sm text-white font-medium">{getAgentName(assignment.agentId)}</div>
                            <div className="flex items-center mt-2 text-xs text-gray-400">
                              <FaCalendar className="mr-1 h-3 w-3" />
                              Assignment Date: {formatDate(assignment.createdAt)}
                            </div>
                          </div>
                        )}
                        
                        {/* Action */}
                        <div>
                          {isAssigned ? (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleUnassignUser(assignment._id)}
                              className="w-full text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <FaUserTimes className="h-4 w-4" />
                              Unassign User
                            </motion.button>
                          ) : (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignUser(user._id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="w-full text-sm bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            >
                              <option value="">Select agent to assign...</option>
                              {agents.map(agent => (
                                <option key={agent._id} value={agent._id}>
                                  {agent.name} ({agent.agentId})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-gray-400 text-sm uppercase bg-gray-900/40">
                      <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Assigned Agent</th>
                        <th className="px-6 py-3">Assignment Date</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {users.map((user) => {
                        const assignment = getAssignmentForUser(user._id);
                        const isAssigned = !!assignment;
                        
                        return (
                          <tr key={user._id} className="border-t border-gray-700 hover:bg-gray-700/30">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold mr-3">
                                  {user.username?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-white">{user.username}</div>
                                  <div className="text-sm text-gray-400">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                isAssigned 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {isAssigned ? (
                                  <>
                                    <FaUserCheck className="mr-1 h-3 w-3" />
                                    Assigned
                                  </>
                                ) : (
                                  <>
                                    <FaUserTimes className="mr-1 h-3 w-3" />
                                    Unassigned
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-300">
                                {isAssigned ? getAgentName(assignment.agentId) : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center text-sm">
                                {isAssigned ? (
                                  <>
                                    <FaCalendar className="text-gray-400 mr-2 h-3 w-3" />
                                    <span className="text-gray-300">{formatDate(assignment.createdAt)}</span>
                                  </>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {isAssigned ? (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleUnassignUser(assignment._id)}
                                  className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded-md transition-colors text-sm flex items-center gap-1"
                                >
                                  <FaUserTimes className="h-3 w-3" />
                                  Unassign
                                </motion.button>
                              ) : (
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAssignUser(user._id, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="text-sm bg-gray-700 border border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-400"
                                >
                                  <option value="">Assign to agent...</option>
                                  {agents.map(agent => (
                                    <option key={agent._id} value={agent._id}>
                                      {agent.name} ({agent.agentId})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}        {activeTab === 'assigned' && (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-green-500/10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-300 flex items-center">
                  <FaUserCheck className="mr-2" />
                  Assigned Users
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    Showing {assignments.length} assignments
                  </span>
                </div>
              </div>
            </div>
            
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FaUserCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg">No assigned users</p>
                <p className="text-sm mt-2">No users have been assigned to agents yet.</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block md:hidden p-4 space-y-4">
                  {assignments.map((assignment) => {
                    const user = users.find(u => u._id === assignment.customerId);
                    
                    return (
                      <div key={assignment._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        {/* Header with user info */}
                        <div className="flex items-center mb-3">
                          {user ? (
                            <>
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                                {user.username?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div className="ml-3 flex-1 min-w-0">
                                <h3 className="text-white font-semibold text-base truncate">{user.username || 'Unknown User'}</h3>
                                <p className="text-gray-400 text-sm truncate">{user.email || 'No email'}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                                !
                              </div>
                              <div className="ml-3 flex-1 min-w-0">
                                <h3 className="text-red-400 font-semibold text-base">User Not Found</h3>
                                <p className="text-red-500 text-sm truncate">ID: {assignment.customerId || 'Unknown'}</p>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Status Badge */}
                        <div className="mb-3">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            user ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {user ? (
                              <>
                                <FaUserCheck className="mr-1 h-3 w-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <FaUserTimes className="mr-1 h-3 w-3" />
                                Missing
                              </>
                            )}
                          </span>
                        </div>
                        
                        {/* Assignment Details */}
                        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg space-y-2">
                          <div className="flex items-center">
                            <FaShieldAlt className="text-purple-500 mr-2 h-4 w-4" />
                            <div>
                              <div className="text-xs text-gray-400">Assigned Agent:</div>
                              <div className="text-sm text-white font-medium">{getAgentName(assignment.agentId)}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <FaCalendar className="text-gray-400 mr-2 h-4 w-4" />
                            <div>
                              <div className="text-xs text-gray-400">Assignment Date:</div>
                              <div className="text-sm text-gray-300">
                                {assignment.createdAt ? formatDate(assignment.createdAt) : 'Unknown date'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUnassignUser(assignment._id)}
                          className="w-full text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <FaUserTimes className="h-4 w-4" />
                          {user ? 'Unassign User' : 'Remove Assignment'}
                        </motion.button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-gray-400 text-sm uppercase bg-gray-900/40">
                      <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Assigned Agent</th>
                        <th className="px-6 py-3">Assignment Date</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {assignments.map((assignment) => {
                        const user = users.find(u => u._id === assignment.customerId);
                        
                        return (
                          <tr key={assignment._id} className="border-t border-gray-700 hover:bg-gray-700/30">
                            <td className="px-6 py-4">
                              {user ? (
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-sm font-bold mr-3">
                                    {user.username?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                    <div className="font-medium text-white">{user.username || 'Unknown User'}</div>
                                    <div className="text-sm text-gray-400">{user.email || 'No email'}</div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-sm font-bold mr-3">
                                    !
                                  </div>
                                  <div>
                                    <div className="font-medium text-red-400">User Not Found</div>
                                    <div className="text-sm text-red-500">ID: {assignment.customerId || 'Unknown'}</div>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <FaShieldAlt className="text-purple-500 mr-2 h-4 w-4" />
                                <span className="text-gray-300">{getAgentName(assignment.agentId)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center text-sm">
                                <FaCalendar className="text-gray-400 mr-2 h-3 w-3" />
                                <span className="text-gray-300">
                                  {assignment.createdAt ? formatDate(assignment.createdAt) : 'Unknown date'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {user ? (
                                  <>
                                    <FaUserCheck className="mr-1 h-3 w-3" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <FaUserTimes className="mr-1 h-3 w-3" />
                                    User Missing
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUnassignUser(assignment._id)}
                                className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded-md transition-colors text-sm flex items-center gap-1"
                              >
                                <FaUserTimes className="h-3 w-3" />
                                {user ? 'Unassign' : 'Remove'}
                              </motion.button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}        {activeTab === 'unassigned' && (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-red-500/10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-300 flex items-center">
                  <FaUserTimes className="mr-2" />
                  Unassigned Users
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    Showing {unassignedUsers.length} unassigned users
                  </span>
                </div>
              </div>
            </div>
            
            {unassignedUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FaUserCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg">All users are assigned!</p>
                <p className="text-sm mt-2">Every user has been assigned to an agent.</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block md:hidden p-4 space-y-4">
                  {unassignedUsers.map((user) => (
                    <div key={user._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      {/* Header with user info */}
                      <div className="flex items-center mb-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                          {user.username?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-base truncate">{user.username}</h3>
                          <p className="text-gray-400 text-sm truncate">{user.email}</p>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="mb-3">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400">
                          <FaUserTimes className="mr-1 h-3 w-3" />
                          Unassigned
                        </span>
                      </div>
                      
                      {/* Registration Details */}
                      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center">
                          <FaCalendar className="text-gray-400 mr-2 h-4 w-4" />
                          <div>
                            <div className="text-xs text-gray-400">Registration Date:</div>
                            <div className="text-sm text-gray-300">
                              {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Assignment Action */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignUser(user._id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full text-sm bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      >
                        <option value="">Select agent to assign...</option>
                        {agents.map(agent => (
                          <option key={agent._id} value={agent._id}>
                            {agent.name} ({agent.agentId})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-gray-400 text-sm uppercase bg-gray-900/40">
                      <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Registration Date</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {unassignedUsers.map((user) => (
                        <tr key={user._id} className="border-t border-gray-700 hover:bg-gray-700/30">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-sm font-bold mr-3">
                                {user.username?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-white">{user.username}</div>
                                <div className="text-sm text-gray-400">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400">
                              <FaUserTimes className="mr-1 h-3 w-3" />
                              Unassigned
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm">
                              <FaCalendar className="text-gray-400 mr-2 h-3 w-3" />
                              <span className="text-gray-300">
                                {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignUser(user._id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="text-sm bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-400 min-w-[180px]"
                            >
                              <option value="">Assign to agent...</option>
                              {agents.map(agent => (
                                <option key={agent._id} value={agent._id}>
                                  {agent.name} ({agent.agentId})
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

export default UserAssignmentManagement;
