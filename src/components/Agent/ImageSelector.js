import React, { useState, useEffect } from 'react';
import { FaImage, FaTimes, FaSearch, FaSync } from 'react-icons/fa';
import { agentAuth } from '../../services/agentApi';

const ImageSelector = ({ isOpen, onClose, onSelectImage, onSendImage, escortProfileId }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (isOpen && escortProfileId) {
      console.log('Loading images for escort profile:', escortProfileId);
      loadImages();
    } else if (isOpen && !escortProfileId) {
      console.warn('Modal opened but no escortProfileId provided');
      setError('No escort profile selected');
    }
  }, [isOpen, escortProfileId]);

  // Additional effect to load images when escortProfileId becomes available
  useEffect(() => {
    if (isOpen && escortProfileId && images.length === 0 && !loading) {
      console.log('Escort profile ID became available, loading images:', escortProfileId);
      loadImages();
    }
  }, [escortProfileId]);

  // Add keyboard support for closing modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedImage(null);
      setError('');
    }
  }, [isOpen]);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching images for escort profile:', escortProfileId);
      
      // Fetch images specifically for this escort profile
      const response = await agentAuth.getImages(escortProfileId);
      console.log('Images response:', response);
      
      if (response && response.images) {
        setImages(response.images);
        console.log('Successfully loaded', response.images.length, 'images');
      } else {
        console.warn('No images in response:', response);
        setImages([]);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      setError('Failed to load images. Please try again.');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleSendImage = () => {
    if (selectedImage) {
      onSendImage(selectedImage);
      setSelectedImage(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center">
              <FaImage className="mr-2 text-blue-400" />
              Select Image
            </h2>
            {!loading && (
              <p className="text-sm text-gray-400 mt-1">
                {images.length} image{images.length !== 1 ? 's' : ''} available
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadImages}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded"
              title="Refresh images"
              disabled={loading}
            >
              <FaSync size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mb-4">
                <FaImage className="text-red-400 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Error Loading Images</h3>
              <p className="text-gray-400 mb-6 max-w-md">{error}</p>
              <button
                onClick={loadImages}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <div className="w-12 h-12 border-4 border-gray-600 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">Loading images...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <FaImage className="text-gray-400 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Images Found</h3>
              <p className="text-gray-400 max-w-md">
                No images have been uploaded for this escort profile yet.
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {images.map((image) => (
                  <div
                    key={image._id}
                    onClick={() => handleImageClick(image)}
                    className={`relative cursor-pointer rounded border ${
                      selectedImage?._id === image._id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="relative w-full h-20">
                      <img
                        src={image.imageData}
                        alt={image.filename}
                        className="w-full h-full object-cover rounded"
                      />
                      
                      {selectedImage?._id === image._id && (
                        <div className="absolute top-1 right-1">
                          <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-300 truncate mt-1 px-1" title={image.filename}>
                      {image.filename}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {selectedImage ? (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  <span className="text-white">{selectedImage.filename}</span>
                </div>
              ) : (
                <span>Click an image to select it</span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSendImage}
                disabled={!selectedImage}
                className={`px-4 py-2 rounded text-white ${
                  selectedImage
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                Send Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSelector;
