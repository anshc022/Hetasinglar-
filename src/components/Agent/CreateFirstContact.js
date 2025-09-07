import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, 
  FaUserPlus, 
  FaSearch, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaBell,
  FaClock,
  FaEye,
  FaTimes
} from 'react-icons/fa';
import agentApi, { agentAuth } from '../../services/agentApi';
import { useNavigate } from 'react-router-dom';

const CreateFirstContact = ({ onClose, onSuccess }) => {
  const navigate = useNavigate();
  
  // State for form data
  const [selectedEscort, setSelectedEscort] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  
  // State for data
  const [escorts, setEscorts] = useState([]);
  const [newCustomers, setNewCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [recentContacts, setRecentContacts] = useState([]);
  
  // State for UI
  const [loading, setLoading] = useState(false);
  const [escortSearch, setEscortSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerViewMode, setCustomerViewMode] = useState('new'); // 'new' or 'all'
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showRecentContacts, setShowRecentContacts] = useState(false);
  const [showNewCustomerNotification, setShowNewCustomerNotification] = useState(true);
  
  // Load initial data
  useEffect(() => {
    loadInitialData();
    // Set up periodic refresh of customers list
    const refreshInterval = setInterval(() => {
      loadNewCustomers();
    }, 30000); // Check for new customers every 30 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  // Add keyboard support for closing modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  // Load escorts when domain or customer selection changes
  useEffect(() => {
    loadEscorts();
  }, [escortSearch]);
  
  // Load all customers when view mode is 'all' or search changes
  useEffect(() => {
    if (customerViewMode === 'all') {
      loadAllCustomers();
    }
  }, [customerViewMode, customerSearch]);
  
  // Auto-select newest customer if none selected and new customers arrive
  useEffect(() => {
    if (!selectedCustomer && newCustomers.length > 0 && showNewCustomerNotification) {
      setSelectedCustomer(newCustomers[0]._id);
    }
  }, [newCustomers]);

  const loadInitialData = async () => {
    try {
      const [customersRes, contactsRes] = await Promise.all([
        agentAuth.getNewCustomers({ hours: 48 }),
        agentAuth.getRecentContacts({ limit: 5 })
      ]);
      
      setNewCustomers(customersRes.newCustomers);
      setRecentContacts(contactsRes.recentContacts);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setMessage({ type: 'error', text: 'Failed to load data. Please refresh the page.' });
    }
  };

  const loadEscorts = async () => {
    try {
      const params = {};
      if (escortSearch) {
        params.search = escortSearch;
      }
      
      const response = await agentAuth.getAvailableEscorts(params);
      setEscorts(response.escorts);
    } catch (error) {
      console.error('Error loading escorts:', error);
    }
  };

  const loadNewCustomers = async () => {
    try {
      // Always get new customers from all agents, regardless of domain selection
      const params = { hours: 48 };
      
      const response = await agentAuth.getNewCustomers(params);
      setNewCustomers(response.newCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadAllCustomers = async () => {
    try {
      const params = { limit: 100 }; // Get more customers for selection
      if (customerSearch) {
        params.search = customerSearch;
      }
      
      const response = await agentAuth.getAllCustomers(params);
      setAllCustomers(response.customers);
    } catch (error) {
      console.error('Error loading all customers:', error);
    }
  };

  const handleCreateContact = async () => {
    if (!selectedCustomer || !selectedEscort) {
      setMessage({ type: 'error', text: 'Please select both a customer and an escort.' });
      return;
    }

    setLoading(true);
    try {
      const contactData = {
        customerId: selectedCustomer,
        escortId: selectedEscort,
        initialMessage: initialMessage.trim() || undefined
      };

      const response = await agentAuth.createFirstContact(contactData);
      
      setMessage({ type: 'success', text: response.message });
      
      // Reset form
      setSelectedCustomer('');
      setSelectedEscort('');
      setInitialMessage('');
      
      // Immediately call success callback to refresh dashboard
      if (onSuccess) {
        onSuccess();
      }
      
      // Refresh data
      loadNewCustomers();
      const contactsRes = await agentAuth.getRecentContacts({ limit: 5 });
      setRecentContacts(contactsRes.recentContacts);
      
      // Navigate to chat after successful creation or close modal after delay
      if (response.chat?._id) {
        setTimeout(() => {
          onClose(); // Close modal first
          navigate(`/agent/live-queue/${response.chat.escortId._id}?chatId=${response.chat._id}&newContact=true`);
          // Call success callback to refresh dashboard immediately
          if (onSuccess) {
            onSuccess();
          }
        }, 1500);
      } else {
        setTimeout(() => {
          onClose(); // Close modal
          // Call success callback to refresh dashboard instead of full page reload
          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating first contact:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to create first contact. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCustomerData = () => {
    const currentCustomers = customerViewMode === 'new' ? newCustomers : allCustomers;
    return currentCustomers.find(customer => customer._id === selectedCustomer);
  };

  const getSelectedEscortData = () => {
    return escorts.find(escort => escort._id === selectedEscort);
  };

  const filteredCustomers = (() => {
    const currentCustomers = customerViewMode === 'new' ? newCustomers : allCustomers;
    return currentCustomers.filter(customer =>
      !customerSearch || 
      customer.username.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearch.toLowerCase())
    );
  })();

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Slide-in Sidebar */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
        className="fixed right-0 top-0 h-full w-full sm:w-11/12 md:w-4/5 lg:w-3/5 xl:w-1/2 2xl:w-2/5 bg-gray-900 shadow-2xl border-l border-gray-700 z-50 overflow-y-auto"
      >
        {/* Sidebar Header */}
        <div className="sticky top-0 bg-gray-900 px-6 py-4 border-b border-gray-700 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaUserPlus /> Create First Contact
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Connect new customers with escort profiles
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
            title="Close Sidebar"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="p-6 space-y-6">
          {/* New Customer Alert */}
          {newCustomers.length > 0 && showNewCustomerNotification && (
            <div className="bg-gray-700/50 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <FaBell className="text-blue-400" />
                </div>
                <div>
                  <div className="text-white">
                    <strong>{newCustomers.length}</strong> new customers available
                  </div>
                  <div className="text-sm text-gray-400">
                    Latest: {formatTimeAgo(newCustomers[0].createdAt)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowNewCustomerNotification(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50"
                title="Dismiss"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {/* Message Display */}
          {message.text && (
            <div className={`rounded-lg p-4 flex items-center ${
              message.type === 'success' 
                ? 'bg-green-900/20 text-green-400' 
                : 'bg-red-900/20 text-red-400'
            }`}>
              <div className={`p-2 rounded-lg mr-3 ${
                message.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
              </div>
              {message.text}
            </div>
          )}

          {/* Create Contact Form */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 pb-3 border-b border-gray-700">
              <FaUsers />
              Assignment Details
            </h3>
          
          <div className="space-y-4">
            {/* Escort Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Escort Profile
              </label>
              <div className="relative mb-2">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search escorts..."
                  value={escortSearch}
                  onChange={(e) => setEscortSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <select
                  value={selectedEscort}
                  onChange={(e) => setSelectedEscort(e.target.value)}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Choose an escort...</option>
                  {escorts.map(escort => (
                    <option key={escort._id} value={escort._id}>
                      {escort.firstName} {escort.lastName} ({escort.stageName}) - {escort.profession}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Select Customer
                </label>
                <div className="flex bg-gray-700 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerViewMode('new');
                      setSelectedCustomer(''); // Reset selection when switching modes
                      setCustomerSearch(''); // Reset search
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      customerViewMode === 'new'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-300 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    New Customers
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerViewMode('all');
                      setSelectedCustomer(''); // Reset selection when switching modes
                      setCustomerSearch(''); // Reset search
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      customerViewMode === 'all'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-300 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    All Customers
                  </button>
                </div>
              </div>
              <div className="relative mb-2">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="max-h-40 overflow-y-auto scrollbar-hide bg-gray-700 rounded-lg border border-gray-600">
                {filteredCustomers.length === 0 ? (
                  <div className="p-3 text-gray-400 text-center">
                    {customerViewMode === 'new' ? 'No new customers found' : 'No customers found'}
                    {customerSearch && (
                      <div className="text-sm mt-1">Try different search terms</div>
                    )}
                  </div>
                ) : (
                  filteredCustomers.map(customer => (
                    <div
                      key={customer._id}
                      onClick={() => setSelectedCustomer(customer._id)}
                      className={`p-3 cursor-pointer border-b border-gray-600 last:border-b-0 hover:bg-gray-600 ${
                        selectedCustomer === customer._id ? 'bg-blue-600/20 border-blue-500/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-white font-medium flex items-center gap-2">
                            {customer.username}
                            {(new Date() - new Date(customer.createdAt)) / (1000 * 60 * 60) <= 1 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="text-gray-300 text-sm">{customer.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-400 text-xs flex items-center">
                            <FaClock className="mr-1" />
                            {formatTimeAgo(customer.createdAt)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {customer.registrationDomain || 'Direct'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Initial Message */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Initial Message (Optional)
              </label>
              <textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Enter a welcome message from the escort..."
                rows="3"
                className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none placeholder-gray-400"
              />
              <div className="text-gray-400 text-xs mt-1">
                If provided, this message will be sent as the first message from the escort
              </div>
            </div>

            {/* Selected Contact Preview */}
            {(selectedCustomer && selectedEscort) && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Contact Preview</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <div><span className="text-gray-400">Customer:</span> {getSelectedCustomerData()?.username}</div>
                  <div><span className="text-gray-400">Escort:</span> {getSelectedEscortData()?.firstName} {getSelectedEscortData()?.lastName}</div>
                </div>
              </div>
            )}

            {/* Create Contact Button */}
            <button
              onClick={handleCreateContact}
              disabled={loading || !selectedCustomer || !selectedEscort}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <FaUserPlus className="mr-2" />
              )}
              {loading ? 'Creating Contact...' : 'Create First Contact'}
            </button>
          </div>
        </div>

        {/* Recent Contacts */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaClock />
              Recent Assignments
            </h3>
            <button
              onClick={() => setShowRecentContacts(!showRecentContacts)}
              className="text-blue-600 hover:text-blue-700 flex items-center text-sm px-3 py-1 rounded border border-blue-200 hover:border-blue-300 transition-colors"
            >
              <FaEye className="mr-1" />
              {showRecentContacts ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {recentContacts.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              No recent contacts created
            </div>
          ) : (
            <div className="divide-y divide-gray-700 max-h-[500px] overflow-y-auto scrollbar-hide">
              {recentContacts.map(contact => (
                <div
                  key={contact._id}
                  className="py-3 flex items-center justify-between hover:bg-gray-700/50 rounded-lg px-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-white font-medium flex items-center gap-2 truncate">
                        {contact.customerId?.username}
                        {(new Date() - new Date(contact.customerId?.createdAt)) / (1000 * 60 * 60) <= 24 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 whitespace-nowrap">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500 shrink-0">→</span>
                      <span className="text-gray-300 truncate">{contact.escortId?.firstName} {contact.escortId?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="text-gray-400 text-xs flex items-center gap-1">
                        <FaClock className="text-gray-500" />
                        {formatTimeAgo(contact.createdAt)}
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-xs whitespace-nowrap
                        ${contact.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                          contact.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-gray-600 text-gray-300'}`}>
                        {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {contact.messages?.length || 0} messages
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/agent/live-queue/${contact.escortId?._id}?chatId=${contact._id}`)}
                      className="ml-4 shrink-0 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all duration-200"
                    >
                      <FaEye size={14} />
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </motion.div>
    </>
  );
};

export default CreateFirstContact;
