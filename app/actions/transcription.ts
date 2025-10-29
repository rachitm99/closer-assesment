'use server';

import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export async function transcribeVideo(videoUrl: string) {
  try {
    const transcript = await client.transcripts.transcribe({
      audio: videoUrl,
      language_code: 'en',
      speaker_labels: true,
    });

    if (transcript.status === 'error') {
      throw new Error(transcript.error || 'Transcription failed');
    }

    return {
      success: true,
      data: {
        id: transcript.id,
        text: transcript.text || '',
        status: transcript.status,
        words: transcript.words || [],
        utterances: transcript.utterances || [],
      },
    };
  } catch (error) {
    console.error('Transcription error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to transcribe video',
    };
  }
}

export async function getTranscriptionStatus(transcriptId: string) {
  try {
    const transcript = await client.transcripts.get(transcriptId);
    
    return {
      success: true,
      data: {
        id: transcript.id,
        status: transcript.status,
        text: transcript.text || '',
        words: transcript.words || [],
        utterances: transcript.utterances || [],
      },
    };
  } catch (error) {
    console.error('Get transcription status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get transcription status',
    };
  }
}
