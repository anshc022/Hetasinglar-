import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaDollarSign, 
  FaCoins, 
  FaChartLine, 
  FaPercentage, 
  FaDownload, 
  FaFilter,
  FaCalendarAlt,
  FaUsers,
  FaSearch,
  FaWallet,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaHandshake,
  FaUserTie,
  FaBell,
  FaMoneyBillWave,
  FaFileExport,
  FaComments
} from 'react-icons/fa';
import { format, formatDistanceToNow, startOfMonth, endOfMonth, subMonths, addDays } from 'date-fns';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AgentEarnings = ({ agentId }) => {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('chat-earnings');
  const [dateRange, setDateRange] = useState('month');
  const [chartType, setChartType] = useState('earnings');
  
  // Data states
  const [summaryStats, setSummaryStats] = useState({
    totalEarnings: 0,
    affiliateCommission: 0,
    pendingPayment: 0,
    withdrawableBalance: 0
  });
  
  const [trendData, setTrendData] = useState({
    labels: [],
    chatEarnings: [],
    affiliateEarnings: []
  });
  
  const [chatEarnings, setChatEarnings] = useState([]);
  const [affiliateStats, setAffiliateStats] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [agent, setAgent] = useState(null);
  const [withdrawalSettings, setWithdrawalSettings] = useState({
    minimumAmount: 50,
    nextEligibleDate: null,
    lastPaymentDate: null
  });
  
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    showForm: false
  });

  useEffect(() => {
    if (agentId) {
      fetchAllData();
    }
  }, [agentId, dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSummaryStats(),
        fetchTrendData(),
        fetchChatEarnings(),
        fetchAffiliateStats(),
        fetchPayoutHistory(),
        fetchAgentInfo(),
        fetchWithdrawalSettings()
      ]);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryStats = async () => {
    try {
      const currentMonth = startOfMonth(new Date());
      const response = await axios.get(`/api/commission/earnings/agent/${agentId}/summary`, {
        params: { startDate: currentMonth.toISOString() },
        headers: { Authorization: `Bearer ${localStorage.getItem('agentToken')}` }
      });
      setSummaryStats(response.data.summary || {});
    } catch (error) {
      console.error('Error fetching summary stats:', error);
    }
  };

  const fetchTrendData = async () => {
    try {
      const endDate = new Date();
      let startDate;
      
      switch(dateRange) {
        case 'week':
          startDate = addDays(endDate, -7);
          break;
        case 'month':
          startDate = startOfMonth(endDate);
          break;
        case '3months':
          startDate = subMonths(endDate, 3);
          break;
        default:
          startDate = startOfMonth(endDate);
      }

      const response = await axios.get(`/api/commission/earnings/agent/${agentId}/trends`, {
        params: { 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          granularity: dateRange === 'week' ? 'day' : 'week'
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('agentToken')}` }
      });
      
      setTrendData(response.data.trends || { labels: [], chatEarnings: [], affiliateEarnings: [] });
    } catch (error) {
      console.error('Error fetching trend data:', error);
    }
  };

  const fetchChatEarnings = async () => {
    try {
      const response = await axios.get(`/api/commission/earnings/agent/${agentId}/chats`, {
        params: { limit: 50 },
        headers: { Authorization: `Bearer ${localStorage.getItem('agentToken')}` }
      });
      setChatEarnings(response.data.earnings || []);
    } catch (error) {
      console.error('Error fetching chat earnings:', error);
    }
  };

  const fetchAffiliateStats = async () => {
    try {
      const response = await axios.get(`/api/affiliate/stats/agent/${agentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('agentToken')}` }
      });
      setAffiliateStats(response.data.affiliates || []);
    } catch (error) {
      console.error('Error fetching affiliate stats:', error);
    }
  };

  const fetchPayoutHistory = async () => {
    try {
      const response = await axios.get(`/api/commission/payouts/agent/${agentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('agentToken')}` }
      });
      setPayoutHistory(response.data.payouts || []);
    } catch (error) {
      console.error('Error fetching payout history:', error);
    }
  };

  const fetchAgentInfo = async () => {
    try {
      const response = await axios.get(`/api/agents/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('agentToken')}` }
      });
      setAgent(response.data);
    } catch (error) {
      console.error('Error fetching agent info:', error);
    }
  };

  const fetchWithdrawalSettings = async () => {
    try {
      const response = await axios.get(`/api/commission/withdrawal-settings/agent/${agentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('agentToken')}` }
      });
      setWithdrawalSettings(response.data.settings || {});
    } catch (error) {
      console.error('Error fetching withdrawal settings:', error);
    }
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    
    try {
      // Validate amount
      const amount = parseFloat(withdrawalForm.amount);
      if (isNaN(amount) || amount < 50) {
        alert('Please enter a valid amount (minimum $50)');
        return;
      }

      if (amount > summaryStats.withdrawableBalance) {
        alert(`Insufficient balance. Available: $${summaryStats.withdrawableBalance.toFixed(2)}`);
        return;
      }

      const response = await axios.post(`/api/commission/withdraw/agent/${agentId}`, {
        amount: amount,
        paymentMethod: withdrawalForm.paymentMethod || 'bank_transfer'
      }, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('agentToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        // Refresh data after successful withdrawal
        await fetchAllData();
        await fetchWithdrawalSettings();
        setWithdrawalForm({ amount: '', paymentMethod: 'bank_transfer', showForm: false });
        alert(response.data.message || 'Withdrawal request submitted successfully!');
      } else {
        throw new Error(response.data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to submit withdrawal request';
      alert(errorMessage);
    }
  };

  const exportEarningsReport = async (format = 'csv') => {
    try {
      const response = await axios.get(`/api/commission/earnings/agent/${agentId}/export`, {
        params: { format, dateRange },
        headers: { Authorization: `Bearer ${localStorage.getItem('agentToken')}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `earnings_report_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const getChartData = () => {
    const baseConfig = {
      labels: trendData.labels,
      datasets: []
    };

    if (chartType === 'earnings') {
      baseConfig.datasets.push({
        label: 'Chat Earnings',
        data: trendData.chatEarnings,
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.4
      });
    }

    if (chartType === 'affiliate' || chartType === 'both') {
      baseConfig.datasets.push({
        label: 'Affiliate Commission',
        data: trendData.affiliateEarnings,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: chartType === 'affiliate',
        tension: 0.4
      });
    }

    if (chartType === 'both' && chartType !== 'affiliate') {
      baseConfig.datasets.push({
        label: 'Chat Earnings',
        data: trendData.chatEarnings,
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: false,
        tension: 0.4
      });
    }

    return baseConfig;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#9CA3AF',
          usePointStyle: true
        }
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: '#374151'
        },
        ticks: {
          color: '#9CA3AF'
        }
      },
      y: {
        grid: {
          color: '#374151'
        },
        ticks: {
          color: '#9CA3AF',
          callback: function(value) {
            return '$' + value.toFixed(2);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const SummaryCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="text-white text-xl" />
        </div>
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-white text-2xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
    </motion.div>
  );

  const StatusBadge = ({ status }) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800'
    };

    const icons = {
      paid: FaCheckCircle,
      pending: FaClock,
      failed: FaTimesCircle,
      processing: FaClock
    };

    const Icon = icons[status] || FaClock;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        <Icon className="mr-1 h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Earnings Dashboard</h1>
          <p className="text-gray-400">Track your earnings, commissions, and manage withdrawals</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportEarningsReport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <FaFileExport />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Earnings (This Month)"
          value={`$${summaryStats.totalEarnings?.toFixed(2) || '0.00'}`}
          icon={FaDollarSign}
          color="bg-green-500"
          subtitle="From chat sessions"
        />
        <SummaryCard
          title="Affiliate Commission"
          value={`$${summaryStats.affiliateCommission?.toFixed(2) || '0.00'}`}
          icon={FaUserTie}
          color="bg-blue-500"
          subtitle="From referred customers"
        />
        <SummaryCard
          title="Pending Payment"
          value={`$${summaryStats.pendingPayment?.toFixed(2) || '0.00'}`}
          icon={FaClock}
          color="bg-yellow-500"
          subtitle="Being processed"
        />
        <SummaryCard
          title="Withdrawable Balance"
          value={`$${summaryStats.withdrawableBalance?.toFixed(2) || '0.00'}`}
          icon={FaWallet}
          color="bg-purple-500"
          subtitle="Available for withdrawal"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <nav className="flex flex-wrap justify-center md:justify-start space-x-4 md:space-x-8">
          {[
            { id: 'chat-earnings', label: 'Chat Earnings', icon: FaComments },
            { id: 'affiliate-stats', label: 'Affiliate Stats', icon: FaHandshake },
            { id: 'withdraw', label: 'Withdraw', icon: FaMoneyBillWave },
            { id: 'payout-history', label: 'Payout History', icon: FaCalendarAlt }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-2 py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                  activeView === tab.id
                    ? 'bg-rose-500/20 border border-rose-500 text-rose-400'
                    : 'border border-transparent hover:bg-gray-700/50 text-gray-300 hover:text-white'
                }`}
              >
                <Icon />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Earnings Trend Graph */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Earnings Trend</h2>
            <p className="text-gray-400 text-sm">Track your performance over time</p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="3months">Last 3 Months</option>
            </select>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="earnings">Chat Earnings</option>
              <option value="affiliate">Affiliate Commission</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>
        <div className="h-80">
          <Line data={getChartData()} options={chartOptions} />
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeView === 'chat-earnings' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Recent Chat Earnings</h3>
              <p className="text-gray-400 text-sm mt-1">Detailed breakdown of your chat session earnings</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Credits Used</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Earnings</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {chatEarnings.length > 0 ? chatEarnings.map((earning, index) => (
                    <tr key={index} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {format(new Date(earning.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        {earning.customerName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {earning.duration || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {earning.creditsUsed || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                        ${earning.amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {earning.isAffiliate ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <FaUserTie className="mr-1 h-3 w-3" />
                            Affiliate
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Regular
                          </span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                        <FaDollarSign className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                        <p>No chat earnings found</p>
                        <p className="text-sm mt-1">Start chatting with customers to see earnings here</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'affiliate-stats' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Affiliate Performance</h3>
              <p className="text-gray-400 text-sm mt-1">Track earnings from your referred customers</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Credits Used</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Commission Earned</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {affiliateStats.length > 0 ? affiliateStats.map((affiliate, index) => (
                    <tr key={index} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-sm font-medium mr-3">
                            {affiliate.customerName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{affiliate.customerName || 'Unknown'}</div>
                            {affiliate.assignedByAdmin && (
                              <div className="text-xs text-blue-400">Assigned by Admin</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {affiliate.creditsUsed || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                        ${affiliate.commissionEarned?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          affiliate.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {affiliate.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {affiliate.joinedDate ? format(new Date(affiliate.joinedDate), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                        <FaHandshake className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                        <p>No affiliate customers found</p>
                        <p className="text-sm mt-1">Share your affiliate code to start earning commissions</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'withdraw' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Withdrawal Form */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Request Withdrawal</h3>
              
              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <div className="flex items-center">
                  <FaInfoCircle className="text-blue-400 mr-2" />
                  <div className="text-sm text-blue-300">
                    <p>Minimum withdrawal: ${withdrawalSettings.minimumAmount}</p>
                    {withdrawalSettings.nextEligibleDate && (
                      <p>Next eligible: {format(new Date(withdrawalSettings.nextEligibleDate), 'MMM dd, yyyy')}</p>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleWithdrawal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min={withdrawalSettings.minimumAmount}
                      max={summaryStats.withdrawableBalance}
                      value={withdrawalForm.amount}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
                      className="w-full pl-8 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Available: ${summaryStats.withdrawableBalance?.toFixed(2) || '0.00'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={withdrawalForm.paymentMethod}
                    onChange={(e) => setWithdrawalForm({...withdrawalForm, paymentMethod: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!withdrawalForm.amount || parseFloat(withdrawalForm.amount) < withdrawalSettings.minimumAmount}
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Request Withdrawal
                </button>
              </form>
            </div>

            {/* Withdrawal Info */}
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Withdrawal Information</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Last Payment</span>
                    <span className="text-white">
                      {withdrawalSettings.lastPaymentDate 
                        ? format(new Date(withdrawalSettings.lastPaymentDate), 'MMM dd, yyyy')
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Next Eligible Date</span>
                    <span className="text-white">
                      {withdrawalSettings.nextEligibleDate 
                        ? format(new Date(withdrawalSettings.nextEligibleDate), 'MMM dd, yyyy')
                        : 'Anytime'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Minimum Amount</span>
                    <span className="text-white">${withdrawalSettings.minimumAmount}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                <div className="flex items-start">
                  <FaBell className="text-yellow-400 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-300">
                    <p className="font-medium mb-1">Withdrawal Guidelines</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Withdrawals are processed within 3-5 business days</li>
                      <li>• A processing fee may apply depending on the payment method</li>
                      <li>• Ensure your payment details are accurate to avoid delays</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'payout-history' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Payout History</h3>
              <p className="text-gray-400 text-sm mt-1">Track all your withdrawal requests and payments</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Payment Date</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {payoutHistory.length > 0 ? payoutHistory.map((payout, index) => (
                    <tr key={index} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {format(new Date(payout.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        ${payout.amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {payout.method?.replace('_', ' ').toUpperCase() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={payout.status || 'pending'} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                        {payout.transactionId || 'Pending'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                        <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                        <p>No payout history found</p>
                        <p className="text-sm mt-1">Your withdrawal history will appear here</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentEarnings;
