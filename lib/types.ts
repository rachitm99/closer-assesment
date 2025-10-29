export interface Video {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
  transcription?: Transcription;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}

export interface Transcription {
  id: string;
  text: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  words?: Word[];
  utterances?: Utterance[];
  completedAt?: string;
}

export interface Word {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface Utterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
  confidence: number;
  words: Word[];
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}
