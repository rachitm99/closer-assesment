# Video Transcription Platform

A modern Next.js application for uploading videos and generating AI-powered transcriptions with speaker identification using Firebase Storage and AssemblyAI.

## Features

- 🎥 **Video Upload**: Drag-and-drop or click to upload videos (up to 250MB)
- 🔐 **Authentication**: Secure email/password authentication via Firebase
- 🤖 **AI Transcription**: Automatic transcription with speaker diarization using AssemblyAI
- 💾 **Persistent Storage**: Videos and metadata stored in Firebase Storage
- 🌙 **Dark Mode**: Built-in dark mode support
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile

## Demo Video

Watch the platform in action:

[View Demo Video](https://github.com/user-attachments/assets/6ea905b5-67b4-47b5-bf30-3108bf9a07fc)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Storage**: Firebase Storage
- **Authentication**: Firebase Authentication (Email/Password)
- **Transcription**: AssemblyAI API
- **Deployment**: Optimized for Vercel

## Prerequisites

- Node.js 18+ and npm
- Firebase project with Storage and Authentication enabled
- AssemblyAI API key

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd closer-assesment
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Firebase Storage**:
   - Go to Storage → Get Started
   - Choose production mode
3. Enable **Email/Password Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Email/Password provider
4. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll to "Your apps" and copy the config

### 3. Configure Firebase Storage Rules

Go to Firebase Console → Storage → Rules and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Videos: Public read, authenticated write (max 250MB, video types only)
    match /videos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 250 * 1024 * 1024
                   && request.resource.contentType.matches('video/.*');
    }
    
    // Metadata: Public read, authenticated write
    match /metadata/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Click **Publish** to save the rules.

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# AssemblyAI API Key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
```

**Note**: Use the `.firebasestorage.app` domain, not `.appspot.com`.

### 5. Get AssemblyAI API Key

1. Sign up at [AssemblyAI](https://www.assemblyai.com/)
2. Go to Dashboard → API Keys
3. Copy your API key

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign Up/Sign In**: Click the "Sign In" button and create an account
2. **Upload Video**: Drag and drop a video file or click to browse (MP4, WebM, OGG, MOV up to 250MB)
3. **Wait for Processing**: The video will upload and transcription will begin automatically
4. **View Results**: Once complete, click on any video to see the full transcription with speaker breakdown

## Design Decisions

### Architecture

- **Server Actions**: Used for backend operations (video metadata management, transcription API calls)
- **Client-Side Storage**: Metadata files saved from client to leverage Firebase Auth tokens
- **In-Memory Cache**: Fast video listing with Firebase Storage as source of truth
- **No Separate Backend**: Leverages Next.js API routes and Server Actions for simplicity

### Authentication Flow

- **Client-Only Auth**: Firebase Authentication SDK runs on client side
- **Protected Routes**: Upload functionality blocked for unauthenticated users
- **Token Management**: Firebase handles token refresh automatically
- **Persistent Sessions**: Users stay logged in across browser sessions

### Storage Strategy

- **Videos**: Stored in `/videos/` folder with timestamp-prefixed filenames
- **Metadata**: JSON files in `/metadata/` folder containing video info and transcriptions
- **URL-Based Matching**: Metadata matched to videos by URL (handles ID mismatches)
- **Dual Priority**: Loads from both Firebase Storage (persistent) and memory (fast)

### Transcription Implementation

- **AssemblyAI Integration**: Server-side API calls to protect API keys
- **Speaker Diarization**: Automatic speaker identification enabled
- **Two-Phase Save**: Initial metadata saved on upload, updated with transcription when complete
- **Real-time Updates**: UI updates progressively (uploading → processing → completed)

## Security Notes

### API Keys

- ✅ **Firebase Config**: Public keys (prefixed with `NEXT_PUBLIC_`) - safe to expose
- ✅ **AssemblyAI Key**: Server-side only (no `NEXT_PUBLIC_` prefix) - never sent to client
- ✅ **Environment Files**: `.env.local` in `.gitignore` to prevent accidental commits

### Firebase Storage Rules

- **Read Access**: Public for all videos and metadata (shareable links)
- **Write Access**: Requires authentication (`request.auth != null`)
- **File Size Limit**: 250MB maximum per upload
- **File Type Validation**: Only video MIME types allowed (`video/*`)
- **Metadata Protection**: Only authenticated users can create/update metadata

### Authentication Security

- **Password Requirements**: Minimum 6 characters (Firebase default)
- **Email Verification**: Not enabled (can be added via Firebase Console)
- **Rate Limiting**: Handled by Firebase automatically
- **Token Expiration**: Automatic token refresh by Firebase SDK

## Limitations

### Current Limitations

1. **No Database**: Uses in-memory storage + Firebase Storage files (not suitable for production at scale)
2. **No User Ownership**: All videos visible to all users (no per-user filtering)
3. **No Video Deletion**: Delete functionality implemented but not exposed in UI
4. **Transcription Time**: Large videos may take 2-5 minutes to transcribe
5. **No Progress Persistence**: If server restarts during transcription, progress is lost
6. **No Retry Logic**: Failed transcriptions require manual re-upload

### Recommended Improvements for Production

- Use Firestore or PostgreSQL for metadata instead of JSON files
- Add user-specific video libraries and permissions
- Implement video sharing/collaboration features
- Add transcription queue with retry mechanism
- Enable video preview/thumbnail generation
- Add support for subtitle file export (SRT, VTT)
- Implement video editing/trimming features
- Add webhook support for transcription completion

## File Structure

```
closer-assesment/
├── app/
│   ├── actions/
│   │   ├── transcription.ts    # AssemblyAI integration
│   │   └── videos.ts           # Video metadata management
│   ├── api/                    # API routes (if needed)
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout with auth provider
│   └── page.tsx                # Main page with auth logic
├── components/
│   ├── AuthModal.tsx           # Sign in/sign up modal
│   ├── AuthProvider.tsx        # Auth context provider
│   ├── VideoList.tsx           # Video grid and modal viewer
│   └── VideoUpload.tsx         # Drag-drop upload component
├── lib/
│   ├── auth.ts                 # Firebase auth utilities
│   ├── firebase.ts             # Firebase initialization
│   ├── storage.ts              # Client-side storage utilities
│   └── types.ts                # TypeScript interfaces
├── .env.local                  # Environment variables (not in git)
├── .gitignore
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Troubleshooting

### Videos Not Showing After Upload

- Ensure Firebase Storage rules are published
- Check browser console for errors
- Verify you're signed in
- Refresh the page

### Permission Denied Errors

- Verify Storage rules match the ones above
- Ensure Email/Password auth is enabled in Firebase Console
- Check that you're signed in
- Clear browser cache and retry

### Transcription Fails

- Verify AssemblyAI API key is correct
- Check API key has sufficient credits
- Ensure video file is valid and not corrupted
- Check AssemblyAI dashboard for error details

### Upload Stuck at 0%

- Verify Firebase Storage bucket URL uses `.firebasestorage.app` domain
- Check Firebase Storage is enabled
- Ensure file is under 250MB and is a video format

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
