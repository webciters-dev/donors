// src/components/PhotoUpload.jsx
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { API } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function PhotoUpload({ 
  currentPhotoUrl = null,
  currentThumbnailUrl = null,
  onPhotoChange,
  required = false,
  className = "" 
}) {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentPhotoUrl);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Validate file before upload
  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
      return false;
    }

    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return false;
    }

    return true;
  };

  // Handle file selection
  const handleFileSelect = async (file) => {
    if (!validateFile(file)) return;

    setUploading(true);
    
    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload to server
      const formData = new FormData();
      formData.append('photo', file);

      // Use different endpoints based on authentication status
      const endpoint = token ? '/api/photos/upload' : '/api/photos/upload-temp';
      
      // Prepare headers - only add Authorization if token exists
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API.baseURL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Notify parent component
      if (onPhotoChange) {
        onPhotoChange({
          photoUrl: result.photoUrl,
          photoThumbnailUrl: result.photoThumbnailUrl,
          uploadedAt: result.uploadedAt || new Date().toISOString()
        });
      }

      toast.success('Photo uploaded successfully!');
      
      // Clean up preview URL
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
      
      // Reset preview on error
      setPreviewUrl(currentPhotoUrl);
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Handle file input change
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Remove photo
  const handleRemovePhoto = async () => {
    try {
      const response = await fetch(`${API.baseURL}/api/photos/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete photo');
      }

      setPreviewUrl(null);
      
      if (onPhotoChange) {
        onPhotoChange({
          photoUrl: null,
          photoThumbnailUrl: null,
          uploadedAt: null
        });
      }

      toast.success('Photo removed successfully');

    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to remove photo');
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Photo Preview */}
      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl.startsWith('blob:') ? previewUrl : `${API.baseURL}/${previewUrl}`}
            alt="Student Photo"
            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            title="Remove photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${uploading ? 'opacity-50 pointer-events-none' : 'hover:border-gray-400'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin mx-auto">
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600">Uploading photo...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Camera className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {previewUrl ? 'Change Photo' : 'Upload Your Photo'}
                {required && <span className="text-red-500 ml-1">*</span>}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Drag and drop or click to select
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPEG, PNG, WebP • Max 5MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mx-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Validation Message */}
      {required && !previewUrl && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          Photo is required for your application
        </div>
      )}
    </div>
  );
}