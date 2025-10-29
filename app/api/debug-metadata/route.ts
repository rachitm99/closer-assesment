import { NextResponse } from 'next/server';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import app from '@/lib/firebase';

export async function GET() {
  try {
    const storage = getStorage(app);
    
    // List all metadata files
    const metadataRef = ref(storage, 'metadata/');
    const metadataList = await listAll(metadataRef);
    
    const metadataFiles = [];
    for (const item of metadataList.items) {
      try {
        const url = await getDownloadURL(item);
        const response = await fetch(url);
        const data = await response.json();
        metadataFiles.push({
          name: item.name,
          data: data,
          hasTranscription: !!data.transcription?.text,
        });
      } catch (error) {
        console.error(`Error loading ${item.name}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      count: metadataFiles.length,
      files: metadataFiles,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list metadata',
    }, { status: 500 });
  }
}
