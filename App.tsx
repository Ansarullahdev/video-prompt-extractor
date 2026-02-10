
import React, { useState, useEffect } from 'react';
import { VideoUploader } from './components/VideoUploader';
import { AnalysisResult } from './components/AnalysisResult';
import { VideoMetadata, PromptAnalysis, ProcessingState } from './types';
import { analyzeVideo } from './services/geminiService';
import { Wand2, Loader2, Sparkles, AlertTriangle, Film, RotateCcw } from 'lucide-react';

function App() {
  const [currentFile, setCurrentFile] = useState<VideoMetadata | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [analysisResult, setAnalysisResult] = useState<PromptAnalysis | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");

  useEffect(() => {
    if (processingState.status !== 'analyzing') return;
    
    const messages = [
      "Analyzing temporal flow...",
      "Mapping camera trajectory...",
      "Deconstructing art style...",
      "Extracting texture descriptors...",
      "Synthesizing final prompt...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingMessage(messages[i]);
    }, 2500);

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
    startAnalysis(file);
  };

  const handleClear = () => {
    if (currentFile) URL.revokeObjectURL(currentFile.url);
    setCurrentFile(null);
    setAnalysisResult(null);
    setProcessingState({ status: 'idle' });
  };

  const startAnalysis = async (file: File) => {
    setProcessingState({ status: 'analyzing' });
    try {
      const result = await analyzeVideo(file, (status) => {
        setLoadingMessage(status);
      });
      setAnalysisResult(result);
      setProcessingState({ status: 'complete' });
    } catch (error: any) {
      console.error("Analysis Failed:", error);
      setProcessingState({ 
        status: 'error', 
        message: error.message || "An unexpected error occurred. Please check your connection."
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-800 blur-[120px] rounded-full"></div>
      </div>

      <header className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
              <Film size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter">
                VID2PROMPT <span className="text-blue-500 text-xs align-top ml-1">AI</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Vision Analysis Suite</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
             <Sparkles size={12} className="animate-pulse" />
             <span>Active Intelligence</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tight text-white leading-tight">
                Reverse Engineer <br/><span className="text-blue-400">Any Visual.</span>
              </h2>
              <p className="text-slate-400 font-medium">
                Upload a video to extract the precise prompt engineering required to replicate its look and feel.
              </p>
            </div>

            <VideoUploader 
              onFileSelect={handleFileSelect} 
              onClear={handleClear}
              currentFile={currentFile}
              isDisabled={processingState.status === 'analyzing'}
            />
            
            {currentFile && (
              <div className="rounded-3xl overflow-hidden border border-slate-800 bg-black shadow-2xl aspect-video relative animate-in zoom-in-95 duration-500">
                <video src={currentFile.url} controls className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="lg:col-span-7 min-h-[400px]">
            {processingState.status === 'idle' && !analysisResult && (
              <div className="h-full flex flex-col items-center justify-center p-12 border border-slate-800/50 rounded-[3rem] bg-slate-900/20 backdrop-blur-sm border-dashed">
                <Wand2 size={48} className="text-slate-600 mb-6" />
                <p className="text-xl font-bold text-slate-400">Ready for Analysis</p>
                <p className="text-slate-600 text-sm mt-2">Choose a file to begin the extraction process.</p>
              </div>
            )}

            {processingState.status === 'analyzing' && (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-[3rem] border border-slate-800/50 backdrop-blur-md">
                <div className="relative mb-10">
                  <div className="absolute inset-[-30px] bg-blue-500/10 blur-3xl animate-pulse rounded-full"></div>
                  <Loader2 size={64} className="text-blue-500 animate-spin relative z-10" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-widest text-center">{loadingMessage}</h3>
                <div className="mt-8 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-[loading_1.5s_infinite]"></div>
                </div>
              </div>
            )}

            {processingState.status === 'error' && (
              <div className="bg-red-950/20 border border-red-500/30 p-12 rounded-[3rem] text-center flex flex-col items-center justify-center">
                <div className="bg-red-500/20 p-4 rounded-2xl text-red-500 mb-6">
                  <AlertTriangle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-red-100 mb-2">System Interruption</h3>
                <p className="text-red-200/60 max-w-sm mb-8 font-medium">
                  {processingState.message}
                </p>
                <button 
                  onClick={handleClear}
                  className="mt-8 flex items-center space-x-2 px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-xl shadow-red-600/20"
                >
                  <RotateCcw size={18} />
                  <span>Restart Session</span>
                </button>
              </div>
            )}

            {analysisResult && <AnalysisResult result={analysisResult} />}
          </div>
        </div>
      </main>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

export default App;
