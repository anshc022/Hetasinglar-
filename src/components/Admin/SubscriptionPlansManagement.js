import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaTrash, FaPlus, FaCoins } from 'react-icons/fa';
import { adminAuth } from '../../services/adminApi';

const StatBadge = ({ label, value, color = 'blue' }) => (
  <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-1.5 rounded-lg">
    <span className="text-gray-400 text-sm">{label}:</span>
    <span className={`text-${color}-400 font-semibold`}>{value}</span>
  </div>
);

const PlanCard = ({ plan, onEdit, onDelete }) => (
  <motion.div
    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50 hover:border-rose-500/50 transition-all"
    whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(225, 29, 72, 0.2)" }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-white capitalize">{plan.name}</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-medium flex items-center gap-1">
            <FaCoins size={10} />
            Coins
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-pink-500">
            ${plan.price}
          </span>
          <span className="text-gray-400 text-sm">USD</span>
        </div>
      </div>
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onEdit(plan)}
          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
        >
          <FaEdit />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(plan._id)}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <FaTrash />
        </motion.button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <StatBadge label="Regular Coins" value={plan.coins} color="yellow" />
      <StatBadge label="Bonus Coins" value={`+${plan.bonusCoins}`} color="green" />
      <StatBadge 
        label="Total Value" 
        value={`${plan.coins + plan.bonusCoins} coins`}
        color="rose"
      />
      <StatBadge 
        label="Per Coin" 
        value={`$${(plan.price / (plan.coins + plan.bonusCoins)).toFixed(2)}`}
        color="blue"
      />
    </div>
  </motion.div>
);

const PlanEditModal = ({ plan, onClose, onSave }) => {
  const [formData, setFormData] = useState(plan || {
    name: '',
    type: 'coin_package',
    price: 0,
    coins: 0,
    bonusCoins: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gray-900 rounded-xl p-8 w-full max-w-md shadow-2xl border border-gray-700"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-6">
          {plan ? 'Edit Coin Package' : 'Create New Coin Package'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Package Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="e.g., '50 Coins Package'"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-medium">Price (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full pl-8 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 font-medium">Regular Coins</label>
              <input
                type="number"
                value={formData.coins}
                onChange={(e) => setFormData({ ...formData, coins: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2 font-medium">Bonus Coins</label>
              <input
                type="number"
                value={formData.bonusCoins}
                onChange={(e) => setFormData({ ...formData, bonusCoins: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                min="0"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-700 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg hover:from-rose-600 hover:to-pink-700 transition-colors"
            >
              {plan ? 'Update Package' : 'Create Package'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const SubscriptionPlansManagement = () => {
  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansData = await adminAuth.getSubscriptionPlans();
        // Ensure plansData is an array and filter to only show coin packages
        const plansArray = Array.isArray(plansData) ? plansData : [];
        setPlans(plansArray.filter(plan => plan && plan.type === 'coin_package'));
      } catch (error) {
        console.error('Failed to fetch coin packages:', error);
        setPlans([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleAddPlan = () => {
    setSelectedPlan(null);
    setShowModal(true);
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handleSavePlan = async (planData) => {
    try {
      // Ensure type is always coin_package
      planData.type = 'coin_package';
      
      if (selectedPlan) {
        // Update existing plan
        const updatedPlan = await adminAuth.updateSubscriptionPlan(selectedPlan._id, planData);
        setPlans(plans.map(p => p._id === selectedPlan._id ? updatedPlan : p));
      } else {
        // Create new plan
        const newPlan = await adminAuth.createSubscriptionPlan(planData);
        setPlans([...plans, newPlan]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save coin package:', error);
      alert('Failed to save coin package');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!planId) {
      console.error('No package ID provided for deletion');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this coin package?')) return;
    
    try {
      await adminAuth.deleteSubscriptionPlan(planId);
      setPlans(plans.filter(p => p._id !== planId));
    } catch (error) {
      console.error('Failed to delete coin package:', error);
      alert('Failed to delete coin package');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Coin Packages</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddPlan}
          className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg shadow-lg shadow-rose-500/20"
        >
          <div className="flex items-center gap-2">
            <FaPlus />
            Add New Package
          </div>
        </motion.button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-2xl text-rose-500 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            <div>Loading coin packages...</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              onEdit={handleEditPlan}
              onDelete={handleDeletePlan}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <PlanEditModal
            plan={selectedPlan}
            onClose={() => setShowModal(false)}
            onSave={handleSavePlan}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionPlansManagement;