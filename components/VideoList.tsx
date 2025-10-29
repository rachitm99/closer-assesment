'use client';

import { useEffect, useState } from 'react';
import { Video } from '@/lib/types';
import { getVideos } from '@/app/actions/videos';
import { Video as VideoIcon, FileText, Clock, Download, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function VideoList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    loadVideos();
  }, [refreshTrigger]);

  const loadVideos = async () => {
    setLoading(true);
    const result = await getVideos();
    if (result.success && result.data) {
      setVideos(result.data);
    } else {
      setVideos([]);
    }
    setLoading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <VideoIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No videos found</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Upload a video or click refresh to load existing videos
        </p>
        <button
          onClick={loadVideos}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setSelectedVideo(video)}
        >
          <div className="aspect-video bg-gray-900 relative">
            <video
              src={video.url}
              className="w-full h-full object-cover"
              controls
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute top-2 right-2">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  video.status === 'completed'
                    ? 'bg-green-500 text-white'
                    : video.status === 'processing'
                    ? 'bg-yellow-500 text-white'
                    : video.status === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {video.status}
              </span>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 truncate">
              {video.name}
            </h3>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(video.uploadedAt), { addSuffix: true })}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>{formatFileSize(video.size)}</span>
              </div>

              {video.transcription && video.transcription.text && (
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span className="truncate">Transcription available</span>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Storage URL:
                </p>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 break-all underline"
                >
                  {video.url}
                </a>
              </div>
            </div>

            {video.transcription?.text && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3">
                  {video.transcription.text}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}

      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {selectedVideo.name}
                </h2>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
                <video src={selectedVideo.url} className="w-full h-full" controls autoPlay />
              </div>

              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Firebase Storage URL:
                    </p>
                    <a
                      href={selectedVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 break-all underline"
                    >
                      {selectedVideo.url}
                    </a>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedVideo.url);
                      alert('URL copied to clipboard!');
                    }}
                    className="flex-shrink-0 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Copy URL
                  </button>
                </div>
              </div>

              {selectedVideo.transcription?.text && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Transcription
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedVideo.transcription.text}
                    </p>
                  </div>

                  {selectedVideo.transcription.utterances &&
                    selectedVideo.transcription.utterances.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
                          Speaker Breakdown
                        </h4>
                        <div className="space-y-3">
                          {selectedVideo.transcription.utterances.map((utterance, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  {utterance.speaker}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {Math.floor(utterance.start / 1000)}s -{' '}
                                  {Math.floor(utterance.end / 1000)}s
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm">
                                {utterance.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
