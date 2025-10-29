'use client';

import { useState, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { saveVideoMetadata, updateVideoStatus } from '@/app/actions/videos';
import { transcribeVideo } from '@/app/actions/transcription';
import { saveVideoMetadataToStorage } from '@/lib/storage';
import { useAuth } from '@/components/AuthProvider';
import { Upload, X, Video, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export default function VideoUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const { user } = useAuth();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    const maxSize = 250 * 1024 * 1024; // 250MB
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid video file (MP4, WebM, OGG, or MOV)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 250MB';
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    // Check authentication first
    if (!user) {
      setUploads((prev) => [
        ...prev,
        {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: 'You must be signed in to upload videos',
        },
      ]);
      return;
    }

    const validation = validateFile(file);
    if (validation) {
      setUploads((prev) => [
        ...prev,
        {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: validation,
        },
      ]);
      return;
    }

    // Check if Firebase is configured
    if (!storage) {
      setUploads((prev) => [
        ...prev,
        {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: 'Firebase Storage is not configured. Please check your .env.local file.',
        },
      ]);
      return;
    }

    const uploadId = Date.now().toString();
    
    try {
      const storageRef = ref(storage, `videos/${uploadId}_${file.name}`);

      setUploads((prev) => [
        ...prev,
        {
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        },
      ]);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploads((prev) =>
          prev.map((upload) =>
            upload.fileName === file.name
              ? { ...upload, progress: Math.round(progress) }
              : upload
          )
        );
      },
      (error) => {
        console.error('Upload error:', error);
        setUploads((prev) =>
          prev.map((upload) =>
            upload.fileName === file.name
              ? { ...upload, status: 'error', error: error.message }
              : upload
          )
        );
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save video metadata to server (in-memory)
          const saveResult = await saveVideoMetadata({
            name: file.name,
            url: downloadURL,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            status: 'processing',
          });

          if (!saveResult.success) {
            throw new Error('Failed to save video metadata');
          }

          const videoId = saveResult.data.id;

          // Save initial metadata to Firebase Storage from client side (with auth token)
          const initialVideo = {
            id: videoId,
            name: file.name,
            url: downloadURL,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            status: 'processing' as const,
          };
          await saveVideoMetadataToStorage(initialVideo);

          // Update UI to show processing
          setUploads((prev) =>
            prev.map((upload) =>
              upload.fileName === file.name
                ? { ...upload, progress: 100, status: 'processing' }
                : upload
            )
          );

          // Start transcription
          const transcriptionResult = await transcribeVideo(downloadURL);

          if (transcriptionResult.success && transcriptionResult.data) {
            // Update video status in server
            await updateVideoStatus(videoId, 'completed', {
              id: transcriptionResult.data.id,
              text: transcriptionResult.data.text,
              status: 'completed',
              words: transcriptionResult.data.words,
              utterances: transcriptionResult.data.utterances,
              completedAt: new Date().toISOString(),
            });

            // Save metadata to Firebase Storage from client side (with auth token)
            const videoWithTranscription = {
              id: videoId,
              name: file.name,
              url: downloadURL,
              size: file.size,
              uploadedAt: new Date().toISOString(),
              status: 'completed' as const,
              transcription: {
                id: transcriptionResult.data.id,
                text: transcriptionResult.data.text,
                status: 'completed' as const,
                words: transcriptionResult.data.words,
                utterances: transcriptionResult.data.utterances,
                completedAt: new Date().toISOString(),
              },
            };

            // Save to Firebase Storage (client-side with user auth)
            const saved = await saveVideoMetadataToStorage(videoWithTranscription);
            if (saved) {
              console.log('Video metadata saved to Firebase Storage successfully');
            } else {
              console.error('Failed to save metadata to Firebase Storage');
            }

            setUploads((prev) =>
              prev.map((upload) =>
                upload.fileName === file.name
                  ? { ...upload, status: 'completed' }
                  : upload
              )
            );

            if (onUploadComplete) {
              onUploadComplete();
            }
          } else {
            throw new Error(transcriptionResult.error || 'Transcription failed');
          }
        } catch (error) {
          console.error('Processing error:', error);
          setUploads((prev) =>
            prev.map((upload) =>
              upload.fileName === file.name
                ? {
                    ...upload,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Processing failed',
                  }
                : upload
            )
          );
        }
      }
    );
    } catch (error) {
      console.error('Upload initialization error:', error);
      setUploads((prev) =>
        prev.map((upload) =>
          upload.fileName === file.name
            ? {
                ...upload,
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to initialize upload',
              }
            : upload
        )
      );
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => uploadFile(file));
    },
    []
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach((file) => uploadFile(file));
    }
  };

  const removeUpload = (fileName: string) => {
    setUploads((prev) => prev.filter((upload) => upload.fileName !== fileName));
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="video/*"
          multiple
          onChange={handleFileInput}
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <Upload className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Upload Video Files
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
            Drag and drop your video files here, or click to browse
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Supports MP4, WebM, OGG, MOV • Max 250MB
          </p>
        </label>
      </div>

      {uploads.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Upload Progress
          </h3>
          {uploads.map((upload, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Video className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {upload.fileName}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {upload.status === 'completed' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {upload.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <button
                    onClick={() => removeUpload(upload.fileName)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {upload.status === 'uploading' && (
                <>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Uploading... {upload.progress}%
                  </p>
                </>
              )}

              {upload.status === 'processing' && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Processing transcription...
                  </p>
                </div>
              )}

              {upload.status === 'completed' && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Upload and transcription completed!
                </p>
              )}

              {upload.status === 'error' && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Error: {upload.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
