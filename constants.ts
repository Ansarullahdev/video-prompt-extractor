
export const MAX_FILE_SIZE_MB = 1000;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const SUPPORTED_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];

// Optimization: Number of frames to extract for analysis
// 10 frames provides enough temporal context for motion/angle detection
// while keeping the payload small (<5MB total) for instant analysis.
export const FRAME_SAMPLE_COUNT = 10; 

export const SAMPLE_PROMPT = "A cinematic drone shot flying over a futuristic cyberpunk city at night, neon lights reflecting in rain puddles, 8k resolution, highly detailed, photorealistic texture, volumetric fog.";
