import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaCoins, FaGift, FaCrown, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import config from '../../config/environment';
import './SubscriptionPlans.css';

const SubscriptionPlans = ({ isInDashboard = false, onPurchaseSuccess }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState({
    step: 0,
    total: 3,
    message: 'Initializing...',
    details: 'Setting up coin packages',
    progress: 0
  });
  const [error, setError] = useState(null);
  const [userCoins, setUserCoins] = useState(0);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Helper function to update loading status
  const updateLoadingStatus = (step, message, details) => {
    const progress = Math.round((step / 3) * 100);
    setLoadingStatus({
      step,
      total: 3,
      message,
      details,
      progress
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Step 1: Initialize connection
        updateLoadingStatus(1, 'Connecting to store...', 'Establishing connection to coin packages');
        await new Promise(resolve => setTimeout(resolve, 300));

        // Step 2: Fetch coin packages
        updateLoadingStatus(2, 'Loading coin packages...', 'Retrieving available coin packages and pricing');
        const packagesRes = await axios.get(`${config.API_URL}/subscription/plans`);
        setPackages(packagesRes.data.filter(pkg => pkg.type === 'coin_package'));

        // Step 3: Fetch user balance
        updateLoadingStatus(3, 'Loading your balance...', 'Checking your current coin balance');
        if (user && token) {
          const headers = { Authorization: `Bearer ${token}` };
          const userRes = await axios.get(`${config.API_URL}/subscription/coins/balance`, { headers });
          setUserCoins(userRes.data.balance);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (err) {
        setError('Failed to load coin packages. Please try again later.');
        console.error('Error:', err);
        updateLoadingStatus(0, 'Error loading store', 'Failed to connect. Please refresh the page.');
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
        `${config.API_URL}/subscription/purchase/coins`,
        { packageId },
        { headers }
      );
      
      // Refresh user's coin balance
      const userRes = await axios.get(`${config.API_URL}/subscription/coins/balance`, { headers });
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Floating background shapes matching website */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-rose-50/60 to-pink-100/70"></div>
        <div className="absolute w-96 h-96 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-15 -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-80 h-80 bg-gradient-to-r from-pink-300 to-rose-300 rounded-full mix-blend-multiply filter blur-xl opacity-15 top-1/3 -right-40 animate-pulse"></div>
        <div className="absolute w-64 h-64 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-15 bottom-20 left-1/4 animate-pulse"></div>

        <div className="max-w-md w-full mx-auto relative z-10">
          <div className="glass-effect bg-white/20 backdrop-filter backdrop-blur-20 rounded-3xl shadow-2xl p-8 border border-white/30">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FaCoins className="text-white text-2xl" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-900 via-pink-900 to-red-900 bg-clip-text text-transparent mb-2">Coin Store</h2>
              <p className="text-gray-600">Loading available coin packages...</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span className="font-medium">Progress</span>
                <span className="font-bold text-rose-600">{loadingStatus.progress}%</span>
              </div>
              <div className="w-full bg-gray-200/50 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-rose-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${loadingStatus.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Current Status */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-gray-800 font-semibold">{loadingStatus.message}</span>
              </div>
              <p className="text-gray-600 text-sm ml-6 italic">{loadingStatus.details}</p>
            </div>

            {/* Loading Steps Checklist */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Loading Steps:</h3>
              
              {[
                { step: 1, label: 'Store Connection', description: 'Connecting to coin marketplace', icon: '🛒' },
                { step: 2, label: 'Package Catalog', description: 'Loading available coin packages', icon: '💰' },
                { step: 3, label: 'Account Balance', description: 'Checking your current coins', icon: '💎' }
              ].map(({ step, label, description, icon }) => (
                <div key={step} className="flex items-center gap-4 p-3 rounded-xl bg-white/40 backdrop-filter backdrop-blur-10 border border-white/20">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    loadingStatus.step >= step 
                      ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg scale-110' 
                      : loadingStatus.step === step - 1 
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white animate-pulse shadow-lg' 
                        : 'bg-gray-300 text-gray-600'
                  }`}>
                    {loadingStatus.step > step ? '✓' : icon}
                  </div>
                  <div className={`flex-1 transition-all duration-300 ${loadingStatus.step >= step ? 'text-green-700' : 'text-gray-600'}`}>
                    <div className="font-semibold">{label}</div>
                    <div className="text-xs opacity-75">{description}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading Animation */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-transparent bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"></div>
                <span className="text-sm font-medium">Setting up your coin store...</span>
              </div>
            </div>
          </div>
        </div>
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
