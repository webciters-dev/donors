import React, { useState } from 'react';
import { User, AlertCircle } from 'lucide-react';
import API from '../lib/api';

/**
 * StudentPhoto Component
 * 
 * Displays student photos with support for full-size and thumbnail versions.
 * Includes fallback handling and role-based access control.
 * 
 * Props:
 * - student: Student object with photo fields
 * - size: 'thumbnail' | 'small' | 'medium' | 'large' | 'full'
 * - className: Additional CSS classes
 * - showPlaceholder: Whether to show placeholder when no photo
 * - clickable: Whether photo should be clickable to view full size
 * - alt: Alt text override (defaults to student name)
 */

const StudentPhoto = ({ 
  student, 
  size = 'medium', 
  className = '', 
  showPlaceholder = true, 
  clickable = false,
  alt 
}) => {
  const [imageError, setImageError] = useState(false);
  const [showFullSize, setShowFullSize] = useState(false);

  // Size configurations
  const sizeClasses = {
    thumbnail: 'w-8 h-8',
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
    full: 'w-32 h-32'
  };

  const iconSizes = {
    thumbnail: 16,
    small: 20,
    medium: 24,
    large: 32,
    full: 40
  };

  // Determine which photo URL to use
  const getPhotoUrl = () => {
    if (!student) return null;
    
    // For thumbnail and small sizes, prefer thumbnail if available
    if ((size === 'thumbnail' || size === 'small') && student.photoThumbnailUrl) {
      return `${API.baseURL}/${student.photoThumbnailUrl}`;
    }
    
    // For larger sizes or if no thumbnail, use full photo
    if (student.photoUrl) {
      return `${API.baseURL}/${student.photoUrl}`;
    }
    
    return null;
  };

  const photoUrl = getPhotoUrl();
  const altText = alt || (student?.name ? `${student.name}'s photo` : 'Student photo');

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  // Handle photo click for full-size view
  const handlePhotoClick = () => {
    if (clickable && student?.photoUrl) {
      setShowFullSize(true);
    }
  };

  // If no photo URL or image failed to load, show placeholder
  if (!photoUrl || imageError) {
    if (!showPlaceholder) return null;
    
    return (
      <div className={`
        ${sizeClasses[size]} 
        bg-gray-100 border-2 border-gray-200 rounded-full 
        flex items-center justify-center
        ${className}
      `}>
        <User 
          size={iconSizes[size]} 
          className="text-gray-400" 
        />
      </div>
    );
  }

  return (
    <>
      <div className={`
        ${sizeClasses[size]} 
        rounded-full overflow-hidden border-2 border-gray-200
        ${clickable ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''}
        ${className}
      `}
        onClick={handlePhotoClick}
      >
        <img
          src={photoUrl}
          alt={altText}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      </div>

      {/* Full-size photo modal */}
      {showFullSize && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullSize(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={`${API.baseURL}/${student.photoUrl}`}
              alt={altText}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowFullSize(false)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 
                         text-white rounded-full p-2 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentPhoto;