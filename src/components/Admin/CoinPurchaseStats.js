import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCoins, FaDollarSign, FaUsers, FaGift, FaChartLine, FaCalendar, FaUser, FaTrophy } from 'react-icons/fa';
import { adminAuth } from '../../services/adminApi';

const CoinPurchaseStats = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCoinPurchases();
  }, []);

  const fetchCoinPurchases = async () => {
    try {
      setLoading(true);
      const response = await adminAuth.getCoinPurchases();
      setData(response);
    } catch (err) {
      setError(err.message || 'Failed to fetch coin purchase data');
      console.error('Error fetching coin purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
        <span className="ml-3 text-gray-600">Loading coin purchase data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <button 
          onClick={fetchCoinPurchases}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FaCoins className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No coin purchase data available</p>
      </div>
    );
  }

  const { stats, purchases } = data;

  return (
    <div className="space-y-8">
      {/* Stats Overview - Simple One Line */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <FaCoins className="mr-2" />
          Coin Purchase Statistics
        </h2>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <FaDollarSign className="text-green-500" />
            <span className="text-gray-400">Revenue:</span>
            <span className="text-white font-semibold">{formatCurrency(stats.totalRevenue)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCoins className="text-blue-500" />
            <span className="text-gray-400">Coins Sold:</span>
            <span className="text-white font-semibold">{stats.totalCoinsDistributed.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaChartLine className="text-purple-500" />
            <span className="text-gray-400">Transactions:</span>
            <span className="text-white font-semibold">{stats.totalPurchases.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaUsers className="text-orange-500" />
            <span className="text-gray-400">Buyers:</span>
            <span className="text-white font-semibold">{stats.uniqueBuyers.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaGift className="text-yellow-500" />
            <span className="text-gray-400">Bonus:</span>
            <span className="text-white font-semibold">{stats.totalBonusCoins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaTrophy className="text-pink-500" />
            <span className="text-gray-400">Avg/User:</span>
            <span className="text-white font-semibold">{formatCurrency(stats.averageSpendPerUser)}</span>
          </div>
        </div>
      </div>

      {/* Recent Purchases Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-rose-500/10">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-300 flex items-center">
              <FaCoins className="mr-2" />
              Recent Coin Purchases
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                Showing latest {Math.min(purchases.length, 50)} purchases
              </span>
            </div>
          </div>
        </div>
        
        {purchases.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaCoins className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No coin purchases found</p>
            <p className="text-sm mt-2">Purchases will appear here when users buy coin packages</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-gray-400 text-sm uppercase bg-gray-900/40">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Coins Purchased</th>
                  <th className="px-6 py-3">Bonus Coins</th>
                  <th className="px-6 py-3">Amount Paid</th>
                  <th className="px-6 py-3">Purchase Date</th>
                  <th className="px-6 py-3">Value per Coin</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {purchases.map((purchase) => (
                  <tr key={purchase._id} className="border-t border-gray-700 hover:bg-gray-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold mr-3">
                          {purchase.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white">{purchase.username}</div>
                          <div className="text-sm text-gray-400">{purchase.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaCoins className="text-yellow-500 mr-2" />
                        <span className="font-semibold text-white">{purchase.amount.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {purchase.bonusAmount > 0 ? (
                        <div className="flex items-center">
                          <FaGift className="text-green-500 mr-2" />
                          <span className="text-green-400 font-semibold">+{purchase.bonusAmount.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">No bonus</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-green-400">{formatCurrency(purchase.price)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm">
                        <FaCalendar className="text-gray-400 mr-2" />
                        <span>{formatDate(purchase.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">
                        {purchase.amount > 0 ? formatCurrency(purchase.price / purchase.amount) : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinPurchaseStats;
