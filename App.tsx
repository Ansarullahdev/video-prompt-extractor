
import React, { useState, useEffect } from 'react';
import { VideoUploader } from './components/VideoUploader';
import { AnalysisResult } from './components/AnalysisResult';
import { VideoMetadata, PromptAnalysis, ProcessingState } from './types';
import { analyzeVideo } from './services/geminiService';
import { Wand2, Loader2, Sparkles, AlertTriangle, Layers } from 'lucide-react';

function App() {
  const [currentFile, setCurrentFile] = useState<VideoMetadata | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [analysisResult, setAnalysisResult] = useState<PromptAnalysis | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");

  // Cycle loading messages
  useEffect(() => {
    if (processingState.status !== 'analyzing') return;
    
    const messages = [
      "Analyzing frame sequence...",
      "Inferring camera motion...",
      "Identifying art style...",
      "Detecting lighting patterns...",
      "Reverse-engineering prompt...",
    ];
    let i = 0;
    setLoadingMessage(messages[0]);
    
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingMessage(messages[i]);
    }, 1500); // Faster cycle for faster process

    return () => clearInterval(interval);
  }, [processingState.status]);

  const handleFileSelect = (file: File) => {
    const videoData: VideoMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    };
    setCurrentFile(videoData);
    setAnalysisResult(null);
    setProcessingState({ status: 'idle' });
    
    startAnalysis(file);
  };

  const handleClear = () => {
    if (currentFile) {
      URL.revokeObjectURL(currentFile.url);
    }
    setCurrentFile(null);
    setAnalysisResult(null);
    setProcessingState({ status: 'idle' });
  };

  const startAnalysis = async (file: File) => {
    // We now go straight to 'compressing' (extracting frames) then 'analyzing'
    // 'uploading' state is effectively removed or instant
    setProcessingState({ status: 'compressing' });
    
    try {
      const result = await analyzeVideo(file, (status) => {
        if (status.includes("Extracting")) setProcessingState({ status: 'compressing' });
        else setProcessingState({ status: 'analyzing' });
      });
      
      setAnalysisResult(result);
      setProcessingState({ status: 'complete' });
    } catch (error: any) {
      console.error(error);
      setProcessingState({ 
        status: 'error', 
        message: error.message || "Failed to analyze video. Please try again." 
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-blue-500/30 font-sans">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Sparkles size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Vid2Prompt
            </h1>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-800">
             <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
             <span>Fast Vision Analysis</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Intro */}
        <div className="text-center mb-10 space-y-3">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Instant Video to <span className="text-blue-500">Prompt</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload any video size. We extract intelligent keyframes to reverse-engineer the prompt in seconds.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Upload & Preview */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <VideoUploader 
              onFileSelect={handleFileSelect} 
              onClear={handleClear}
              currentFile={currentFile}
              isDisabled={processingState.status === 'analyzing' || processingState.status === 'compressing'}
            />
            
            {/* Video Preview */}
            {currentFile && (
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-black shadow-2xl aspect-video relative group animate-in fade-in zoom-in-95 duration-500">
                <video 
                  src={currentFile.url} 
                  controls 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Right Column: Results & Status */}
          <div className="lg:col-span-7 min-h-[400px]">
            
            {/* Idle State */}
            {processingState.status === 'idle' && !analysisResult && (
              <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-2xl text-slate-600 space-y-6 bg-slate-900/50 min-h-[400px]">
                <div className="p-6 bg-slate-800 rounded-full opacity-50">
                  <Wand2 size={40} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg font-medium text-slate-400">Ready to Analyze</p>
                  <p className="text-sm text-slate-500">Upload a video to see the magic happen</p>
                </div>
              </div>
            )}

            {/* Processing/Analyzing States */}
            {(processingState.status === 'compressing' || processingState.status === 'analyzing' || processingState.status === 'uploading') && (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-800/30 rounded-2xl border border-slate-800 min-h-[400px] animate-in fade-in duration-500">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                  {processingState.status === 'compressing' ? (
                     <Layers size={56} className="text-blue-400 animate-bounce relative z-10" />
                  ) : (
                     <Loader2 size={56} className="text-blue-500 animate-spin relative z-10" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-white tracking-wide">
                  {processingState.status === 'compressing' ? 'Extracting Keyframes...' : loadingMessage}
                </h3>
                <p className="mt-3 text-slate-400 text-center max-w-sm text-sm">
                  {processingState.status === 'compressing' 
                    ? 'Scanning video for visual data points locally...' 
                    : 'Sending optimized frames to Gemini Vision...'}
                </p>
              </div>
            )}

            {/* Error State */}
            {processingState.status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center min-h-[200px] flex flex-col items-center justify-center animate-in shake duration-300">
                <div className="bg-red-500/20 p-3 rounded-full text-red-400 mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-semibold text-red-200 mb-2">Analysis Failed</h3>
                <p className="text-red-300/80 max-w-md mb-6">{processingState.message}</p>
                <button 
                  onClick={() => {
                    setProcessingState({ status: 'idle' });
                    setCurrentFile(null); 
                  }}
                  className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-red-500/20"
                >
                  Try Different Video
                </button>
              </div>
            )}

            {/* Success State */}
            {analysisResult && <AnalysisResult result={analysisResult} />}
            
          </div>
        </div>
      </main>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default App;
