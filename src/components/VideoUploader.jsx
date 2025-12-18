// src/components/VideoUploader.jsx
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Play, Trash2, AlertCircle, CheckCircle, Video } from "lucide-react";
import { VIDEO_GUIDELINES } from "@/schemas/videoValidation.schema";
import { API } from "@/lib/api";

export default function VideoUploader({ 
  currentVideoUrl, 
  currentThumbnailUrl, 
  currentDuration,
  onVideoSelect, 
  onVideoRemove,
  className = "" 
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const MAX_SIZE_MB = VIDEO_GUIDELINES.fileSize.maxMB;
  const SUPPORTED_FORMATS = ["mp4", "mov", "avi", "webm"];

  // Format duration for display
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "Unknown";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Validate video file
  const validateVideo = (file) => {
    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!SUPPORTED_FORMATS.includes(fileExtension)) {
      toast.error(`Unsupported format. Please use: ${SUPPORTED_FORMATS.join(', ').toUpperCase()}`);
      return false;
    }

    // Check file size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_SIZE_MB}MB`);
      return false;
    }

    // Minimum size check (1MB)
    if (file.size < 1024 * 1024) {
      toast.error("File too small. Video should be at least 1MB");
      return false;
    }

    return true;
  };

  // Handle file selection and upload
  const handleFileSelect = async (file) => {
    if (!validateVideo(file)) return;

    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      // Get video metadata first
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const metadata = await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          const duration = Math.round(video.duration);
          resolve({ duration, size: file.size, type: file.type });
          window.URL.revokeObjectURL(video.src);
        };
        
        video.onerror = () => {
          reject(new Error("Could not read video file"));
          window.URL.revokeObjectURL(video.src);
        };
        
        video.src = url;
      });

      // Validate duration (30-120 seconds allowed)
      if (metadata.duration < 30) {
        toast.error("Video is too short. Please record at least 30 seconds.");
        handleRemoveVideo(false); // Don't call DELETE on error cleanup
        return;
      }
      
      if (metadata.duration > 120) {
        toast.error("Video is too long. Please keep it under 2 minutes (120 seconds).");
        handleRemoveVideo(false); // Don't call DELETE on error cleanup
        return;
      }

      // NOTE: Duration warnings are now displayed AFTER successful upload completion
      // This prevents confusing the user with warnings while the upload is still processing

      // Upload the video
      const formData = new FormData();
      formData.append('video', file);
      formData.append('duration', metadata.duration.toString()); // Send duration to backend

      const token = localStorage.getItem('auth_token');
      
      const xhr = new XMLHttpRequest();
      
      // Set timeout to 5 minutes for large file uploads
      xhr.timeout = 300000; // 5 minutes (300,000 ms)
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle upload completion
      xhr.addEventListener('load', () => {
        setIsUploading(false);
        
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          
          // Display success toast first
          toast.success("Video uploaded successfully!");
          
          // Then show duration warning if applicable (AFTER upload completes)
          const uploadedDuration = response.video?.duration || metadata.duration;
          if (uploadedDuration < 30 || uploadedDuration > 120) {
            toast.warning("Video duration is outside acceptable range (30-120 seconds)");
          }
          
          console.log('✅ Video upload successful:', response);
          
          // Pass the uploaded video data to parent
          onVideoSelect(response.video, metadata);
          
          // Clear preview URL since we now have the uploaded video
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }
        } else {
          // Server returned an error status
          console.error('🎥 Upload returned error status:', {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText
          });
          
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            toast.error(errorResponse.error || `Upload failed (${xhr.status})`);
          } catch (e) {
            toast.error(`Upload failed with status ${xhr.status}. Please try again.`);
          }
          handleRemoveVideo(false); // Don't call DELETE on error cleanup
        }
      });

      // Handle upload error
      xhr.addEventListener('error', () => {
        setIsUploading(false);
        console.error('🎥 XHR Upload Error:', {
          status: xhr.status,
          statusText: xhr.statusText,
          readyState: xhr.readyState,
          responseText: xhr.responseText,
          response: xhr.response
        });
        toast.error("Failed to upload video. Please try again.");
        handleRemoveVideo(false); // Don't call DELETE on error cleanup
      });

      // Handle upload timeout
      xhr.addEventListener('timeout', () => {
        setIsUploading(false);
        toast.error("Upload timed out. The file is too large or your connection is too slow. Please try uploading a smaller video or use a faster connection.");
        handleRemoveVideo(false); // Don't call DELETE on error cleanup
      });

      // Start upload
      xhr.open('POST', `${API.baseURL}/api/videos/upload-intro`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (error) {
      console.error('Video processing error:', error);
      toast.error("Could not process video file. Please try another file.");
      handleRemoveVideo(false); // Don't call DELETE on error cleanup
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Remove video
  const handleRemoveVideo = (shouldCallDelete = true) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Only call onVideoRemove if this was an intentional deletion
    if (shouldCallDelete) {
      onVideoRemove();
    }
  };

  // Determine what to show
  const hasCurrentVideo = currentVideoUrl;
  const hasSelectedVideo = selectedFile && previewUrl;
  const showVideo = hasCurrentVideo || hasSelectedVideo;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Guidelines Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Video className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Introduction Video Guidelines</h4>
            <p className="text-sm text-blue-800 mb-3">
              Record a personal 30-120 second video introducing yourself and explaining why you deserve educational sponsorship.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-700">
              <div>• Duration: 30-120 seconds</div>
              <div>• Max size: {MAX_SIZE_MB}MB</div>
              <div>• Formats: MP4, MOV, AVI, WebM</div>
              <div>• Speak clearly about your goals</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Video Upload/Display Area */}
      <Card className="p-6">
        {!showVideo ? (
          // Upload area when no video
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Introduction Video
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop your video here, or click to browse
            </p>
            <Button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Video File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        ) : (
          // Video preview/display area
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                controls
                preload="metadata"
                poster={currentThumbnailUrl}
                style={{ maxHeight: '300px' }}
                onError={(e) => {
                  console.error('Video error:', e);
                  toast.error('Error playing video. The video file may be corrupted.');
                }}
                onLoadedMetadata={() => {
                  console.log('Video metadata loaded successfully');
                }}
              >
                <source 
                  src={hasSelectedVideo ? previewUrl : `${API.baseURL}${currentVideoUrl}`} 
                  type="video/mp4" 
                />
                <source 
                  src={hasSelectedVideo ? previewUrl : `${API.baseURL}${currentVideoUrl}`} 
                  type="video/quicktime" 
                />
                Your browser does not support the video tag.
              </video>
              
              {/* Video info overlay */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                {currentDuration ? formatDuration(currentDuration) : (selectedFile ? 'Loading...' : 'Unknown')}
              </div>
            </div>

            {/* Video details */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {hasSelectedVideo ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">New video selected</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Current video</span>
                  </>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveVideo}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Hidden file input for replace functionality */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Uploading video...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}