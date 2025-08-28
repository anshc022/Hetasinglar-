import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaDollarSign, 
  FaUsers, 
  FaHandshake, 
  FaChartLine, 
  FaDownload, 
  FaEdit, 
  FaEye, 
  FaCheck, 
  FaClock, 
  FaTimes,
  FaFilter,
  FaSearch,
  FaCog,
  FaPaypal,
  FaCreditCard,
  FaUniversity,
  FaInfoCircle,
  FaCalendarAlt
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const EarningsManagement = () => {
  const [earnings, setEarnings] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    adminEarnings: 0,
    agentEarnings: 0,
    affiliateEarnings: 0,
    totalTransactions: 0,
    totalCoins: 0
  });

  const [agentStats, setAgentStats] = useState([]);
  const [affiliateStats, setAffiliateStats] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    agentId: '',
    status: '',
    page: 1,
    limit: 50
  });
  const [agents, setAgents] = useState([]);
  const [selectedEarnings, setSelectedEarnings] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [activeView, setActiveView] = useState('overview');
  const [commissionSettings, setCommissionSettings] = useState({
    defaultAdminPercentage: 50,
    defaultAgentPercentage: 30,
    defaultAffiliatePercentage: 20
  });
  const [editingAgent, setEditingAgent] = useState(null);
  const [chartView, setChartView] = useState('all');

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // We want this to run only once on mount

  useEffect(() => {
    // Generate chart data when earnings data is available
    if (earnings && earnings.length > 0) {
      const generatedData = generateChartData();
      setChartData(generatedData);
    } else if (earnings && earnings.length === 0) {
      // Clear chart data if no earnings
      setChartData([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earnings]); // Generate chart when earnings data changes

  const fetchAllData = async () => {
    await Promise.all([
      fetchEarnings(),
      fetchCommissionOverview(),
      fetchAgentStats(),
      fetchAffiliateStats(),
      fetchAgents(),
      fetchCommissionSettings()
    ]);
  };

  const fetchCommissionSettings = async () => {
    try {
      const response = await axios.get('/api/admin/commission-settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      
      if (response.data.success) {
        setCommissionSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching commission settings:', error);
      // Keep default settings if fetch fails
    }
  };

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      
      // For chart data, fetch more records to get better daily breakdown
      const chartParams = {
        ...filters,
        limit: 1000, // Get more data for accurate chart
        page: 1
      };
      
      const response = await axios.get('/api/commission/earnings/admin', {
        params: chartParams,
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      
      setEarnings(response.data.earnings || []);
      setSummary(response.data.summary || {
        totalAmount: 0,
        adminEarnings: 0,
        agentEarnings: 0,
        affiliateEarnings: 0,
        totalTransactions: 0,
        totalCoins: 0
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionOverview = async () => {
    try {
      const response = await axios.get('/api/commission/overview', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
    } catch (error) {
      console.error('Error fetching commission overview:', error);
    }
  };

  const fetchAgentStats = async () => {
    try {
      const response = await axios.get('/api/admin/agents', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      
      // Enhanced agent stats with earnings data
      const agentsWithStats = response.data.agents?.map(agent => ({
        ...agent,
        chatsHandled: agent.totalChats || 0,
        coinsUsed: agent.totalCoinsUsed || 0,
        earnings: agent.totalEarnings || agent.earnings?.totalEarnings || 0,
        commissionRate: agent.commissionSettings?.chatCommissionPercentage || 30,
        lastPayment: agent.lastPayment || agent.earnings?.lastPayoutDate || null,
        payoutStatus: agent.payoutStatus || (agent.earnings?.pendingEarnings > 0 ? 'pending' : 'paid')
      })) || [];
      
      setAgentStats(agentsWithStats);
    } catch (error) {
      console.error('Error fetching agent stats:', error);
    }
  };

  const fetchAffiliateStats = async () => {
    try {
      const response = await axios.get('/api/affiliate/admin/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setAffiliateStats(response.data.affiliates || []);
    } catch (error) {
      console.error('Error fetching affiliate stats:', error);
      // Set empty array as fallback instead of failing
      setAffiliateStats([]);
    }
  };

  const generateChartData = () => {
    if (!earnings || earnings.length === 0) {
      return [];
    }

    // Group earnings by date for the last 30 days
    const days = 30;
    const today = new Date();
    const dateMap = new Map();
    
    // Initialize all dates with zero values
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dateMap.set(dateKey, {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: dateKey,
        admin: 0,
        agent: 0,
        affiliate: 0,
        total: 0
      });
    }

    // Process real earnings data
    earnings.forEach(earning => {
      const transactionDate = new Date(earning.transactionDate || earning.createdAt);
      const dateKey = transactionDate.toISOString().split('T')[0];
      
      // Only include data from the last 30 days
      if (dateMap.has(dateKey)) {
        const dayData = dateMap.get(dateKey);
        dayData.admin += earning.adminCommission || 0;
        dayData.agent += earning.agentCommission || 0;
        dayData.affiliate += earning.affiliateCommission || 0;
        dayData.total += earning.totalAmount || 0;
      }
    });

    // Convert map to array and round values
    return Array.from(dateMap.values()).map(day => ({
      ...day,
      admin: Math.round(day.admin * 100) / 100,
      agent: Math.round(day.agent * 100) / 100,
      affiliate: Math.round(day.affiliate * 100) / 100,
      total: Math.round(day.total * 100) / 100
    }));
  };
  const fetchAgents = async () => {
    try {
      const response = await axios.get('/api/admin/agents', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setAgents(response.data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handleEarningSelect = (earningId) => {
    setSelectedEarnings(prev => 
      prev.includes(earningId) 
        ? prev.filter(id => id !== earningId)
        : [...prev, earningId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEarnings.length === earnings.length && earnings.length > 0) {
      setSelectedEarnings([]);
    } else {
      setSelectedEarnings(earnings.map(e => e._id));
    }
  };

  const updatePaymentStatus = async (earningId, status, notes = '') => {
    try {
      await axios.put(`/api/commission/earnings/${earningId}/payment-status`, {
        status,
        notes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchAllData(); // Refresh data
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status');
    }
  };

  const handleBulkPayment = async () => {
    if (selectedEarnings.length === 0) {
      alert('Please select earnings to process');
      return;
    }

    try {
      await axios.post('/api/commission/payments/bulk-process', {
        earningIds: selectedEarnings,
        status: paymentStatus,
        notes: paymentNotes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      
      setShowPaymentModal(false);
      setSelectedEarnings([]);
      setPaymentStatus('');
      setPaymentNotes('');
      fetchAllData();
      alert('Payments processed successfully');
    } catch (error) {
      console.error('Error processing bulk payments:', error);
      alert('Error processing payments');
    }
  };

  const updateAgentCommission = async (agentId, newPercentage) => {
    try {
      await axios.put(`/api/admin/agents/${agentId}/commission`, {
        chatCommissionPercentage: newPercentage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchAgentStats();
      setEditingAgent(null);
    } catch (error) {
      console.error('Error updating agent commission:', error);
      alert('Error updating commission rate');
    }
  };

  const exportData = (type, format) => {
    let data, filename;
    
    if (type === 'earnings') {
      data = earnings.map(earning => ({
        'Transaction ID': earning.transactionId,
        'Date': new Date(earning.transactionDate || earning.createdAt).toLocaleDateString(),
        'User': earning.userId?.username || 'N/A',
        'Agent': earning.agentId?.name || 'N/A',
        'Coins Used': earning.coinsUsed,
        'Total Amount': earning.totalAmount.toFixed(2),
        'Admin Commission': earning.adminCommission?.toFixed(2) || '0.00',
        'Agent Commission': earning.agentCommission?.toFixed(2) || '0.00',
        'Affiliate Commission': earning.affiliateCommission?.toFixed(2) || '0.00',
        'Payment Status': earning.paymentStatus
      }));
      filename = `earnings_${new Date().toISOString().split('T')[0]}`;
    } else if (type === 'agents') {
      data = agentStats.map(agent => ({
        'Agent ID': agent.agentId,
        'Name': agent.name,
        'Chats Handled': agent.chatsHandled,
        'Coins Used': agent.coinsUsed,
        'Total Earnings': agent.earnings.toFixed(2),
        'Commission Rate': `${agent.commissionRate}%`,
        'Payout Status': agent.payoutStatus
      }));
      filename = `agent_earnings_${new Date().toISOString().split('T')[0]}`;
    } else if (type === 'affiliates') {
      data = affiliateStats.map(affiliate => ({
        'Affiliate Agent ID': affiliate.affiliateAgentId,
        'Agent Name': affiliate.affiliateAgentName,
        'Assigned Customers': affiliate.assignedCustomers || 0,
        'Active Customers': affiliate.activeCustomers || 0,
        'Coins Generated': affiliate.totalCoinsGenerated || 0,
        'Total Commission': (affiliate.totalCommissionEarned || 0).toFixed(2),
        'Conversion Rate': `${(affiliate.conversionRate || 0).toFixed(1)}%`
      }));
      filename = `affiliate_earnings_${new Date().toISOString().split('T')[0]}`;
    } else if (type === 'affiliates') {
      data = affiliateStats.map(affiliate => ({
        'Affiliate ID': affiliate.agentId,
        'Name': affiliate.name,
        'Assigned Customers': affiliate.assignedCustomers,
        'Active Customers': affiliate.activeCustomers,
        'Coins Generated': affiliate.totalCoinsGenerated,
        'Total Commission': affiliate.totalCommissionEarned.toFixed(2),
        'Conversion Rate': `${affiliate.conversionRate}%`
      }));
      filename = `affiliate_earnings_${new Date().toISOString().split('T')[0]}`;
    }

    if (format === 'csv') {
      const csvContent = "data:text/csv;charset=utf-8," + 
        Object.keys(data[0]).join(",") + "\n" +
        data.map(row => Object.values(row).join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    setShowExportModal(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      processed: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      paid: 'bg-green-500/20 text-green-400 border-green-500/50',
      disputed: 'bg-red-500/20 text-red-400 border-red-500/50',
      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <FaClock className="w-3 h-3" />,
      processed: <FaClock className="w-3 h-3" />,
      paid: <FaCheck className="w-3 h-3" />,
      disputed: <FaTimes className="w-3 h-3" />,
      cancelled: <FaTimes className="w-3 h-3" />
    };
    return icons[status] || <FaClock className="w-3 h-3" />;
  };

  // Earnings Graph Component
  const EarningsGraph = () => {
    const getFilteredData = () => {
      if (chartView === 'all') return chartData;
      return chartData.map(item => ({
        ...item,
        admin: chartView === 'admin' ? item.admin : 0,
        agent: chartView === 'agent' ? item.agent : 0,
        affiliate: chartView === 'affiliate' ? item.affiliate : 0
      }));
    };

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg">
            <p className="text-gray-300 text-sm font-medium">{label}</p>
            {payload.map((entry, index) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: ${entry.value.toFixed(2)}
              </p>
            ))}
            <p className="text-gray-400 text-xs mt-1 border-t border-gray-600 pt-1">
              Total: ${payload.reduce((sum, entry) => sum + entry.value, 0).toFixed(2)}
            </p>
          </div>
        );
      }
      return null;
    };

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Revenue Trends</h3>
            <p className="text-gray-400 text-sm">Last 30 days performance</p>
          </div>
          <div className="flex gap-2">
            {['all', 'admin', 'agent', 'affiliate'].map((view) => (
              <motion.button
                key={view}
                onClick={() => setChartView(view)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  chartView === view
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>
        
        <div className="h-64 bg-gray-700 rounded-lg border border-gray-600 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                <p className="text-gray-300">Loading earnings data...</p>
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getFilteredData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: '#9CA3AF' }}
                />
                {(chartView === 'all' || chartView === 'admin') && (
                  <Line 
                    type="monotone" 
                    dataKey="admin" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Admin Revenue"
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                )}
                {(chartView === 'all' || chartView === 'agent') && (
                  <Line 
                    type="monotone" 
                    dataKey="agent" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    name="Agent Revenue"
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                )}
                {(chartView === 'all' || chartView === 'affiliate') && (
                  <Line 
                    type="monotone" 
                    dataKey="affiliate" 
                    stroke="#F97316" 
                    strokeWidth={2}
                    name="Affiliate Revenue"
                    dot={{ fill: '#F97316', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FaChartLine className="text-4xl text-gray-400 mx-auto mb-2" />
                <p className="text-gray-300">No earnings data available</p>
                <p className="text-gray-400 text-sm">
                  {earnings.length === 0 
                    ? "No transactions found for the selected period" 
                    : "Chart will display once earnings data is loaded"
                  }
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-400">Admin Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-400">Agent Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-gray-400">Affiliate Revenue</span>
          </div>
        </div>
      </motion.div>
    );
  };

  // Navigation Tabs Component
  const NavigationTabs = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gray-800 p-1 rounded-lg mb-6 border border-gray-700"
    >
      {/* Desktop Navigation */}
      <div className="hidden lg:flex space-x-1">
        {[
          { id: 'overview', label: 'Overview', icon: FaChartLine },
          { id: 'agents', label: 'Agent Earnings', icon: FaUsers },
          { id: 'affiliates', label: 'Affiliates', icon: FaHandshake },
          { id: 'payouts', label: 'Payout Management', icon: FaDollarSign },
          { id: 'settings', label: 'Commission Settings', icon: FaCog }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                activeView === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* Mobile Navigation - Scrollable horizontal tabs */}
      <div className="lg:hidden overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {[
            { id: 'overview', label: 'Overview', icon: FaChartLine },
            { id: 'agents', label: 'Agents', icon: FaUsers },
            { id: 'affiliates', label: 'Affiliates', icon: FaHandshake },
            { id: 'payouts', label: 'Payouts', icon: FaDollarSign },
            { id: 'settings', label: 'Settings', icon: FaCog }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md font-medium transition-all duration-200 whitespace-nowrap ${
                  activeView === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  // Summary Cards Component
  const SummaryCards = () => {
    const totalAmount = summary.totalAmount || 0;
    const adminEarnings = summary.adminEarnings || 0;
    const agentEarnings = summary.agentEarnings || 0;
    const affiliateEarnings = summary.affiliateEarnings || 0;
    const totalCoins = summary.totalCoins || 0;
    
    const adminPercentage = totalAmount > 0 ? ((adminEarnings / totalAmount) * 100) : 0;
    
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-6 mb-4 lg:mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 p-3 lg:p-6 rounded-lg lg:rounded-xl shadow-lg border border-blue-700/50 backdrop-blur-sm"
        >
          <div className="text-center lg:flex lg:items-center lg:justify-between">
            <div className="lg:flex-1">
              <p className="text-blue-300 text-xs font-medium">Total</p>
              <p className="text-lg lg:text-2xl font-bold text-white">${totalAmount.toFixed(0)}</p>
              <p className="text-blue-400 text-xs mt-0.5 lg:mt-1 hidden lg:block">{totalCoins.toLocaleString()} coins</p>
            </div>
            <div className="hidden lg:block p-2 lg:p-3 bg-blue-700/50 rounded-lg">
              <FaDollarSign className="text-blue-300 text-lg lg:text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-900/50 to-green-800/50 p-3 lg:p-6 rounded-lg lg:rounded-xl shadow-lg border border-green-700/50 backdrop-blur-sm"
        >
          <div className="text-center lg:flex lg:items-center lg:justify-between">
            <div className="lg:flex-1">
              <p className="text-green-300 text-xs font-medium">Admin</p>
              <p className="text-lg lg:text-2xl font-bold text-white">${adminEarnings.toFixed(0)}</p>
              <p className="text-green-400 text-xs mt-0.5 lg:mt-1 hidden lg:block">{adminPercentage.toFixed(1)}%</p>
            </div>
            <div className="hidden lg:block p-2 lg:p-3 bg-green-700/50 rounded-lg">
              <FaChartLine className="text-green-300 text-lg lg:text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-3 lg:p-6 rounded-lg lg:rounded-xl shadow-lg border border-purple-700/50 backdrop-blur-sm"
        >
          <div className="text-center lg:flex lg:items-center lg:justify-between">
            <div className="lg:flex-1">
              <p className="text-purple-300 text-xs font-medium">Agents</p>
              <p className="text-lg lg:text-2xl font-bold text-white">${agentEarnings.toFixed(0)}</p>
              <p className="text-purple-400 text-xs mt-0.5 lg:mt-1 hidden lg:block">{agentStats.length} active</p>
            </div>
            <div className="hidden lg:block p-2 lg:p-3 bg-purple-700/50 rounded-lg">
              <FaUsers className="text-purple-300 text-lg lg:text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-900/50 to-orange-800/50 p-3 lg:p-6 rounded-lg lg:rounded-xl shadow-lg border border-orange-700/50 backdrop-blur-sm"
        >
          <div className="text-center lg:flex lg:items-center lg:justify-between">
            <div className="lg:flex-1">
              <p className="text-orange-300 text-xs font-medium">Affiliates</p>
              <p className="text-lg lg:text-2xl font-bold text-white">${affiliateEarnings.toFixed(0)}</p>
              <p className="text-orange-400 text-xs mt-0.5 lg:mt-1 hidden lg:block">{affiliateStats.length} active</p>
            </div>
            <div className="hidden lg:block p-2 lg:p-3 bg-orange-700/50 rounded-lg">
              <FaHandshake className="text-orange-300 text-lg lg:text-xl" />
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // Agent Earnings Table Component
  const AgentEarningsTable = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gray-800 rounded-xl shadow-lg border border-gray-700"
    >
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Agent Earnings</h3>
            <p className="text-gray-400 text-sm">Manage individual agent commissions and payouts</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={fetchAgentStats}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white border border-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-200"
            >
              <FaSearch className="w-4 h-4" />
              Refresh
            </motion.button>
            <motion.button
              onClick={() => exportData('agents', 'csv')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              <FaDownload className="w-4 h-4" />
              Export
            </motion.button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Chats Handled</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Coins Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Earnings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Commission %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-400">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mr-2"></div>
                    Loading agent data...
                  </div>
                </td>
              </tr>
            ) : agentStats.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-400">
                  No agents found
                </td>
              </tr>
            ) : (
              agentStats.map((agent) => (
                <tr key={agent._id} className="hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {agent.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{agent.name || 'Unknown Agent'}</div>
                        <div className="text-sm text-gray-400">ID: {agent.agentId || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    <div className="flex flex-col">
                      <span className="font-medium">{agent.chatsHandled || 0}</span>
                      <span className="text-xs text-gray-400">
                        {(agent.totalMessages || 0).toLocaleString()} messages
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    <span className="font-medium">{(agent.coinsUsed || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    <div className="flex flex-col">
                      <span className="text-green-400">${(agent.earnings || 0).toFixed(2)}</span>
                      {agent.earnings > 0 && (
                        <span className="text-xs text-gray-400">
                          ${((agent.earnings || 0) / Math.max(agent.coinsUsed || 1, 1)).toFixed(3)}/coin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingAgent === agent._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          defaultValue={agent.commissionRate || 30}
                          className="w-16 px-2 py-1 border border-gray-600 rounded text-sm bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                          onBlur={(e) => updateAgentCommission(agent._id, parseInt(e.target.value))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateAgentCommission(agent._id, parseInt(e.target.value));
                            }
                          }}
                        />
                        <span className="text-sm text-gray-400">%</span>
                        <button
                          onClick={() => setEditingAgent(null)}
                          className="text-gray-400 hover:text-gray-300"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium bg-blue-600 text-white px-2 py-1 rounded">
                          {agent.commissionRate || 30}%
                        </span>
                        <button
                          onClick={() => setEditingAgent(agent._id)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit commission rate"
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-400">
                      {agent.lastPayment 
                        ? new Date(agent.lastPayment).toLocaleDateString() 
                        : 'Never'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-blue-400 hover:text-blue-300 p-2 hover:bg-gray-700 rounded-lg transition-all duration-200"
                        title="View Details"
                      >
                        <FaEye className="w-4 h-4" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-green-400 hover:text-green-300 p-2 hover:bg-gray-700 rounded-lg transition-all duration-200"
                        title="Process Payout"
                      >
                        <FaDollarSign className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {agentStats.length > 0 && (
        <div className="px-6 py-4 bg-gray-700 border-t border-gray-600">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Total: {agentStats.length} agents</span>
            <span>
              Total Earnings: $
              {agentStats.reduce((sum, agent) => sum + (agent.earnings || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );

  // Affiliate Earnings Table Component
  const AffiliateEarningsTable = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gray-800 rounded-xl shadow-lg border border-gray-700"
    >
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Affiliate Earnings</h3>
            <p className="text-gray-400 text-sm">Track affiliate agent performance and commissions</p>
          </div>
          <motion.button
            onClick={() => exportData('affiliates', 'csv')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200"
          >
            <FaDownload className="w-4 h-4" />
            Export
          </motion.button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Affiliate Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Assigned Customers</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Active Customers</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Coins Generated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Commission</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Conversion Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {affiliateStats.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <FaHandshake className="text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-400 font-medium">No affiliate data available</p>
                    <p className="text-gray-400 text-sm">Affiliate agents will appear here once they start generating referrals</p>
                  </div>
                </td>
              </tr>
            ) : (
              affiliateStats.map((affiliate) => (
                <tr key={affiliate._id} className="hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold">
                          {affiliate.affiliateAgentName?.charAt(0) || 'A'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{affiliate.affiliateAgentName}</div>
                        <div className="text-sm text-gray-400">ID: {affiliate.affiliateAgentId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {affiliate.assignedCustomers || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {affiliate.activeCustomers || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {(affiliate.totalCoinsGenerated || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    ${(affiliate.totalCommissionEarned || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-white">
                        {(affiliate.conversionRate || 0).toFixed(1)}%
                      </span>
                      <div className="ml-2 w-16 bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(affiliate.conversionRate || 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <FaDollarSign className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  // Payout Management Component
  const PayoutManagement = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Payout Management</h3>
              <p className="text-gray-400 text-sm">Process pending payments and manage payout history</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaCheck className="w-4 h-4" />
                Process Payouts
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Pending Payouts</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    ${earnings.filter(e => e.paymentStatus === 'pending').reduce((sum, e) => sum + e.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
                <FaClock className="text-yellow-600 text-2xl" />
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Processing</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${earnings.filter(e => e.paymentStatus === 'processed').reduce((sum, e) => sum + e.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
                <FaClock className="text-blue-600 text-2xl" />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-900">
                    ${earnings.filter(e => e.paymentStatus === 'paid').reduce((sum, e) => sum + e.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
                <FaCheck className="text-green-600 text-2xl" />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedEarnings.length === earnings.length && earnings.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {earnings.slice(0, 20).map((earning) => (
                  <tr key={earning._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEarnings.includes(earning._id)}
                        onChange={() => handleEarningSelect(earning._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-white">
                          {earning.transactionId?.substring(0, 8)}...
                        </div>
                        <div className="text-gray-400">
                          {new Date(earning.transactionDate || earning.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {earning.agentId?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      ${earning.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-200">
                        <FaUniversity className="w-3 h-3" />
                        Bank Transfer
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(earning.paymentStatus)}`}>
                        {getStatusIcon(earning.paymentStatus)}
                        {earning.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {earning.paymentStatus === 'pending' && (
                          <button
                            onClick={() => updatePaymentStatus(earning._id, 'processed')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Process
                          </button>
                        )}
                        {earning.paymentStatus === 'processed' && (
                          <button
                            onClick={() => updatePaymentStatus(earning._id, 'paid')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // Commission Settings Component
  const CommissionSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Default Commission Structure</h3>
              <p className="text-gray-400 text-sm">Set default commission percentages for new agents</p>
            </div>
            <button
              onClick={() => setShowCommissionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaCog className="w-4 h-4" />
              Update Settings
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-green-800/50 rounded-full flex items-center justify-center mb-4">
                <FaChartLine className="text-green-400 text-2xl" />
              </div>
              <h4 className="font-medium text-white mb-2">Admin Share</h4>
              <p className="text-3xl font-bold text-green-400">{commissionSettings.defaultAdminPercentage}%</p>
              <p className="text-sm text-gray-400 mt-1">Platform revenue</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-purple-800/50 rounded-full flex items-center justify-center mb-4">
                <FaUsers className="text-purple-400 text-2xl" />
              </div>
              <h4 className="font-medium text-white mb-2">Agent Share</h4>
              <p className="text-3xl font-bold text-purple-400">{commissionSettings.defaultAgentPercentage}%</p>
              <p className="text-sm text-gray-400 mt-1">Chat handling</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-orange-800/50 rounded-full flex items-center justify-center mb-4">
                <FaHandshake className="text-orange-400 text-2xl" />
              </div>
              <h4 className="font-medium text-white mb-2">Affiliate Share</h4>
              <p className="text-3xl font-bold text-orange-400">{commissionSettings.defaultAffiliatePercentage}%</p>
              <p className="text-sm text-gray-400 mt-1">Customer referral</p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <FaInfoCircle className="text-blue-600 mt-1" />
              <div>
                <h5 className="font-medium text-blue-900">Commission Structure Info</h5>
                <p className="text-blue-700 text-sm mt-1">
                  These are default percentages applied to new agents. Individual agent commissions can be customized 
                  in the Agent Earnings section. All percentages must total 100%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Filter Component
  const FilterSection = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 mb-6"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-gray-400" />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="Start Date"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <FaUsers className="text-gray-400" />
          <select
            value={filters.agentId}
            onChange={(e) => handleFilterChange('agentId', e.target.value)}
            className="border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Agents</option>
            {agents.map((agent) => (
              <option key={agent._id} value={agent._id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processed">Processed</option>
            <option value="paid">Paid</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-auto"
        >
          <FaDownload className="w-4 h-4" />
          Export Reports
        </button>
      </div>
    </motion.div>
  );

  // Payment Modal Component
  const PaymentModal = () => (
    <AnimatePresence>
      {showPaymentModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Process Bulk Payment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bank', label: 'Bank Transfer', icon: FaUniversity },
                    { id: 'upi', label: 'UPI', icon: FaCreditCard },
                    { id: 'paypal', label: 'PayPal', icon: FaPaypal }
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        className="flex flex-col items-center gap-2 p-3 border border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-900/50 transition-colors"
                      >
                        <Icon className="text-gray-400 text-xl" />
                        <span className="text-xs text-gray-400">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="processed">Processed</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Payment notes..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkPayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Process Payment
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Export Modal Component
  const ExportModal = () => (
    <AnimatePresence>
      {showExportModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FaDownload className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Export Reports</h3>
                <p className="text-sm text-gray-400">Download your data in CSV format</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Choose Report Type</label>
                <div className="space-y-3">
                  <motion.button
                    onClick={() => exportData('earnings', 'csv')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left p-4 border border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-900/30 bg-gray-700 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <FaDollarSign className="text-green-400 text-lg group-hover:text-green-300" />
                      <div className="flex-1">
                        <div className="font-medium text-white group-hover:text-blue-300">Earnings Report</div>
                        <div className="text-sm text-gray-400">All transaction and commission data</div>
                      </div>
                      <FaDownload className="text-gray-500 group-hover:text-blue-400" />
                    </div>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => exportData('agents', 'csv')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left p-4 border border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-900/30 bg-gray-700 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <FaUsers className="text-purple-400 text-lg group-hover:text-purple-300" />
                      <div className="flex-1">
                        <div className="font-medium text-white group-hover:text-blue-300">Agent Performance Report</div>
                        <div className="text-sm text-gray-400">Agent earnings and statistics</div>
                      </div>
                      <FaDownload className="text-gray-500 group-hover:text-blue-400" />
                    </div>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => exportData('affiliates', 'csv')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left p-4 border border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-900/30 bg-gray-700 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <FaHandshake className="text-orange-400 text-lg group-hover:text-orange-300" />
                      <div className="flex-1">
                        <div className="font-medium text-white group-hover:text-blue-300">Affiliate Earnings Report</div>
                        <div className="text-sm text-gray-400">Affiliate earnings and performance</div>
                      </div>
                      <FaDownload className="text-gray-500 group-hover:text-blue-400" />
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
              <motion.button
                onClick={() => setShowExportModal(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2"
              >
                <FaTimes className="w-4 h-4" />
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Commission Settings Modal Component
  const CommissionSettingsModal = () => {
    const [tempSettings, setTempSettings] = useState({
      defaultAdminPercentage: commissionSettings.defaultAdminPercentage,
      defaultAgentPercentage: commissionSettings.defaultAgentPercentage,
      defaultAffiliatePercentage: commissionSettings.defaultAffiliatePercentage
    });

    const handlePercentageChange = (key, value) => {
      const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
      setTempSettings(prev => ({ ...prev, [key]: numValue }));
    };

    const handleSaveSettings = async () => {
      try {
        // Validate that percentages total 100%
        const total = tempSettings.defaultAdminPercentage + tempSettings.defaultAgentPercentage + tempSettings.defaultAffiliatePercentage;
        if (total !== 100) {
          alert(`Commission percentages must total 100%. Current total: ${total}%`);
          return;
        }

        const response = await axios.put('/api/admin/commission-settings', tempSettings, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });

        if (response.data.success) {
          setCommissionSettings(tempSettings);
          setShowCommissionModal(false);
          alert('Commission settings updated successfully!');
        }
      } catch (error) {
        console.error('Error updating commission settings:', error);
        alert('Failed to update commission settings. Please try again.');
      }
    };

    const totalPercentage = tempSettings.defaultAdminPercentage + tempSettings.defaultAgentPercentage + tempSettings.defaultAffiliatePercentage;

    return (
      <AnimatePresence>
        {showCommissionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4 border border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Commission Settings</h3>
              <p className="text-gray-600 text-sm mb-6">
                Set the default commission percentages for new agents. All percentages must total 100%.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Commission (Platform Revenue)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tempSettings.defaultAdminPercentage}
                      onChange={(e) => handlePercentageChange('defaultAdminPercentage', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Commission (Chat Handling)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tempSettings.defaultAgentPercentage}
                      onChange={(e) => handlePercentageChange('defaultAgentPercentage', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Affiliate Commission (Customer Referral)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tempSettings.defaultAffiliatePercentage}
                      onChange={(e) => handlePercentageChange('defaultAffiliatePercentage', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${totalPercentage === 100 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total:</span>
                    <span className={`text-sm font-bold ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalPercentage}%
                    </span>
                  </div>
                  {totalPercentage !== 100 && (
                    <p className="text-red-600 text-xs mt-1">
                      Percentages must total exactly 100%
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCommissionModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={totalPercentage !== 100}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    totalPercentage === 100
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-3 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Earnings & Commission Panel</h1>
            <p className="text-gray-400 mt-1 text-sm lg:text-base">Comprehensive platform revenue management and commission tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center lg:text-right">
              <div className="text-xs lg:text-sm text-gray-400">Total Platform Revenue</div>
              <div className="text-xl lg:text-2xl font-bold text-green-400">${(summary.totalAmount || 0).toFixed(2)}</div>
            </div>
          </div>
        </motion.div>

      {/* Navigation Tabs */}
      <NavigationTabs />

      {/* Conditional Content Based on Active View */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <>
          {activeView === 'overview' && (
            <>
              <SummaryCards />
              <EarningsGraph />
              <FilterSection />
              
              {/* Recent Transactions Preview */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800 rounded-xl shadow-lg border border-gray-700"
              >
                <div className="p-4 lg:p-6 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                  <p className="text-gray-400 text-sm">Latest earnings and commission activity</p>
                </div>
                
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  {earnings.length > 0 ? earnings.slice(0, 10).map((earning) => (
                    <div key={earning._id} className="p-4 border-b border-gray-700 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {earning.transactionId?.substring(0, 8) || 'N/A'}...
                          </div>
                          <div className="text-xs text-gray-400">
                            {earning.agentId?.name || 'Unknown'}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(earning.paymentStatus)}`}>
                          {getStatusIcon(earning.paymentStatus)}
                          {earning.paymentStatus}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Coins:</span>
                          <div className="text-white font-medium">{earning.coinsUsed || 0}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Amount:</span>
                          <div className="text-white font-medium">${(earning.totalAmount || 0).toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Date:</span>
                          <div className="text-white font-medium">
                            {earning.transactionDate ? new Date(earning.transactionDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-gray-400">
                      No transactions found
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Transaction</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Agent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Coins</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {earnings.length > 0 ? earnings.slice(0, 10).map((earning) => (
                        <tr key={earning._id} className="hover:bg-gray-700 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {earning.transactionId?.substring(0, 8) || 'N/A'}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {earning.agentId?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {earning.coinsUsed || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            ${(earning.totalAmount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(earning.paymentStatus)}`}>
                              {getStatusIcon(earning.paymentStatus)}
                              {earning.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {earning.transactionDate ? new Date(earning.transactionDate).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-gray-400">
                            No transactions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}

          {activeView === 'agents' && <AgentEarningsTable />}
          {activeView === 'affiliates' && <AffiliateEarningsTable />}
          {activeView === 'payouts' && <PayoutManagement />}
          {activeView === 'settings' && <CommissionSettings />}
        </>
      )}

      {/* Modals */}
      <PaymentModal />
      <ExportModal />
      <CommissionSettingsModal />
      </div>
    </div>
  );
};


export default EarningsManagement;
