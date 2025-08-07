import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaTimes, FaMagic, FaEdit, FaCheck } from 'react-icons/fa';

const FirstContactButton = ({ 
  onSendFirstContact, 
  isLoading = false, 
  disabled = false,
  customerName = "Customer",
  escortName = "Escort"
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Pre-defined first contact message templates
  const messageTemplates = [
    {
      id: 'welcome',
      title: 'Welcome Message',
      message: `Hello! 👋 Welcome to our platform! I'm here to help you connect with ${escortName}. Feel free to ask any questions or let me know how I can assist you today!`
    },
    {
      id: 'greeting',
      title: 'Friendly Greeting',
      message: `Hi there! 😊 Thanks for your interest in ${escortName}. I'm your personal assistant and I'm here to make sure you have the best experience possible. What would you like to know?`
    },
    {
      id: 'professional',
      title: 'Professional Introduction',
      message: `Good day! I'm reaching out to assist you with your inquiry regarding ${escortName}. I'm here to answer any questions you may have and help facilitate your connection. How may I help you today?`
    },
    {
      id: 'casual',
      title: 'Casual & Fun',
      message: `Hey! 🌟 I see you're interested in chatting with ${escortName}. I'm here to help make that happen! What's on your mind? Feel free to ask me anything!`
    },
    {
      id: 'helpful',
      title: 'Helpful Assistant',
      message: `Hello! I'm your dedicated assistant for connecting with ${escortName}. I'm here to answer questions, provide information, and ensure you have everything you need. What can I help you with?`
    },
    {
      id: 'personalized',
      title: 'Personalized Touch',
      message: `Hi ${customerName}! 💫 Welcome! I noticed you're interested in ${escortName} and I'd love to help you get to know each other better. Is there anything specific you'd like to know or discuss?`
    }
  ];

  const handleSendMessage = async () => {
    let messageToSend = '';
    
    if (isCustomMode) {
      if (!customMessage.trim()) {
        alert('Please enter a custom message');
        return;
      }
      messageToSend = customMessage.trim();
    } else {
      if (!selectedTemplate) {
        alert('Please select a message template');
        return;
      }
      const template = messageTemplates.find(t => t.id === selectedTemplate);
      messageToSend = template.message;
    }

    try {
      await onSendFirstContact(messageToSend);
      setShowModal(false);
      setSelectedTemplate('');
      setCustomMessage('');
      setIsCustomMode(false);
    } catch (error) {
      console.error('Failed to send first contact:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedTemplate('');
    setCustomMessage('');
    setIsCustomMode(false);
  };

  const getPreviewMessage = () => {
    if (isCustomMode) {
      return customMessage;
    }
    if (selectedTemplate) {
      const template = messageTemplates.find(t => t.id === selectedTemplate);
      return template?.message || '';
    }
    return '';
  };

  return (
    <>
      {/* Main Button */}
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled || isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        title="Send first contact message"
      >
        <FaPlay className="w-4 h-4" />
        <span>First Contact</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <div>                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FaMagic className="text-green-400" />
                    First Contact Message
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Send an automated welcome message to {customerName}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsCustomMode(false)}
                    className={`flex-1 p-3 rounded-lg border transition-colors ${
                      !isCustomMode
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}                  >
                    <FaMagic className="inline mr-2" />
                    Use Template
                  </button>
                  <button
                    onClick={() => setIsCustomMode(true)}
                    className={`flex-1 p-3 rounded-lg border transition-colors ${
                      isCustomMode
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <FaEdit className="inline mr-2" />
                    Custom Message
                  </button>
                </div>

                {/* Template Selection */}
                {!isCustomMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Choose a message template
                    </label>
                    <div className="space-y-2">
                      {messageTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`w-full p-4 text-left rounded-lg border transition-colors ${
                            selectedTemplate === template.id
                              ? 'bg-green-600/20 border-green-500 text-white'
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{template.title}</h4>
                              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                {template.message.substring(0, 100)}...
                              </p>
                            </div>
                            {selectedTemplate === template.id && (
                              <FaCheck className="text-green-400 ml-2" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Message Input */}
                {isCustomMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Write your custom message
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder={`Write a personalized first contact message for ${customerName}...`}
                      className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      maxLength={500}
                    />
                    <div className="text-right text-xs text-gray-400 mt-1">
                      {customMessage.length}/500 characters
                    </div>
                  </div>
                )}

                {/* Message Preview */}
                {getPreviewMessage() && (
                  <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message Preview
                    </label>
                    <div className="bg-gray-900/50 p-3 rounded border-l-4 border-green-500">
                      <p className="text-white whitespace-pre-wrap">
                        {getPreviewMessage()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    💡 First contact messages help break the ice and make customers feel welcomed. 
                    They will appear as coming from you as the agent.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={
                    isLoading || 
                    (!isCustomMode && !selectedTemplate) || 
                    (isCustomMode && !customMessage.trim())
                  }
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPlay className="w-4 h-4" />
                      Send First Contact
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FirstContactButton;
