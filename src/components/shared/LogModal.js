import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

const LogModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  subjectName = "Subject",
  subjectType = "escort", // "escort" or "user"
  isLoading = false,
  editMode = false,
  initialData = null
}) => {
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [content, setContent] = useState('');

  // Initialize form with existing data when in edit mode
  useEffect(() => {
    if (editMode && initialData) {
      const predefinedCategories = ['City', 'Job', 'Family', 'Money', 'Relationship', 'Health', 'Travel', 'Other'];
      const initialCategory = initialData.category || '';
      
      if (predefinedCategories.includes(initialCategory)) {
        setCategory(initialCategory);
        setCustomCategory('');
      } else {
        setCategory('Custom');
        setCustomCategory(initialCategory);
      }
      
      setContent(initialData.content || '');
    } else if (!editMode) {
      setCategory('');
      setCustomCategory('');
      setContent('');
    }
  }, [editMode, initialData, isOpen]);

  // Categories for logs
  const categories = [
    'City',
    'Job',
    'Family',
    'Money',
    'Relationship',
    'Health',
    'Travel',
    'Other',
    'Custom'
  ];

  const handleSubmit = async () => {
    const finalCategory = category === 'Custom' ? customCategory.trim() : category;
    
    if (!finalCategory || !content.trim()) {
      alert('Please select/enter a category and enter log content');
      return;
    }
    
    try {
      // Call onSubmit and await its result - this allows us to know if there was an error
      const result = await onSubmit({
        category: finalCategory,
        content: content.trim()
      });
      
      // Only close the modal if submission was successful
      // If onSubmit returns false or throws an error, keep the modal open
      if (result !== false) {
        handleClose();
      }
    } catch (error) {
      // If onSubmit throws an error, log it but keep the modal open
      console.error('Error submitting log:', error);
      // Don't close the modal, so the user can try again
    }
  };

  const handleClose = () => {
    setCategory('');
    setCustomCategory('');
    setContent('');
    onClose();
  };

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  const modalVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
    exit: { y: 20, opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {editMode ? 'Edit Log' : 'Add New Log'}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {editMode ? 'Update the log entry' : `Add a new log entry for ${subjectName}`}
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
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value !== 'Custom') {
                      setCustomCategory('');
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a category...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Custom Category Input */}
                {category === 'Custom' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Enter Custom Category
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter your custom category..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Log Content */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Log Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Enter ${category === 'Custom' ? (customCategory || 'log') : (category || 'log')} details...`}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="6"
                />
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
                onClick={handleSubmit}
                disabled={
                  (!category || (category === 'Custom' && !customCategory.trim()) || !content.trim() || isLoading)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {editMode ? 'Update Log' : 'Save Log'}
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

export default LogModal;
