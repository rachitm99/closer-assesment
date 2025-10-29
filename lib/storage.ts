import { ref, uploadString } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Video } from '@/lib/types';

// Save video metadata to Firebase Storage (client-side with auth)
export async function saveVideoMetadataToStorage(video: Video): Promise<boolean> {
  try {
    const metadataRef = ref(storage, `metadata/${video.id}.json`);
    const videoData = JSON.stringify(video);
    await uploadString(metadataRef, videoData, 'raw', {
      contentType: 'application/json',
    });
    console.log(`Successfully saved metadata for video ${video.id}`);
    return true;
  } catch (error) {
    console.error('Error saving video metadata to storage:', error);
    return false;
  }
}
