import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, 
  FaDollarSign, 
  FaCoins, 
  FaChartLine, 
  FaPercentage, 
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaLink,
  FaTrophy,
  FaCrown,
  FaMedal,
  FaAward
} from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import { agentAuth } from '../../services/agentApi';

const AffiliateView = ({ agentId }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({
    agent: {},
    customers: [],
    stats: {},
    monthlyEarnings: {},
    recentEarnings: []
  });
  const [commissionStats, setCommissionStats] = useState({
    stats: {},
    period: {}
  });
  const [customerList, setCustomerList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: '',
    endDate: '',
    search: '',
    status: 'active'
  });

  useEffect(() => {
    if (agentId) {
      // Add a small delay to ensure the component is properly mounted
      setTimeout(() => {
        fetchDashboardData();
        fetchCustomerList();
      }, 100);
    }
  }, [agentId]);

  useEffect(() => {
    if (agentId && activeTab === 'stats') {
      fetchCommissionStats();
    }
  }, [agentId, activeTab, filters.period, filters.startDate, filters.endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await agentAuth.getAffiliateDashboard(agentId);
      setDashboardData(response);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Show user-friendly error message
      if (error.message && error.message.includes('affiliate capabilities')) {
        console.warn('Agent does not have affiliate capabilities enabled');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionStats = async () => {
    try {
      const params = {
        period: filters.period,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      };
      
      const response = await agentAuth.getAffiliateCommissionStats(agentId, params);
      setCommissionStats(response);
    } catch (error) {
      console.error('Error fetching commission stats:', error);
    }
  };

  const fetchCustomerList = async () => {
    try {
      const params = {
        status: filters.status,
        search: filters.search,
        limit: 50
      };
      
      const response = await agentAuth.getAffiliateCustomers(agentId, params);
      setCustomerList(response.customers || []);
    } catch (error) {
      console.error('Error fetching customer list:', error);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const response = await agentAuth.getAffiliateCustomerDetails(customerId, agentId);
      setCustomerDetails(response);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    fetchCustomerDetails(customer.customerId._id);
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Agent Info Card */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xl font-bold">
              {(dashboardData.agent.name || 'A').charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{dashboardData.agent.name}</h2>
              <p className="text-gray-400">Agent ID: {dashboardData.agent.agentId}</p>
              <div className="flex items-center gap-2 mt-1">
                <FaLink className="text-purple-400 text-sm" />
                <span className="text-purple-300 text-sm">Affiliate Agent</span>
              </div>
            </div>
          </div>
          <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
            <p className="text-purple-300 text-sm font-medium">Your Affiliate Code</p>
            <p className="text-lg font-mono font-bold text-purple-400 mt-1">
              {dashboardData.agent.affiliateData?.affiliateCode || 'N/A'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Share this code to earn commissions</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={(dashboardData.stats?.totalCustomers || 0).toString()}
          subtitle={`${dashboardData.stats?.activeCustomers || 0} active`}
          icon={<FaUsers className="text-xl" />}
          color="bg-blue-500/20 text-blue-500"
        />
        <StatCard
          title="Total Commission"
          value={`$${(dashboardData.stats?.totalCommission || 0).toFixed(2)}`}
          subtitle={`${dashboardData.stats?.totalTransactions || 0} transactions`}
          icon={<FaDollarSign className="text-xl" />}
          color="bg-green-500/20 text-green-500"
        />
        <StatCard
          title="This Month"
          value={`$${(dashboardData.monthlyEarnings?.totalEarnings || 0).toFixed(2)}`}
          subtitle={`${dashboardData.monthlyEarnings?.totalTransactions || 0} transactions`}
          icon={<FaChartLine className="text-xl" />}
          color="bg-purple-500/20 text-purple-500"
        />
        <StatCard
          title="Avg per Customer"
          value={`$${(dashboardData.stats?.averageCommissionPerCustomer || 0).toFixed(2)}`}
          subtitle={`${(dashboardData.stats?.averageTransactionsPerCustomer || 0).toFixed(1)} avg transactions`}
          icon={<FaPercentage className="text-xl" />}
          color="bg-yellow-500/20 text-yellow-500"
        />
      </div>

      {/* Recent Earnings */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FaCoins className="text-yellow-500" />
            Recent Earnings
          </h3>
          <p className="text-gray-400 text-sm mt-1">Latest commission earnings from your referrals</p>
        </div>
        <div className="p-6">
          {dashboardData.recentEarnings.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <FaDollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">No recent earnings</p>
              <p className="text-sm">Start referring customers to earn commissions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentEarnings.map((earning) => (
                <motion.div 
                  key={earning._id} 
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700/70 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-sm font-bold">
                      {(earning.userId?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {earning.userId?.username || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(earning.transactionDate), 'PPp')} • 
                        Agent: {earning.agentId?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">
                      +${(earning.affiliateCommission || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {earning.coinsUsed} coins
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCommissionStats = () => (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Period</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Earnings"
          value={`$${(commissionStats.stats?.totalEarnings || 0).toFixed(2)}`}
          icon={<FaDollarSign className="text-xl" />}
          color="bg-purple-500/20 text-purple-500"
        />
        <StatCard
          title="Transactions"
          value={(commissionStats.stats?.totalTransactions || 0).toString()}
          icon={<FaChartLine className="text-xl" />}
          color="bg-blue-500/20 text-blue-500"
        />
        <StatCard
          title="Coins Generated"
          value={(commissionStats.stats?.totalCoinsGenerated || 0).toLocaleString()}
          icon={<FaCoins className="text-xl" />}
          color="bg-green-500/20 text-green-500"
        />
        <StatCard
          title="Avg per Transaction"
          value={`$${(commissionStats.stats?.averagePerTransaction || 0).toFixed(2)}`}
          icon={<FaPercentage className="text-xl" />}
          color="bg-yellow-500/20 text-yellow-500"
        />
      </div>

      {/* Top Customers */}
      {commissionStats.stats.topCustomers && commissionStats.stats.topCustomers.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaTrophy className="text-yellow-500" />
              Top Customers (This Period)
            </h3>
            <p className="text-gray-400 text-sm mt-1">Your highest earning affiliate customers</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {commissionStats.stats.topCustomers.slice(0, 10).map((customer, index) => (
                <motion.div 
                  key={customer.customer._id} 
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700/70 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-500 to-yellow-700' :
                      index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                      index === 2 ? 'bg-gradient-to-br from-yellow-600 to-yellow-800' :
                      'bg-gradient-to-br from-purple-500 to-purple-700'
                    }`}>
                      {index < 3 ? (
                        index === 0 ? <FaCrown className="text-yellow-200 text-sm" /> :
                        index === 1 ? <FaMedal className="text-gray-200 text-sm" /> :
                        <FaAward className="text-yellow-200 text-sm" />
                      ) : (
                        <span className="text-sm font-bold text-white">#{index + 1}</span>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">{customer.customer.username}</p>
                      <p className="text-xs text-gray-400">{customer.customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">
                      ${customer.totalEarnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {customer.totalTransactions} transactions • {customer.totalCoins} coins
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Earnings Timeline */}
      {commissionStats.stats.earningsTimeline && commissionStats.stats.earningsTimeline.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaCalendarAlt className="text-blue-500" />
              Earnings Timeline
            </h3>
            <p className="text-gray-400 text-sm mt-1">Daily breakdown of your commission earnings</p>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {commissionStats.stats.earningsTimeline.map((day, index) => (
                <motion.div 
                  key={day.date} 
                  className="flex items-center justify-between p-3 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg border border-gray-600/50 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {new Date(day.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-400">
                      ${day.earnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {day.transactions} transactions
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCustomerList = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
              />
            </div>
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchCustomerList}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors flex items-center gap-2"
          >
            <FaFilter className="text-sm" />
            Search
          </motion.button>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FaUsers className="text-purple-500" />
            Your Affiliate Customers
          </h3>
          <p className="text-gray-400 text-sm mt-1">Customers who registered using your affiliate code</p>
        </div>
        <div className="divide-y divide-gray-700">
          {customerList.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <FaUsers className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">No customers found</p>
              <p className="text-sm">Share your affiliate code to start earning commissions</p>
            </div>
          ) : (
            customerList.map((customer, index) => (
              <motion.div
                key={customer._id}
                className="p-6 hover:bg-gray-700/30 cursor-pointer transition-colors"
                onClick={() => handleCustomerSelect(customer)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {customer.customerId.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-white">
                        {customer.customerId.username}
                      </p>
                      <p className="text-sm text-gray-400">{customer.customerId.email}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <FaCalendarAlt className="text-xs" />
                        Registered: {new Date(customer.registrationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">
                      ${customer.totalCommissionEarned.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {customer.totalTransactions} transactions
                    </p>
                    <p className="text-xs text-gray-400">
                      {customer.totalCoinsGenerated} coins
                    </p>
                  </div>
                </div>
                {customer.recentEarnings && customer.recentEarnings.length > 0 && (
                  <div className="mt-3 pl-16">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FaChartLine className="text-xs" />
                      Last activity: {new Date(customer.recentEarnings[0].transactionDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      <AnimatePresence>
        {selectedCustomer && customerDetails && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative min-h-screen flex items-center justify-center p-4">
              <motion.div 
                className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Customer Details: {customerDetails.customer.username}
                    </h3>
                    <p className="text-sm text-gray-400">{customerDetails.customer.email}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerDetails(null);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
                
                <div className="p-6">
                  {/* Customer Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">                      <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                      <h4 className="text-sm font-medium text-gray-400">Total Spent</h4>
                      <p className="text-lg font-bold text-white">
                        ${(customerDetails.stats?.totalSpent || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                      <h4 className="text-sm font-medium text-gray-400">Your Commission</h4>
                      <p className="text-lg font-bold text-green-400">
                        ${(customerDetails.stats?.totalCommissionEarned || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                      <h4 className="text-sm font-medium text-gray-400">Transactions</h4>
                      <p className="text-lg font-bold text-blue-400">
                        {customerDetails.stats?.totalTransactions || 0}
                      </p>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                      <h4 className="text-sm font-medium text-gray-400">Coins Used</h4>
                      <p className="text-lg font-bold text-purple-400">
                        {customerDetails.stats?.totalCoinsUsed || 0}
                      </p>
                    </div>
                  </div>

                  {/* Recent Earnings */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FaCoins className="text-yellow-500" />
                      Recent Earnings
                    </h4>
                    <div className="space-y-2">
                      {customerDetails.earnings.length === 0 ? (
                        <div className="text-center text-gray-400 py-6">
                          <FaDollarSign className="mx-auto h-8 w-8 mb-2 opacity-50" />
                          <p>No earnings recorded</p>
                        </div>
                      ) : (
                        customerDetails.earnings.slice(0, 10).map((earning, index) => (
                          <motion.div 
                            key={earning._id} 
                            className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <div>
                              <p className="text-sm font-medium text-white">
                                {new Date(earning.transactionDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-400">
                                Agent: {earning.agentId?.name || 'Unknown'} • {earning.coinsUsed} coins
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-400">
                                +${(earning.affiliateCommission || 0).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-400">
                                Total: ${(earning.totalAmount || 0).toFixed(2)}
                              </p>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-b-2 border-purple-500 opacity-20"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Affiliate Dashboard</h1>
        <p className="text-gray-400">Manage your affiliate customers and track commissions</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'dashboard'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            Dashboard
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'stats'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            Commission Stats
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setActiveTab('customers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'customers'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            Customer List
          </motion.button>
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'stats' && renderCommissionStats()}
          {activeTab === 'customers' && renderCustomerList()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AffiliateView;
