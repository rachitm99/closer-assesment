'use server';

import { Video } from '@/lib/types';
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import app from '@/lib/firebase';

// In-memory storage for demonstration (in production, use a database)
const videos: Map<string, Video> = new Map();

// Get Firebase Storage instance
const getFirebaseStorage = () => {
  return getStorage(app);
};

// Load video metadata from Firebase Storage
async function loadVideoDataFromStorage(videoId: string): Promise<Video | null> {
  try {
    const storage = getFirebaseStorage();
    const metadataRef = ref(storage, `metadata/${videoId}.json`);
    const url = await getDownloadURL(metadataRef);
    const response = await fetch(url);
    const videoData: Video = await response.json();
    return videoData;
  } catch (error) {
    // Metadata file doesn't exist
    return null;
  }
}

export async function saveVideoMetadata(video: Omit<Video, 'id'>) {
  const id = Date.now().toString();
  const newVideo: Video = {
    ...video,
    id,
  };
  
  videos.set(id, newVideo);
  
  // Note: Metadata is now saved from client-side in VideoUpload component
  // This ensures the authenticated user's token is used
  
  return {
    success: true,
    data: newVideo,
  };
}

export async function updateVideoStatus(
  videoId: string,
  status: Video['status'],
  transcription?: Video['transcription']
) {
  const video = videos.get(videoId);
  
  if (!video) {
    return {
      success: false,
      error: 'Video not found',
    };
  }
  
  video.status = status;
  if (transcription) {
    video.transcription = transcription;
  }
  
  videos.set(videoId, video);
  
  // Note: Metadata is now saved from client-side in VideoUpload component
  // This ensures the authenticated user's token is used
  
  return {
    success: true,
    data: video,
  };
}

export async function getVideos() {
  try {
    // Fetch videos from Firebase Storage (source of truth)
    const storage = getFirebaseStorage();
    const videosRef = ref(storage, 'videos/');
    const metadataRef = ref(storage, 'metadata/');
    const videoMap = new Map<string, Video>();
    
    try {
      // First, load all metadata files to find videos with transcriptions
      const metadataList = await listAll(metadataRef);
      const metadataByUrl = new Map<string, Video>();
      
      for (const metaItem of metadataList.items) {
        try {
          const metaUrl = await getDownloadURL(metaItem);
          const response = await fetch(metaUrl);
          const videoData: Video = await response.json();
          // Index by video URL (without token) for matching
          const cleanUrl = videoData.url.split('?')[0];
          metadataByUrl.set(cleanUrl, videoData);
          console.log(`Loaded metadata: ${metaItem.name}, has transcription: ${!!videoData.transcription?.text}`);
        } catch (error) {
          console.error(`Error loading metadata ${metaItem.name}:`, error);
        }
      }
      
      // Now process all video files
      const result = await listAll(videosRef);
      
      for (const itemRef of result.items) {
        try {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);
          
          // Extract video ID from filename (format: timestamp_filename.mp4)
          const fileName = itemRef.name;
          const id = fileName.split('_')[0] || Date.now().toString();
          const cleanUrl = url.split('?')[0];
          
          console.log(`Processing video: ${fileName}, ID: ${id}`);
          
          let video: Video | null = null;
          
          // Priority 1: Check if we have metadata for this video URL
          if (metadataByUrl.has(cleanUrl)) {
            video = metadataByUrl.get(cleanUrl)!;
            console.log(`Found metadata by URL, has transcription: ${!!video.transcription?.text}`);
            // Ensure ID and URL are current
            video.id = id;
            video.url = url;
            video.size = metadata.size;
            // Cache it in memory
            videos.set(id, video);
          }
          
          // Priority 2: Try to load from metadata file by ID
          if (!video) {
            const savedVideoData = await loadVideoDataFromStorage(id);
            if (savedVideoData) {
              console.log(`Found metadata by ID ${id}, has transcription: ${!!savedVideoData.transcription?.text}`);
              video = savedVideoData;
              video.url = url;
              video.size = metadata.size;
              videos.set(id, video);
            }
          }
          
          // Priority 3: Check memory
          if (!video && videos.has(id)) {
            console.log(`Found video in memory for ${id}`);
            video = videos.get(id)!;
            video.url = url;
          }
          
          // Priority 4: Create basic video object
          if (!video) {
            console.log(`Creating basic video object for ${id}`);
            video = {
              id,
              name: fileName.substring(fileName.indexOf('_') + 1) || fileName,
              url,
              size: metadata.size,
              uploadedAt: metadata.timeCreated,
              status: 'completed',
            };
            videos.set(id, video);
          }
          
          // Add to map, preferring videos with transcriptions
          if (videoMap.has(id)) {
            const existing = videoMap.get(id)!;
            if (video.transcription?.text && !existing.transcription?.text) {
              console.log(`Replacing video ${id} with version that has transcription`);
              videoMap.set(id, video);
            }
          } else {
            videoMap.set(id, video);
          }
        } catch (error) {
          console.error('Error fetching video metadata:', error);
        }
      }
      
      // Convert map to array and sort by upload date
      const sortedVideos = Array.from(videoMap.values()).sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      
      console.log(`Returning ${sortedVideos.length} videos`);
      
      return {
        success: true,
        data: sortedVideos,
      };
    } catch (storageError) {
      console.error('Firebase Storage error:', storageError);
      // Fallback to memory-only videos
      const videoList = Array.from(videos.values()).sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      
      return {
        success: true,
        data: videoList,
      };
    }
  } catch (error) {
    console.error('Get videos error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch videos',
      data: [],
    };
  }
}

export async function getVideoById(videoId: string) {
  const video = videos.get(videoId);
  
  if (!video) {
    return {
      success: false,
      error: 'Video not found',
    };
  }
  
  return {
    success: true,
    data: video,
  };
}

export async function deleteVideo(videoId: string) {
  const deleted = videos.delete(videoId);
  
  return {
    success: deleted,
    error: deleted ? undefined : 'Video not found',
  };
}
