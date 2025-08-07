import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaCoins, FaGift, FaCrown, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './SubscriptionPlans.css';

const SubscriptionPlans = ({ isInDashboard = false, onPurchaseSuccess }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCoins, setUserCoins] = useState(0);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch coin packages
        const packagesRes = await axios.get('http://localhost:5000/api/subscription/plans');
        setPackages(packagesRes.data.filter(pkg => pkg.type === 'coin_package'));

        // Fetch user's coin balance if logged in
        if (user && token) {
          const headers = { Authorization: `Bearer ${token}` };
          const userRes = await axios.get('http://localhost:5000/api/subscription/coins/balance', { headers });
          setUserCoins(userRes.data.balance);
        }
      } catch (err) {
        setError('Failed to load coin packages. Please try again later.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  const handlePurchase = async (packageId) => {
    if (!user || !token) {
      if (isInDashboard) {
        alert('Please log in to purchase coins.');
        return;
      }
      navigate('/login', { state: { from: '/subscription-plans' } });
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(
        'http://localhost:5000/api/subscription/purchase/coins',
        { packageId },
        { headers }
      );
      
      // Refresh user's coin balance
      const userRes = await axios.get('http://localhost:5000/api/subscription/coins/balance', { headers });
      setUserCoins(userRes.data.balance);
      
      // Call success callback if provided (for dashboard context)
      if (onPurchaseSuccess) {
        onPurchaseSuccess(userRes.data.balance);
      }
      
      alert(`Coins purchased successfully! You received ${response.data.purchased} coins.`);
    } catch (err) {
      console.error('Purchase error:', err.response || err);
      const errorMessage = err.response?.data?.message || 'Failed to purchase coins. Please try again.';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading coin packages...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      {user && (
        <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold mb-2">Your Coin Balance</h3>
              <div className="flex items-center gap-3">
                <FaCoins className="text-yellow-300 text-2xl" />
                <span className="text-3xl font-bold">{userCoins}</span>
                <span className="text-lg opacity-80">coins</span>
              </div>
            </div>
            <div className="text-sm opacity-80">
              <p>1 coin = 1 message</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Coin Package</h2>
        <p className="text-xl text-gray-600">Get coins to send messages and connect with others</p>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packages.map((pkg, index) => {
          const isPopular = pkg.coins >= 30 && pkg.coins <= 50;
          const gradientColor = index === 0 ? 'from-blue-400 to-blue-600' 
            : index === 1 ? 'from-purple-400 to-purple-600' 
            : 'from-pink-400 to-pink-600';

          return (
            <motion.div
              key={pkg._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${
                isPopular ? 'ring-2 ring-purple-500 transform scale-105' : ''
              }`}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-bl-xl text-sm font-medium">
                  Most Popular
                </div>
              )}

              {/* Package Header */}
              <div className={`bg-gradient-to-r ${gradientColor} p-6 text-white`}>
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">${pkg.price.toFixed(2)}</span>
                  <span className="ml-2 text-white/80">USD</span>
                </div>
              </div>

              {/* Package Content */}
              <div className="p-6 space-y-6">
                {/* Coin Display */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FaCoins className="text-yellow-500 text-2xl" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{pkg.coins}</p>
                      <p className="text-sm text-gray-600">Regular Coins</p>
                    </div>
                  </div>
                  {pkg.bonusCoins > 0 && (
                    <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      <FaGift />
                      <span className="font-medium">+{pkg.bonusCoins}</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FaCrown className="text-yellow-500" />
                    <span className="text-gray-700">Total {pkg.coins + pkg.bonusCoins} coins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCoins className="text-blue-500" />
                    <span className="text-gray-700">
                      ${(pkg.price / pkg.coins).toFixed(3)} per coin
                    </span>
                  </div>
                  {pkg.bonusCoins > 0 && (
                    <div className="flex items-center gap-2 text-green-600">
                      <FaGift />
                      <span>{pkg.bonusCoins} bonus coins free!</span>
                    </div>
                  )}
                </div>

                {/* Call to Action */}
                <button
                  onClick={() => handlePurchase(pkg._id)}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all transform hover:scale-105
                    ${isPopular 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-200' 
                      : 'bg-gradient-to-r from-gray-700 to-gray-900'
                    }`}
                >
                  Buy Now
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-center text-gray-600">
        <p>1 coin = 1 message • No expiration • Instant delivery</p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
