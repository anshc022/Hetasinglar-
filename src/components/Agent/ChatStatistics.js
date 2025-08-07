import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaDownload, 
  FaChartLine, 
  FaComments, 
  FaDollarSign, 
  FaClock, 
  FaSync, 
  FaEye, 
  FaExclamationTriangle,
  FaCoins,
  FaReceipt,
  FaPercentage
} from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import { agentAuth } from '../../services/agentApi';

const ChatStatistics = ({ agentId }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      
      // Use the passed agentId if available
      if (agentId) {
        params.agentId = agentId;
      }

      const response = await agentAuth.getChatStatistics(params);
      
      // The response has a summary property with the actual statistics
      // and chatDetails at the root level
      const statsData = {
        ...response.summary,
        chatDetails: response.chatDetails,
        period: response.period
      };
      
      setStatistics(statsData);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err.message || 'Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setError('');

      const params = {};
      
      // Use the passed agentId if available
      if (agentId) {
        params.agentId = agentId;
      }

      const response = await agentAuth.exportChatStatistics(params);

      // Get the filename from the response headers
      const contentDisposition = response.headers.get ? 
        response.headers.get('content-disposition') : 
        response.headers['content-disposition'];
      const filename = contentDisposition ? 
        contentDisposition.split('filename=')[1]?.replace(/"/g, '') : 
        `chat-statistics-${new Date().toISOString().split('T')[0]}.csv`;

      // Create blob and download
      const blob = response.data || response;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDuration = (minutes) => {
    const totalMinutes = Math.floor(minutes || 0);
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'PPp');
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FaChartLine className="text-blue-500" />
              Chat Statistics
            </h2>
            <p className="text-gray-400 mt-1">Monitor your chat performance and analytics</p>
            {statistics?.period && (
              <p className="text-sm text-blue-400 mt-1">
                Period: {statistics.period.start} - {statistics.period.end}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStatistics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <FaSync className={`${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              disabled={exporting || !statistics}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <FaDownload />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-6 border-b border-gray-700">
          <div className="bg-red-900/30 text-red-300 p-4 rounded-lg border border-red-700">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <>
          {/* Tab Navigation */}
          <div className="bg-gray-800 rounded-lg mb-6">
            <div className="flex flex-wrap border-b border-gray-700">
              {[
                { id: 'chats', label: 'Chat Details', icon: FaComments },
                { id: 'earnings', label: 'Earnings by Coins', icon: FaDollarSign }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="text-sm" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'chats' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <FaEye className="mr-2" />
                  Chat Details
                </h3>
              </div>

              {statistics.chatDetails && statistics.chatDetails.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-300">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left">Customer</th>
                        <th className="px-4 py-2 text-left">Escort</th>
                        <th className="px-4 py-2 text-left">Start Time</th>
                        <th className="px-4 py-2 text-left">Duration</th>
                        <th className="px-4 py-2 text-left">Sent</th>
                        <th className="px-4 py-2 text-left">Received</th>
                        <th className="px-4 py-2 text-left">Coins Used</th>
                        <th className="px-4 py-2 text-left">Earnings</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {statistics.chatDetails.map((chat, index) => (
                        <tr key={chat.id || chat._id || index} className="hover:bg-gray-700/50">
                          <td className="px-4 py-2">{chat.customer || chat.customerName || 'Unknown'}</td>
                          <td className="px-4 py-2">{chat.escort || chat.escortName || 'Unknown'}</td>
                          <td className="px-4 py-2">{formatDate(chat.createdAt)}</td>
                          <td className="px-4 py-2">{formatDuration(chat.duration || 0)}</td>
                          <td className="px-4 py-2">{chat.messagesSent || 0}</td>
                          <td className="px-4 py-2">{chat.messagesReceived || 0}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1">
                              <FaCoins className="text-yellow-500 text-xs" />
                              {chat.coinsUsed || 0}
                            </div>
                          </td>
                          <td className="px-4 py-2">{formatCurrency(chat.earnings || 0)}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              chat.status === 'assigned' ? 'bg-green-900 text-green-200' :
                              chat.status === 'closed' ? 'bg-gray-900 text-gray-200' :
                              chat.status === 'pushed' ? 'bg-yellow-900 text-yellow-200' :
                              'bg-blue-900 text-blue-200'
                            }`}>
                              {chat.status || 'unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No chat details available for the selected period.</p>
              )}
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FaDollarSign className="text-green-500" />
                    Earnings by Coins Used
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Detailed breakdown showing how customer coin usage translates to your earnings
                  </p>
                </div>
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FaCoins className="text-yellow-500" />
                    <span className="text-blue-300 font-medium">1 Coin = $1.00 customer payment</span>
                  </div>
                </div>
              </div>

              {statistics.earnings && statistics.earnings.length > 0 ? (
                <div className="space-y-6">
                  {/* Coin Value Information */}
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                      <FaCoins className="text-yellow-500" />
                      Coin Value & Commission Breakdown
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Coin Value:</span>
                        <span className="text-yellow-400 font-bold">$1.00 per coin</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Your Commission Rate:</span>
                        <span className="text-green-400 font-bold">
                          {statistics.earnings.length > 0 ? statistics.earnings[0].commissionPercentage : 30}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Earnings per Coin:</span>
                        <span className="text-blue-400 font-bold">
                          ${((statistics.earnings.length > 0 ? statistics.earnings[0].commissionPercentage : 30) / 100).toFixed(2)} per coin
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Earnings Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-gray-300 bg-gray-800 rounded-lg overflow-hidden">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Date & Time</th>
                          <th className="px-4 py-3 text-left font-semibold">Customer</th>
                          <th className="px-4 py-3 text-left font-semibold">
                            <div className="flex items-center gap-1">
                              <FaCoins className="text-yellow-500" />
                              Coins Used
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">Total Amount</th>
                          <th className="px-4 py-3 text-left font-semibold">Your Earnings</th>
                          <th className="px-4 py-3 text-left font-semibold">Commission %</th>
                          <th className="px-4 py-3 text-left font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600">
                        {statistics.earnings.map((earning, index) => (
                          <motion.tr 
                            key={earning._id || index} 
                            className="hover:bg-gray-700/50 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.02 }}
                          >
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-white">
                                {format(new Date(earning.transactionDate), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-xs text-gray-400">
                                {format(new Date(earning.transactionDate), 'HH:mm')}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                                  {(earning.customer || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-white">{earning.customer}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 bg-yellow-900/30 px-3 py-1 rounded-full w-fit">
                                <FaCoins className="text-yellow-500 text-sm" />
                                <span className="font-bold text-yellow-400">{earning.coinsUsed}</span>
                                <span className="text-xs text-gray-300">coins</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-blue-400">
                                {formatCurrency(earning.totalAmount)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {earning.coinsUsed} × $1.00
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-green-400 text-lg">
                                {formatCurrency(earning.commission)}
                              </div>
                              <div className="text-xs text-gray-400">
                                ${(earning.commission / earning.coinsUsed).toFixed(2)} per coin
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 bg-blue-900/30 px-2 py-1 rounded w-fit">
                                <FaPercentage className="text-blue-500 text-xs" />
                                <span className="font-semibold text-blue-400">{earning.commissionPercentage}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                earning.paymentStatus === 'paid' ? 'bg-green-900/30 text-green-300 border-green-700' :
                                earning.paymentStatus === 'processed' ? 'bg-blue-900/30 text-blue-300 border-blue-700' :
                                earning.paymentStatus === 'pending' ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700' :
                                'bg-gray-900/30 text-gray-300 border-gray-700'
                              }`}>
                                {earning.paymentStatus.charAt(0).toUpperCase() + earning.paymentStatus.slice(1)}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Enhanced Earnings Summary */}
                  <div className="mt-6 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FaChartLine className="text-blue-500" />
                      Earnings Summary & Analytics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-gray-400 text-xs uppercase mb-1">Total Transactions</div>
                        <div className="text-2xl font-bold text-white">{statistics.earnings.length}</div>
                        <div className="text-xs text-gray-500">earning records</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-xs uppercase mb-1">Total Coins Used</div>
                        <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-2">
                          <FaCoins className="text-lg" />
                          {statistics.earnings.reduce((sum, e) => sum + e.coinsUsed, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">by customers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-xs uppercase mb-1">Customer Spending</div>
                        <div className="text-2xl font-bold text-blue-400">
                          {formatCurrency(statistics.earnings.reduce((sum, e) => sum + e.totalAmount, 0))}
                        </div>
                        <div className="text-xs text-gray-500">total customer payments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-xs uppercase mb-1">Your Total Earnings</div>
                        <div className="text-2xl font-bold text-green-400">
                          {formatCurrency(statistics.earnings.reduce((sum, e) => sum + e.commission, 0))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {statistics.earnings.length > 0 ? statistics.earnings[0].commissionPercentage : 30}% commission
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Analytics */}
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Average per Transaction</h5>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Coins:</span>
                            <span className="text-yellow-400 font-semibold">
                              {statistics.earnings.length > 0 
                                ? (statistics.earnings.reduce((sum, e) => sum + e.coinsUsed, 0) / statistics.earnings.length).toFixed(1)
                                : 0} per transaction
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Earnings:</span>
                            <span className="text-green-400 font-semibold">
                              {statistics.earnings.length > 0 
                                ? formatCurrency(statistics.earnings.reduce((sum, e) => sum + e.commission, 0) / statistics.earnings.length)
                                : '$0.00'} per transaction
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Earnings Rate</h5>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Per Coin:</span>
                            <span className="text-blue-400 font-semibold">
                              {statistics.earnings.length > 0 && statistics.earnings.reduce((sum, e) => sum + e.coinsUsed, 0) > 0
                                ? formatCurrency(statistics.earnings.reduce((sum, e) => sum + e.commission, 0) / statistics.earnings.reduce((sum, e) => sum + e.coinsUsed, 0))
                                : '$0.00'} per coin
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Commission Rate:</span>
                            <span className="text-purple-400 font-semibold">
                              {statistics.earnings.length > 0 ? statistics.earnings[0].commissionPercentage : 30}% of customer payment
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Payment Status</h5>
                          <div className="space-y-1">
                            {['paid', 'pending', 'processed'].map(status => {
                              const count = statistics.earnings.filter(e => e.paymentStatus === status).length;
                              const percentage = statistics.earnings.length > 0 ? (count / statistics.earnings.length * 100).toFixed(1) : 0;
                              return (
                                <div key={status} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-400 capitalize">{status}:</span>
                                  <span className={`font-semibold ${
                                    status === 'paid' ? 'text-green-400' :
                                    status === 'pending' ? 'text-yellow-400' :
                                    'text-blue-400'
                                  }`}>
                                    {count} ({percentage}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaDollarSign className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">No earnings data available</p>
                  <p className="text-gray-500 text-sm">Start chatting with customers to earn commissions</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!statistics && !loading && (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <FaChartLine className="text-gray-600 text-4xl mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No statistics available for the selected period.</p>
          <p className="text-gray-500 text-sm mt-2">Please try selecting a different date range.</p>
        </div>
      )}
    </div>
  );
};

export default ChatStatistics;
