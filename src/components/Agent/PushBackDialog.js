import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaClock, FaCalendarAlt } from 'react-icons/fa';

const PushBackDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  customerName = "Customer",
  isLoading = false 
}) => {
  const [selectedTime, setSelectedTime] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [customUnit, setCustomUnit] = useState('hours');
  const [reason, setReason] = useState('');

  // Predefined time options
  const timeOptions = [
    { value: '5m', label: '5 minutes', minutes: 5 },
    { value: '15m', label: '15 minutes', minutes: 15 },
    { value: '30m', label: '30 minutes', minutes: 30 },
    { value: '1h', label: '1 hour', minutes: 60 },
    { value: '2h', label: '2 hours', minutes: 120 },
    { value: '4h', label: '4 hours', minutes: 240 },
    { value: '6h', label: '6 hours', minutes: 360 },
    { value: '8h', label: '8 hours', minutes: 480 },
    { value: '12h', label: '12 hours', minutes: 720 },
    { value: '1d', label: '1 day', minutes: 1440 },
    { value: '2d', label: '2 days', minutes: 2880 },
    { value: 'custom', label: 'Custom time', minutes: 0 }
  ];

  const commonReasons = [
    "Customer requested follow-up later",
    "Waiting for customer response",
    "Customer is busy, will contact later",
    "Need to prepare specialized content",
    "Customer timezone - will follow up at better time",
    "Technical issue - will resolve and follow up",
    "Other priority chat requires attention"
  ];

  const handleConfirm = () => {
    let minutes = 0;
    
    if (selectedTime === 'custom') {
      const customValue = parseInt(customTime);
      if (!customValue || customValue <= 0) {
        alert('Please enter a valid custom time');
        return;
      }
      
      switch (customUnit) {
        case 'minutes':
          minutes = customValue;
          break;
        case 'hours':
          minutes = customValue * 60;
          break;
        case 'days':
          minutes = customValue * 1440;
          break;
        default:
          minutes = customValue * 60;
      }
    } else {
      const option = timeOptions.find(opt => opt.value === selectedTime);
      if (!option) {
        alert('Please select a time option');
        return;
      }
      minutes = option.minutes;
    }

    // Calculate push back until time
    const pushBackUntil = new Date(Date.now() + minutes * 60 * 1000);
    
    onConfirm({
      minutes,
      pushBackUntil,
      reason: reason.trim() || 'No reason specified',
      selectedOption: selectedTime === 'custom' ? `${customTime} ${customUnit}` : selectedTime
    });
    
    handleClose();
  };

  const handleClose = () => {
    setSelectedTime('');
    setCustomTime('');
    setCustomUnit('hours');
    setReason('');
    onClose();
  };

  const getTimeDisplay = () => {
    if (!selectedTime) return null;
    
    if (selectedTime === 'custom' && customTime) {
      return `${customTime} ${customUnit}`;
    }
    
    const option = timeOptions.find(opt => opt.value === selectedTime);
    return option?.label;
  };

  const getPreviewTime = () => {
    if (!selectedTime) return null;
    
    let minutes = 0;
    if (selectedTime === 'custom' && customTime) {
      const customValue = parseInt(customTime);
      switch (customUnit) {
        case 'minutes':
          minutes = customValue;
          break;
        case 'hours':
          minutes = customValue * 60;
          break;
        case 'days':
          minutes = customValue * 1440;
          break;
        default:
          minutes = customValue * 60;
      }
    } else {
      const option = timeOptions.find(opt => opt.value === selectedTime);
      minutes = option?.minutes || 0;
    }
    
    if (minutes > 0) {
      const futureTime = new Date(Date.now() + minutes * 60 * 1000);
      return futureTime.toLocaleString();
    }
    
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-700"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">Push Back Chat</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Temporarily remove {customerName}'s chat from queue
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
              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <FaClock className="inline mr-2" />
                  Select push back duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedTime(option.value)}
                      className={`p-3 text-sm rounded-lg border transition-colors ${
                        selectedTime === option.value
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Time Input */}
              {selectedTime === 'custom' && (
                <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom Duration
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      placeholder="Enter time"
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Preview */}
              {getPreviewTime() && (
                <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-400">
                    <FaCalendarAlt className="w-4 h-4" />
                    <span className="text-sm font-medium">Chat will reappear on:</span>
                  </div>
                  <p className="text-white font-mono text-sm mt-1">
                    {getPreviewTime()}
                  </p>
                </div>
              )}

              {/* Reason Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason (Optional)
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                >
                  <option value="">Select a reason...</option>
                  {commonReasons.map((reasonText, index) => (
                    <option key={index} value={reasonText}>
                      {reasonText}
                    </option>
                  ))}
                  <option value="custom">Other (type below)</option>
                </select>
                
                {reason === 'custom' && (
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter custom reason..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows="2"
                  />
                )}
              </div>

              {/* Warning */}
              <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  ⚠️ This chat will be removed from the live queue for {getTimeDisplay() || 'the selected duration'} and will automatically reappear when the time expires.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedTime || isLoading || (selectedTime === 'custom' && (!customTime || parseInt(customTime) <= 0))}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaClock className="w-4 h-4" />
                    Push Back Chat
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PushBackDialog;
