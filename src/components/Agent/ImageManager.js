import React, { useState, useEffect } from 'react';
import { FaUpload, FaTrash, FaEdit, FaImage, FaTimes, FaPlus, FaUser, FaCompress } from 'react-icons/fa';
import { agentAuth, agentApi } from '../../services/agentApi';
import { compressImage, formatFileSize, shouldCompressImage } from '../../utils/imageCompression';

const ImageManager = () => {
  const [images, setImages] = useState([]);
  const [escorts, setEscorts] = useState([]);
  const [selectedEscort, setSelectedEscort] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [filterByEscort, setFilterByEscort] = useState('all');
  const [compressionStats, setCompressionStats] = useState([]);

  useEffect(() => {
    loadImages();
    loadEscorts();
  }, []);

  const loadEscorts = async () => {
    try {
      const response = await agentApi.get('/escort-profiles');
      setEscorts(response.data || []);
    } catch (error) {
      console.error('Error loading escorts:', error);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await agentAuth.getImages();
      setImages(response.images || []);
    } catch (error) {
      console.error('Error loading images:', error);
      alert('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    if (!selectedEscort) {
      alert('Please select an escort profile before uploading images');
      return;
    }

    setUploading(true);
    setCompressionStats([]);
    
    try {
      const processedImages = [];
      const compressionResults = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if compression is needed
        if (shouldCompressImage(file, 500)) {
          console.log(`Compressing ${file.name} (${formatFileSize(file.size)})`);
          
          const compressionResult = await compressImage(file, 500, 0.8);
          
          compressionResults.push({
            filename: file.name,
            originalSize: formatFileSize(file.size),
            compressedSize: formatFileSize(compressionResult.size),
            compressionRatio: compressionResult.compressionRatio,
            compressed: true
          });

          processedImages.push({
            filename: file.name,
            imageData: compressionResult.dataUrl,
            mimeType: 'image/jpeg',
            size: compressionResult.size,
            description: '',
            tags: [],
            escortProfileId: selectedEscort,
            compressed: true,
            originalSize: file.size
          });
        } else {
          // No compression needed
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });

          compressionResults.push({
            filename: file.name,
            originalSize: formatFileSize(file.size),
            compressedSize: formatFileSize(file.size),
            compressionRatio: '0',
            compressed: false
          });

          processedImages.push({
            filename: file.name,
            imageData: dataUrl,
            mimeType: file.type,
            size: file.size,
            description: '',
            tags: [],
            escortProfileId: selectedEscort,
            compressed: false
          });
        }
      }

      setCompressionStats(compressionResults);

      const response = await agentAuth.uploadImages(processedImages);
      
      if (response.success) {
        const compressedCount = compressionResults.filter(r => r.compressed).length;
        const message = compressedCount > 0 
          ? `Successfully uploaded ${response.images.length} images (${compressedCount} compressed)`
          : `Successfully uploaded ${response.images.length} images`;
        
        alert(message);
        loadImages(); // Reload images
        setSelectedEscort(''); // Reset escort selection
        
        // Clear compression stats after 5 seconds
        setTimeout(() => setCompressionStats([]), 5000);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      await agentAuth.deleteImage(imageId);
      setImages(prev => prev.filter(img => img._id !== imageId));
      alert('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const handleEditImage = (image) => {
    setEditingImage(image);
    setEditDescription(image.description || '');
    setEditTags(image.tags ? image.tags.join(', ') : '');
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;

    try {
      await agentAuth.updateImage(editingImage._id, {
        description: editDescription,
        tags: editTags.split(',').map(tag => tag.trim()).filter(tag => tag)
      });
      
      setImages(prev => prev.map(img => 
        img._id === editingImage._id 
          ? { ...img, description: editDescription, tags: editTags.split(',').map(tag => tag.trim()).filter(tag => tag) }
          : img
      ));
      
      setEditingImage(null);
      setEditDescription('');
      setEditTags('');
      alert('Image updated successfully');
    } catch (error) {
      console.error('Error updating image:', error);
      alert('Failed to update image');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFilteredImages = () => {
    if (filterByEscort === 'all') {
      return images;
    }
    return images.filter(img => img.escortProfileId === filterByEscort);
  };

  const getEscortName = (escortId) => {
    const escort = escorts.find(e => e._id === escortId);
    return escort ? escort.firstName : 'Unknown';
  };

  const filteredImages = getFilteredImages();

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <FaImage className="mr-2" />
          Image Manager
        </h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">
            {filteredImages.length} / {images.length} images
          </span>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Upload Images</h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Escort Profile
            </label>
            <select
              value={selectedEscort}
              onChange={(e) => setSelectedEscort(e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded-md border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an escort profile...</option>
              {escorts.map(escort => (
                <option key={escort._id} value={escort._id}>
                  {escort.firstName} (#{escort.serialNumber})
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="imageUpload"
              disabled={uploading || !selectedEscort}
            />
            <label
              htmlFor="imageUpload"
              className={`flex items-center px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                uploading || !selectedEscort
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <FaUpload className="mr-2" />
              {uploading ? 'Uploading...' : 'Upload Images'}
            </label>
          </div>
        </div>
      </div>

      {/* Compression Stats */}
      {compressionStats.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <FaCompress className="mr-2" />
            Compression Results
          </h3>
          <div className="space-y-2">
            {compressionStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-gray-300 truncate max-w-[150px]">{stat.filename}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">{stat.originalSize}</span>
                  {stat.compressed && (
                    <>
                      <span className="text-gray-500">→</span>
                      <span className="text-green-400">{stat.compressedSize}</span>
                      <span className="text-green-400 font-medium">(-{stat.compressionRatio}%)</span>
                    </>
                  )}
                  {!stat.compressed && (
                    <span className="text-blue-400">No compression needed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-300">Filter by Escort:</label>
          <select
            value={filterByEscort}
            onChange={(e) => setFilterByEscort(e.target.value)}
            className="px-3 py-2 bg-gray-600 text-white rounded-md border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Escorts</option>
            {escorts.map(escort => (
              <option key={escort._id} value={escort._id}>
                {escort.firstName} (#{escort.serialNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading images...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div key={image._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="relative mb-3">
                <img
                  src={image.imageData}
                  alt={image.filename}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => handleEditImage(image)}
                    className="p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 text-xs"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteImage(image._id)}
                    className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 text-xs"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-white truncate" title={image.filename}>
                  {image.filename}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{formatFileSize(image.size)}</span>
                  {image.compressed && (
                    <span className="text-green-400 flex items-center">
                      <FaCompress className="mr-1" />
                      Compressed
                    </span>
                  )}
                </div>
                
                {image.escortProfileId && (
                  <div className="flex items-center text-xs text-blue-400">
                    <FaUser className="mr-1" />
                    {getEscortName(image.escortProfileId)}
                  </div>
                )}
                
                {image.description && (
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {image.description}
                  </p>
                )}
                
                {image.tags && image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {image.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredImages.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          <FaImage className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No images found</p>
          <p className="text-sm mt-2">
            {filterByEscort === 'all' 
              ? 'Upload images to use them in your chats' 
              : 'No images uploaded for this escort profile'}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Edit Image</h3>
              <button
                onClick={() => setEditingImage(null)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <img
                  src={editingImage.imageData}
                  alt={editingImage.filename}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
                <p className="text-sm text-gray-400">{editingImage.filename}</p>
                {editingImage.escortProfileId && (
                  <p className="text-xs text-blue-400 mt-1">
                    <FaUser className="inline mr-1" />
                    {getEscortName(editingImage.escortProfileId)}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter image description..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="tag1, tag2, tag3..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingImage(null)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageManager;
