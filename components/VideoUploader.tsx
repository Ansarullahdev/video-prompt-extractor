
import React, { useCallback, useState } from 'react';
import { Upload, FileVideo, AlertCircle, X, Youtube, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, SUPPORTED_MIME_TYPES } from '../constants';
import { VideoMetadata } from '../types';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  onClear: () => void;
  currentFile: VideoMetadata | null;
  isDisabled: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onFileSelect, onClear, currentFile, isDisabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeHint, setShowYoutubeHint] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndSetFile = (file: File) => {
    setError(null);
    setShowYoutubeHint(false);
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      setError(`Unsupported format. Please upload MP4, WebM, or MOV.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0] && !isDisabled) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisabled, onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0] && !isDisabled) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeUrl) {
      setShowYoutubeHint(true);
      setError(null);
    }
  };

  if (currentFile) {
    return (
      <div className="w-full bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center space-x-4 overflow-hidden">
          <div className="bg-blue-500/20 p-3 rounded-full text-blue-400 flex-shrink-0">
            <FileVideo size={32} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-200 truncate">{currentFile.name}</h3>
            <p className="text-sm text-slate-400">{(currentFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        </div>
        {!isDisabled && (
          <button 
            onClick={onClear}
            className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <X size={24} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* File Drop Zone */}
      <div 
        className={`relative group w-full h-56 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ease-in-out overflow-hidden
          ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-500'}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          onChange={handleChange}
          accept="video/mp4,video/webm,video/quicktime"
          disabled={isDisabled}
        />
        
        <div className="flex flex-col items-center space-y-3 text-center p-4 z-0 pointer-events-none">
          <div className={`p-4 rounded-full transition-transform duration-300 group-hover:scale-110 ${dragActive ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
            <Upload size={28} />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium text-slate-200">
              {dragActive ? "Drop video here" : "Drag & drop video"}
            </p>
            <p className="text-sm text-slate-400">
              MP4, MOV, WebM (Max 1GB)
            </p>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="flex items-center space-x-3 text-slate-600 text-xs uppercase font-semibold">
        <div className="flex-1 h-px bg-slate-800"></div>
        <span>OR</span>
        <div className="flex-1 h-px bg-slate-800"></div>
      </div>

      {/* YouTube / Link Input */}
      <form onSubmit={handleYoutubeSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <Youtube size={18} />
        </div>
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="Paste YouTube URL here"
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 placeholder-slate-500 transition-colors"
          disabled={isDisabled}
        />
        <button 
          type="submit"
          disabled={!youtubeUrl || isDisabled}
          className="absolute inset-y-0 right-0 pr-2 flex items-center"
        >
          <div className="bg-slate-700 hover:bg-slate-600 text-slate-300 p-1 rounded-md transition-colors">
            <ArrowRight size={16} />
          </div>
        </button>
      </form>

      {/* Feedback Messages */}
      {showYoutubeHint && (
        <div className="animate-in slide-in-from-top-2 duration-300 bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start space-x-3">
          <div className="text-blue-400 mt-0.5">
            <LinkIcon size={18} />
          </div>
          <div className="text-sm">
            <p className="text-blue-200 font-medium mb-1">Direct YouTube Download Unavailable</p>
            <p className="text-blue-300/80 leading-relaxed">
              Browser security prevents direct downloads from YouTube. Please use a tool to download the video file first, then upload it above.
            </p>
          </div>
          <button 
            onClick={() => setShowYoutubeHint(false)} 
            className="text-blue-400 hover:text-blue-200"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="animate-in slide-in-from-top-2 duration-300 flex items-center space-x-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm border border-red-400/20">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
