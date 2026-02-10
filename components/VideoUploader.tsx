
import React, { useCallback, useState } from 'react';
import { Upload, FileVideo, AlertCircle, X, Youtube, Link as LinkIcon, ArrowRight, PlayCircle } from 'lucide-react';
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
  const [url, setUrl] = useState('');
  const [isUrlLoading, setIsUrlLoading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      setError(`Unsupported format. Use MP4, WebM, or MOV.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File too large (Max ${MAX_FILE_SIZE_MB}MB).`);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0] && !isDisabled) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, [isDisabled, onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && !isDisabled) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setError("Direct YouTube scraping is restricted by CORS. Please upload the .mp4 file directly.");
      return;
    }

    setIsUrlLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], "remote-video.mp4", { type: blob.type });
      validateAndSetFile(file);
    } catch (err) {
      setError("Could not fetch the video from this URL. Ensure it's a direct link to a video file.");
    } finally {
      setIsUrlLoading(false);
    }
  };

  if (currentFile) {
    return (
      <div className="w-full bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center space-x-4 overflow-hidden">
          <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400 flex-shrink-0 border border-blue-500/20">
            <PlayCircle size={32} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-100 truncate">{currentFile.name}</h3>
            <p className="text-sm text-slate-400">{(currentFile.size / (1024 * 1024)).toFixed(2)} MB • Ready</p>
          </div>
        </div>
        {!isDisabled && (
          <button onClick={onClear} className="p-2 hover:bg-slate-700/50 rounded-full text-slate-500 hover:text-red-400 transition-all">
            <X size={20} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div 
        className={`relative group w-full h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-500 ease-out
          ${dragActive ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/60 hover:border-slate-500'}
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
          accept="video/*"
          disabled={isDisabled}
        />
        
        <div className="flex flex-col items-center space-y-4 text-center p-8 z-0">
          <div className={`p-5 rounded-2xl transition-all duration-500 group-hover:rotate-6 ${dragActive ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'}`}>
            <Upload size={32} />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold text-slate-200">
              {dragActive ? "Release to Analyze" : "Upload Video Source"}
            </p>
            <p className="text-sm text-slate-500 max-w-[240px]">
              MP4, MOV, or WebM. <br/>Drag files here or click to browse.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 h-px bg-slate-800/50"></div>
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">or analyze via link</span>
        <div className="flex-1 h-px bg-slate-800/50"></div>
      </div>

      <form onSubmit={handleUrlSubmit} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
          <LinkIcon size={18} />
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste direct video URL..."
          className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none block pl-12 pr-14 py-4 placeholder-slate-600 transition-all backdrop-blur-sm"
          disabled={isDisabled || isUrlLoading}
        />
        <button 
          type="submit"
          disabled={!url || isDisabled || isUrlLoading}
          className="absolute inset-y-0 right-2 my-auto h-10 w-10 flex items-center justify-center bg-blue-600 hover:bg-blue-50 text-white hover:text-blue-600 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-blue-600 disabled:hover:text-white"
        >
          <ArrowRight size={20} className={isUrlLoading ? 'animate-pulse' : ''} />
        </button>
      </form>

      {error && (
        <div className="animate-in slide-in-from-top-2 duration-300 flex items-start space-x-3 text-red-400 bg-red-400/10 p-4 rounded-2xl text-sm border border-red-400/20">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}
    </div>
  );
};
