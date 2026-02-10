
export interface PromptAnalysis {
  mainPrompt: string;
  negativePrompt: string;
  artStyle: string;
  cameraAngles: string;
  lightingAndAtmosphere: string;
  subjectDescription: string;
}

export interface ProcessingState {
  status: 'idle' | 'compressing' | 'uploading' | 'analyzing' | 'complete' | 'error';
  message?: string;
}

export interface VideoMetadata {
  name: string;
  size: number;
  type: string;
  url: string;
}
