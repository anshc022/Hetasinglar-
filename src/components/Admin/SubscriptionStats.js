import React from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaChartLine, FaDollarSign, FaCrown } from 'react-icons/fa';

const SubscriptionStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-4 bg-blue-500/10">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-300">Active Subscriptions</h3>
              <div className="p-2 rounded-lg bg-blue-500/20">
                <FaUsers className="text-blue-500 text-xl" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-3xl font-bold text-white">{stats.activeSubscriptions}</p>
            <p className="text-sm text-gray-400 mt-1">Current subscribers</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-4 bg-green-500/10">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-300">Total Revenue</h3>
              <div className="p-2 rounded-lg bg-green-500/20">
                <FaDollarSign className="text-green-500 text-xl" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-3xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-gray-400 mt-1">From active subscriptions</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800 rounded-lg shadow-lg overflow-hidden col-span-2"
        >
          <div className="p-4 bg-purple-500/10">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-300">Plan Distribution</h3>
              <div className="p-2 rounded-lg bg-purple-500/20">
                <FaChartLine className="text-purple-500 text-xl" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex gap-4">
              {Object.entries(stats.subscriptionsByPlan).map(([plan, count]) => (
                <div key={plan} className="flex-1">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-sm text-gray-400 capitalize">{plan}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Purchases Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-rose-500/10">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-300">Recent Purchases</h3>
            <div className="p-2 rounded-lg bg-rose-500/20">
              <FaCrown className="text-rose-500 text-xl" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-gray-400 text-sm uppercase bg-gray-900/40">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {stats.recentPurchases.map((purchase) => (
                <tr key={purchase.id} className="border-t border-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{purchase.username}</div>
                      <div className="text-sm text-gray-400">{purchase.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      purchase.plan === 'premium' ? 'bg-purple-500/20 text-purple-300' :
                      purchase.plan === 'gold' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {purchase.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">${purchase.amount}</td>
                  <td className="px-6 py-4">{new Date(purchase.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      purchase.status === 'active' ? 'bg-green-500/20 text-green-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {purchase.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStats;