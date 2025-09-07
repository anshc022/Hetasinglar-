import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import ChatBox from './ChatBox';
import EscortQueueView from './EscortQueueView';

const LiveQueueChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { escortId } = useParams();
  const searchParams = new URLSearchParams(location.search);
  const chatId = searchParams.get('chatId');
  const queueString = searchParams.get('queue');
  const currentIndex = parseInt(searchParams.get('index') || '0');
  const isFollowUp = searchParams.get('followUp') === 'true';

  const [queue, setQueue] = useState([]);
  const [redirectDelay] = useState(3000);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  console.log('LiveQueueChat rendered with:', { chatId, currentIndex, queueString, escortId });

  useEffect(() => {
    if (queueString) {
      try {
        const decodedQueue = JSON.parse(decodeURIComponent(queueString));
        setQueue(decodedQueue);
        console.log('Queue loaded:', decodedQueue);
      } catch (error) {
        console.error('Error parsing queue:', error);
      }
    }
  }, [queueString]);

  const handleNext = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      const nextChatId = queue[currentIndex + 1];
      console.log('Navigating to next chat:', nextChatId, 'at index:', currentIndex + 1);
      
      // Create a more robust URL that includes the current queue
      const nextUrl = `/agent/live-queue/${escortId}?chatId=${nextChatId}&queue=${queueString}&index=${currentIndex + 1}`;
      console.log('Next URL:', nextUrl);
      
      navigate(nextUrl);
    } else {
      console.log('Reached end of queue, returning to dashboard');
      navigate('/agent/dashboard');
    }
  }, [currentIndex, queue, navigate, queueString, escortId]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevChatId = queue[currentIndex - 1];
      navigate(`/agent/live-queue/${escortId}?chatId=${prevChatId}&queue=${queueString}&index=${currentIndex - 1}`);
    }
  };

  // Handle message sent and auto-redirect
  const onMessageSent = useCallback((message) => {
    console.log('🚀 onMessageSent callback triggered!', { 
      message, 
      currentIndex, 
      queueLength: queue.length,
      chatId,
      escortId,
      redirectDelay 
    });
    
    // Auto-redirect to next chat after delay
    if (currentIndex < queue.length - 1) {
      console.log('🔄 Starting auto-redirect countdown...');
      setIsRedirecting(true);
      setCountdown(Math.ceil(redirectDelay / 1000));
      
      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          const newValue = prev - 1;
          console.log('⏱️ Countdown:', newValue);
          if (newValue <= 0) {
            clearInterval(countdownInterval);
            return 0;
          }
          return newValue;
        });
      }, 1000);
      
      setTimeout(() => {
        console.log('🎯 Countdown finished, redirecting to next chat...');
        setIsRedirecting(false);
        setCountdown(0);
        handleNext();
      }, redirectDelay);
    } else {
      console.log('🏁 Last chat in queue, showing completion message');
      // Show completion message
      setIsRedirecting(true);
      setCountdown(0);
      setTimeout(() => {
        console.log('🏠 Queue completed, returning to dashboard...');
        setIsRedirecting(false);
        // Return to dashboard after completing the queue
        navigate('/agent/dashboard');
      }, 2000); // Show completion message for 2 seconds
    }
  }, [currentIndex, queue.length, redirectDelay, handleNext, navigate]);

  // If no chatId is provided, show the professional escort queue view
  if (!chatId) {
    return <EscortQueueView />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Professional Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/agent/dashboard')}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="bg-gray-700 rounded-lg px-4 py-2">
                  <span className="text-sm text-gray-300">
                    Chat <span className="font-medium text-white">{currentIndex + 1}</span> of{' '}
                    <span className="font-medium text-white">{queue.length}</span>
                  </span>
                  {currentIndex === queue.length - 1 && queue.length > 0 && (
                    <span className="ml-2 text-yellow-400 text-sm font-medium">
                      (Last in queue)
                    </span>
                  )}
                </div>
                
                {/* Debug info - remove in production */}
                {(isRedirecting || countdown > 0) && (
                  <div className="bg-green-900 text-green-200 rounded-lg px-3 py-1 text-sm">
                    Debug: redirecting={isRedirecting.toString()}, countdown={countdown}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`p-2 rounded-lg transition-colors ${
                    currentIndex === 0 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <FaArrowLeft />
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={currentIndex === queue.length - 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentIndex === queue.length - 1
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="py-4">
        <div className="relative bg-gray-800 overflow-hidden">
          {/* Enhanced Auto-redirect notification overlay */}
          {isRedirecting && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full text-center transform transition-all duration-300 ${
                countdown > 0 ? 'border-4 border-blue-500 scale-100' : 'border-4 border-green-500 scale-105'
              }`}>
                {countdown > 0 ? (
                  <>
                    <div className="mb-6">
                      <div className="relative inline-flex items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-blue-600">{countdown}</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Moving to next chat in{' '}
                      <span className="font-bold text-blue-600">{countdown} second{countdown !== 1 ? 's' : ''}</span>
                    </p>
                    <div className="text-sm text-gray-500">
                      Chat {currentIndex + 1} of {queue.length} completed
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <div className="rounded-full h-16 w-16 bg-green-500 flex items-center justify-center mx-auto">
                        <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Queue Completed!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      All chats processed successfully
                    </p>
                    <div className="text-sm text-gray-500">
                      Returning to dashboard...
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          <ChatBox 
            onMessageSent={onMessageSent}
            isFollowUp={isFollowUp}
            key={chatId} // Important: Force re-render when chat changes
          />
        </div>
      </div>
    </div>
  );
};

export default LiveQueueChat;
