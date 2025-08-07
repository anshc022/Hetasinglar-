import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { agentApi, agentAuth } from '../../services/agentApi';
import { format } from 'date-fns';
import { FaArrowLeft, FaComments, FaUserCircle, FaEnvelope, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';

const CustomerProfile = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chats, setChats] = useState([]);
  
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        // Get customer data
        const profileResponse = await agentApi.get('/agents/profile');
        const agent = profileResponse.data;
        
        // Get the customer profile data including chat history
        const customerResponse = await agentApi.get(`/agents/customers/${customerId}`);
        console.log('Customer profile response:', customerResponse);
        
        if (customerResponse.data && customerResponse.data.customer) {
          setCustomer(customerResponse.data.customer);
          setChats(customerResponse.data.chatHistory || []);
        } else {
          throw new Error('Invalid customer data received');
        }
        
      } catch (error) {
        console.error('Error fetching customer data:', error);
        setError('Failed to load customer profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomerData();
  }, [customerId]);

  const handleStartChat = async () => {
    try {
      // Get current agent's profile
      const profileResponse = await agentApi.get('/agents/profile');
      const agent = profileResponse.data;
      
      // First, check if a chat already exists with this customer
      const checkResponse = await agentApi.get(`/agents/customer-chats/${customerId}/${agent._id}`);
      
      if (checkResponse.data && checkResponse.data.chat) {
        // If chat exists, navigate to it
        const escortId = checkResponse.data.escortId;
        const chatId = checkResponse.data.chat._id;
        
        navigate(`/agent/live-queue/${escortId}?chatId=${chatId}`);
        return;
      }
      
      // If no chat exists, create a new one
      const createResponse = await agentApi.post('/agents/create-chat', {
        customerId,
        agentId: agent._id
      });
      
      if (createResponse.data && createResponse.data.chat) {
        const escortId = createResponse.data.escortId;
        const chatId = createResponse.data.chat._id;
        
        navigate(`/agent/live-queue/${escortId}?chatId=${chatId}`);
      } else {
        throw new Error('Failed to create chat - invalid response');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat. Please try again.');
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to the previous page
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white bg-red-600 p-4 rounded-lg">
          <p className="text-lg font-semibold">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-gray-200" 
            onClick={handleGoBack}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Customer not found</h2>
          <p className="text-gray-400">The customer profile you are looking for could not be found.</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" 
            onClick={handleGoBack}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <button 
            onClick={handleGoBack}
            className="mr-4 p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-bold">Customer Profile</h1>
        </div>

        {/* Customer Info Card */}
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg mb-6">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-start">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-2xl font-bold mr-4">
                {(customer.username?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{customer.username || 'Unknown User'}</h2>
                <p className="text-gray-400 flex items-center mt-1">
                  <FaEnvelope className="mr-2" /> 
                  {customer.email || 'No email available'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="text-xs bg-gray-700 px-3 py-1 rounded-full flex items-center">
                    <FaCalendarAlt className="mr-1" /> 
                    Member since: {customer.registrationDate ? format(new Date(customer.registrationDate), 'MMM dd, yyyy') : 'Unknown'}
                  </div>
                  <div className="text-xs bg-gray-700 px-3 py-1 rounded-full flex items-center">
                    <FaInfoCircle className="mr-1" /> 
                    ID: {customer._id}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <span className="block text-gray-400 text-sm">Last Active</span>
                  <span className="block text-lg">
                    {customer.lastActive ? format(new Date(customer.lastActive), 'MMM dd, yyyy HH:mm') : 'Never'}
                  </span>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <span className="block text-gray-400 text-sm">Status</span>
                  <span className="block text-lg">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${customer.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                    {customer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <button 
                onClick={handleStartChat}
                className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center gap-2 text-lg shadow-lg"
              >
                <FaComments />
                <span>Start Chat</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Chat History Section */}
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold">Chat History</h3>
          </div>
          <div className="p-6">
            {chats.length > 0 ? (
              <div className="divide-y divide-gray-700">
                {chats.map(chat => (
                  <div key={chat._id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">Chat with {chat.escortId?.firstName || 'Escort'}</h4>
                        <p className="text-sm text-gray-400">
                          Started: {format(new Date(chat.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <button 
                        onClick={() => navigate(`/agent/live-queue/${chat.escortId._id}?chatId=${chat._id}`)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                      >
                        View Chat
                      </button>
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      Status: <span className="text-yellow-500">{chat.status}</span>
                      {chat.lastActive && (
                        <span className="ml-4">
                          Last activity: {format(new Date(chat.lastActive), 'MMM dd, yyyy HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FaComments className="mx-auto text-5xl mb-4 opacity-30" />
                <p className="text-lg font-medium">No chat history found</p>
                <p className="text-sm mt-2">Start a new chat with this customer</p>
                <button 
                  onClick={handleStartChat}
                  className="mt-4 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-md"
                >
                  Start New Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
