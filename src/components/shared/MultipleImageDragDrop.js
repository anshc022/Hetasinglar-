import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { FaUpload, FaTrash, FaImage, FaPlus } from 'react-icons/fa';

const MultipleImageDragDrop = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 10, 
  maxSizePerImageMB = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const compressImage = async (file, progress) => {
    const options = {
      maxSizeMB: maxSizePerImageMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
      quality: 0.8,
      onProgress: (progressValue) => {
        const percentage = Math.round(progressValue);
        progress(percentage);
      }
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(compressedFile);
      });
    } catch (error) {
      throw new Error(`Compression failed: ${error.message}`);
    }
  };

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type: ${file.name}. Accepted types: ${acceptedTypes.join(', ')}`;
    }
    if (file.size > maxSizePerImageMB * 1024 * 1024) {
      return `File too large: ${file.name}. Maximum size: ${maxSizePerImageMB}MB`;
    }
    return null;
  };

  const processFiles = async (files) => {
    const fileArray = Array.from(files);
    const totalImages = images.length + fileArray.length;

    if (totalImages > maxImages) {
      setErrors([`Cannot add ${fileArray.length} images. Maximum ${maxImages} images allowed. You currently have ${images.length} images.`]);
      return;
    }

    setErrors([]);
    const newImages = [];
    const newProgress = {};

    // Initialize progress for all files
    fileArray.forEach((file, index) => {
      newProgress[`temp_${index}`] = 0;
    });
    setUploadProgress(newProgress);

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const progressKey = `temp_${i}`;

        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          setErrors(prev => [...prev, validationError]);
          continue;
        }

        // Compress and convert to base64
        const progressCallback = (percentage) => {
          setUploadProgress(prev => ({
            ...prev,
            [progressKey]: percentage
          }));
        };

        const base64 = await compressImage(file, progressCallback);
        
        newImages.push({
          id: Date.now() + i,
          name: file.name,
          data: base64,
          size: file.size,
          type: file.type
        });

        // Clear progress for this file
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[progressKey];
          return updated;
        });
      }

      // Update parent component with new images
      onImagesChange([...images, ...newImages]);

    } catch (error) {
      setErrors(prev => [...prev, `Upload failed: ${error.message}`]);
      setUploadProgress({});
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFiles(files);
    }
    // Reset file input
    e.target.value = '';
  };

  const removeImage = (imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    onImagesChange(updatedImages);
  };

  const moveImage = (fromIndex, toIndex) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    onImagesChange(updatedImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const hasProgress = Object.keys(uploadProgress).length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-3">
          <div className="flex justify-center">
            <FaUpload className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Drop images here or click to select
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Support: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} • 
              Max {maxSizePerImageMB}MB per image • 
              Up to {maxImages} images
            </p>
          </div>
          
          {images.length < maxImages && (
            <button
              type="button"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
            >
              <FaPlus className="w-4 h-4" />
              <span>Add Images ({images.length}/{maxImages})</span>
            </button>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {hasProgress && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing images...</h4>
          {Object.entries(uploadProgress).map(([key, progress]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Image {key.split('_')[1]}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Images ({images.length}/{maxImages})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-square"
              >
                <img
                  src={image.data}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay with controls */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      title="Remove image"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* Image info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                  <p className="truncate">{image.name}</p>
                  <p>{(image.size / 1024 / 1024).toFixed(1)}MB</p>
                </div>
                
                {/* Image number badge */}
                <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleImageDragDrop;