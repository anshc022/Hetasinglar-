import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  FaComments, 
  FaEye, 
  FaSearch 
} from 'react-icons/fa';
import { agentAuth, agentApi } from '../../services/agentApi';

const AssignedCustomersTab = ({ agentId, navigate }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAssignedCustomers = async () => {
      try {
        setLoading(true);
        console.log('Fetching assigned customers for agent ID:', agentId);
        const response = await agentAuth.getAssignedCustomers(agentId);
        console.log('Assigned customers response:', response);
        
        if (response && Array.isArray(response.customers)) {
          setCustomers(response.customers);
          console.log(`Found ${response.customers.length} customers`);
        } else {
          console.error('Invalid response format:', response);
          setCustomers([]);
        }
      } catch (error) {
        console.error('Error fetching assigned customers:', error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      fetchAssignedCustomers();
    } else {
      console.log('No agent ID provided to fetch customers');
    }
  }, [agentId]);

  const filteredCustomers = customers.filter(customer => 
    customer.customerId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartChat = async (customerId) => {
    try {
      // Create a new chat or get existing chat with this customer
      console.log('Starting chat with customer ID:', customerId);
      
      // First, check if a chat already exists with this customer
      const checkResponse = await agentApi.get(`/agents/customer-chats/${customerId}/${agentId}`);
      console.log('Customer chat check response:', checkResponse);
      
      if (checkResponse.data && checkResponse.data.chat) {
        // If chat exists, navigate to it
        const escortId = checkResponse.data.escortId;
        const chatId = checkResponse.data.chat._id;
        
        console.log('Navigating to existing chat:', { escortId, chatId });
        navigate(`/agent/live-queue/${escortId}?chatId=${chatId}`);
        return;
      }
      
      // If no chat exists, create a new one
      console.log('No existing chat found. Creating new chat...');
      const createResponse = await agentApi.post('/agents/create-chat', {
        customerId,
        agentId
      });
      
      console.log('Create chat response:', createResponse);
      
      if (createResponse.data && createResponse.data.chat) {
        const escortId = createResponse.data.escortId;
        const chatId = createResponse.data.chat._id;
        
        console.log('New chat created. Navigating to:', { escortId, chatId });
        navigate(`/agent/live-queue/${escortId}?chatId=${chatId}`);
      } else {
        throw new Error('Failed to create chat - invalid response');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat. Please try again.');
    }
  };

  const handleViewProfile = (customerId) => {
    // Navigate to the customer profile page
    navigate(`/agent/customers/${customerId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">My Assigned Customers</h2>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        {customers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-lg font-medium">No assigned customers found</p>
            <p className="text-sm mt-2">You don't have any customers assigned to you yet</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-lg font-medium">No customers match your search</p>
            <p className="text-sm mt-2">Try a different search term</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-4">
              {filteredCustomers.map((customer) => (
                <div key={customer._id || customer.customerId?._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  {/* Header with avatar and basic info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white font-bold text-lg">
                        {(customer.customerId?.username?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-base truncate">{customer.customerId?.username || 'Unknown'}</h3>
                        <p className="text-gray-400 text-sm truncate">{customer.customerId?.email || 'No email'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 
                      ${customer.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {/* Customer Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Registration</div>
                      <div className="text-sm text-white font-medium">
                        {customer.registrationDate ? format(new Date(customer.registrationDate), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Last Activity</div>
                      <div className="text-sm text-white font-medium">
                        {customer.lastActivity ? formatDistanceToNow(new Date(customer.lastActivity), { addSuffix: true }) : 'Never'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartChat(customer.customerId?._id)}
                      className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FaComments className="text-sm" />
                      <span>Start Chat</span>
                    </button>
                    <button
                      onClick={() => handleViewProfile(customer.customerId?._id)}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FaEye className="text-sm" />
                      <span>View Profile</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Registration Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer._id || customer.customerId?._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white font-bold">
                            {(customer.customerId?.username?.[0] || 'U').toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{customer.customerId?.username || 'Unknown'}</div>
                            <div className="text-sm text-gray-400">{customer.customerId?.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {customer.registrationDate ? format(new Date(customer.registrationDate), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {customer.lastActivity ? formatDistanceToNow(new Date(customer.lastActivity), { addSuffix: true }) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${customer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStartChat(customer.customerId?._id)}
                            className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md flex items-center gap-1"
                          >
                            <FaComments className="text-xs" />
                            <span>Chat</span>
                          </button>
                          <button
                            onClick={() => handleViewProfile(customer.customerId?._id)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center gap-1"
                          >
                            <FaEye className="text-xs" />
                            <span>Profile</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssignedCustomersTab;
