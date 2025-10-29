'use client';

import { useState } from 'react';
import VideoUpload from '@/components/VideoUpload';
import VideoList from '@/components/VideoList';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/components/AuthProvider';
import { signOut } from '@/lib/auth';
import { Video, RefreshCw, LogOut, LogIn } from 'lucide-react';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4 relative">
            <div className="bg-blue-500 p-3 rounded-full">
              <Video className="w-8 h-8 text-white" />
            </div>
            
            {/* Auth Button */}
            <div className="absolute right-0 top-0">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Video Transcription Platform
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload your videos and get instant AI-powered transcriptions with speaker
            identification
          </p>
        </div>

        {/* Upload Section - Only show if authenticated */}
        {user ? (
          <div className="mb-16">
            <VideoUpload onUploadComplete={handleUploadComplete} />
          </div>
        ) : (
          <div className="mb-16 text-center p-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <Video className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Sign in to Upload Videos
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create an account or sign in to start uploading and transcribing videos
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Get Started
            </button>
          </div>
        )}

        {/* Videos List */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Videos
            </h2>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="Refresh video list"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          <VideoList refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </main>
  );
}
