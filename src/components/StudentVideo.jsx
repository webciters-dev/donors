import React from 'react';
import { Video } from 'lucide-react';
import { API } from '@/lib/api';

/**
 * StudentVideo Component - Simplified to follow VideoUploader pattern
 * 
 * Displays student introduction videos with simple, reliable playback.
 * Based on the working VideoUploader implementation pattern.
 * 
 * Props:
 * - student: Student object with video fields
 * - size: 'small' | 'medium' | 'large'
 * - className: Additional CSS classes
 * - showPlaceholder: Whether to show placeholder when no video
 */

const StudentVideo = ({ 
  student, 
  size = 'medium', 
  className = '', 
  showPlaceholder = true
}) => {
  // Early return if student is null/undefined
  if (!student) {
    if (!showPlaceholder) return null;
    
    return (
      <div className={`
        w-48 h-36
        bg-gray-100 border-2 border-gray-200 rounded-lg 
        flex flex-col items-center justify-center gap-2
        ${className}
      `}>
        <Video size={24} className="text-gray-400" />
        <span className="text-xs text-gray-500">No student data</span>
      </div>
    );
  }

  // Size configurations - Updated to match VideoUploader
  const sizeClasses = {
    small: 'w-32 h-24',
    medium: 'w-64 h-48', 
    large: 'w-full max-w-md mx-auto',
    xlarge: 'w-full max-w-lg mx-auto'
  };

  // Get video URLs - Simple, direct approach like VideoUploader
  const videoUrl = student?.introVideoUrl ? 
    (student.introVideoUrl.startsWith('http') ? 
      student.introVideoUrl : 
      `${API.baseURL}${student.introVideoUrl}`) : null;
  
  const thumbnailUrl = student?.introVideoThumbnailUrl ? 
    (student.introVideoThumbnailUrl.startsWith('http') ? 
      student.introVideoThumbnailUrl : 
      `${API.baseURL}${student.introVideoThumbnailUrl}`) : null;
      
  const duration = student?.introVideoDuration;

  // Format duration (seconds to mm:ss)
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If no video URL, show placeholder
  if (!videoUrl) {
    if (!showPlaceholder) return null;
    
    return (
      <div className={`
        ${sizeClasses[size]} 
        bg-gray-100 border-2 border-gray-200 rounded-lg 
        flex flex-col items-center justify-center gap-2
        ${className}
      `}>
        <Video size={24} className="text-gray-400" />
        <span className="text-xs text-gray-500">No video</span>
      </div>
    );
  }

  // Simple inline video display like VideoUploader - NO MODAL
  return (
    <div className={`${className} space-y-2`}>
      <div className="relative">
        <video
          className={`${sizeClasses[size]} rounded-lg shadow-lg border border-gray-200`}
          controls
          preload="metadata"
          poster={thumbnailUrl}
          style={{ maxHeight: '300px', objectFit: 'contain' }}
          onError={(e) => {
            console.error('🎥 Video error:', e);
          }}
          onLoadedMetadata={() => {
            console.log('🎥 Video metadata loaded successfully');
          }}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>
        
        {/* Duration badge */}
        {duration && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {formatDuration(duration)}
          </div>
        )}
      </div>
      
      {/* Video info */}
      <div className="text-xs text-gray-600 text-center">
        {student?.name || 'Student'}'s Introduction
      </div>
    </div>
  );
};

export default StudentVideo;