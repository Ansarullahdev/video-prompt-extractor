import { FRAME_SAMPLE_COUNT } from "../constants";

/**
 * Extracts a sequence of frames from a video file as base64 JPEG images.
 * This allows us to process large videos instantly without uploading the full file.
 */
export const extractFramesFromVideo = async (
  videoFile: File, 
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: string[] = [];
    const videoUrl = URL.createObjectURL(videoFile);

    if (!ctx) {
      URL.revokeObjectURL(videoUrl);
      reject(new Error("Browser does not support canvas context"));
      return;
    }

    video.autoplay = false;
    video.muted = true;
    video.src = videoUrl;

    // Load metadata to get duration and dimensions
    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      
      // Calculate timestamps for equal intervals
      // We avoid the very end to prevent black frames
      const interval = duration / (FRAME_SAMPLE_COUNT + 1);
      
      try {
        for (let i = 1; i <= FRAME_SAMPLE_COUNT; i++) {
          const timestamp = interval * i;
          
          // Seek to time
          video.currentTime = timestamp;
          
          // Wait for seek to complete
          await new Promise<void>((seekResolve) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              seekResolve();
            };
            video.addEventListener('seeked', onSeeked);
          });

          // Draw frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to base64 JPEG (0.7 quality is good balance)
          const base64Data = canvas.toDataURL('image/jpeg', 0.7);
          // Strip the prefix "data:image/jpeg;base64,"
          frames.push(base64Data.split(',')[1]);

          if (onProgress) {
            onProgress((i / FRAME_SAMPLE_COUNT) * 100);
          }
        }
        
        // Cleanup
        URL.revokeObjectURL(videoUrl);
        resolve(frames);
        
      } catch (err) {
        URL.revokeObjectURL(videoUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error("Failed to load video file"));
    };
  });
};
