
import React, { useState, useEffect } from 'react';
import { VideoUploader } from './components/VideoUploader';
import { AnalysisResult } from './components/AnalysisResult';
import { VideoMetadata, PromptAnalysis, ProcessingState } from './types';
import { analyzeVideo } from './services/geminiService';
import { Wand2, Loader2, Sparkles, AlertTriangle, Layers, Film } from 'lucide-react';

function App() {
  const [currentFile, setCurrentFile] = useState<VideoMetadata | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [analysisResult, setAnalysisResult] = useState<PromptAnalysis | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");

  useEffect(() => {
    if (processingState.status !== 'analyzing') return;
    
    const messages = [
      "Running frame sequence analysis...",
      "Calculating motion vectors...",
      "Extracting cinematography metadata...",
      "Identifying artistic textures...",
      "Generating reverse prompt...",
    ];
    let i = 0;
    setLoadingMessage(messages[0]);
    
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingMessage(messages[i]);
    }, 2000);

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
    if (currentFile) URL.revokeObjectURL(currentFile.url);
    setCurrentFile(null);
    setAnalysisResult(null);
    setProcessingState({ status: 'idle' });
  };

  const startAnalysis = async (file: File) => {
    setProcessingState({ status: 'compressing' });
    try {
      const result = await analyzeVideo(file, (status) => {
        if (status.includes("Extracting")) setProcessingState({ status: 'compressing' });
        else setProcessingState({ status: 'analyzing' });
      });
      setAnalysisResult(result);
      setProcessingState({ status: 'complete' });
    } catch (error: any) {
      setProcessingState({ status: 'error', message: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-800 blur-[120px] rounded-full"></div>
      </div>

      <header className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-2xl shadow-2xl shadow-blue-500/20">
              <Film size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500">
                VID2PROMPT <span className="text-blue-500 text-xs align-top ml-1">v3</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Reverse Engineer AI</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
             <Sparkles size={12} className="animate-pulse" />
             <span>Gemini 3 Powered</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
                Break the code of <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Visual Synthesis.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                Upload a clip and our Vision AI will extract the architectural blueprints of the prompt used to create it.
              </p>
            </div>

            <VideoUploader 
              onFileSelect={handleFileSelect} 
              onClear={handleClear}
              currentFile={currentFile}
              isDisabled={processingState.status === 'analyzing' || processingState.status === 'compressing'}
            />
            
            {currentFile && (
              <div className="rounded-[2rem] overflow-hidden border border-slate-800 bg-black shadow-2xl aspect-video relative group animate-in zoom-in-95 duration-700">
                <video src={currentFile.url} controls className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="lg:col-span-7 min-h-[500px] relative">
            {processingState.status === 'idle' && !analysisResult && (
              <div className="h-full flex flex-col items-center justify-center p-12 border border-slate-800/50 rounded-[3rem] text-slate-600 bg-slate-900/20 backdrop-blur-sm border-dashed">
                <div className="p-8 bg-slate-800/30 rounded-[2rem] mb-8 border border-slate-700/30">
                  <Wand2 size={64} className="text-slate-500" />
                </div>
                <div className="text-center space-y-3">
                  <p className="text-2xl font-bold text-slate-300">Awaiting Input</p>
                  <p className="text-slate-500 max-w-xs mx-auto">Upload a video to begin the deep vision analysis process.</p>
                </div>
              </div>
            )}

            {(processingState.status === 'compressing' || processingState.status === 'analyzing') && (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-[3rem] border border-slate-800/50 animate-in fade-in duration-700 backdrop-blur-md">
                <div className="relative mb-12">
                  <div className="absolute inset-[-40px] bg-blue-500/10 blur-[60px] animate-pulse rounded-full"></div>
                  {processingState.status === 'compressing' ? (
                     <Layers size={80} className="text-blue-400 animate-bounce relative z-10" />
                  ) : (
                     <Loader2 size={80} className="text-blue-500 animate-spin relative z-10" />
                  )}
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                  {processingState.status === 'compressing' ? 'Extracting Frames' : 'Analyzing Vision'}
                </h3>
                <p className="mt-4 text-slate-400 text-center max-w-sm font-medium">
                  {processingState.status === 'compressing' 
                    ? 'Sampling video timestamps for optimal visual data...' 
                    : loadingMessage}
                </p>
                <div className="mt-8 w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            )}

            {processingState.status === 'error' && (
              <div className="bg-red-500/5 border border-red-500/20 p-12 rounded-[3rem] text-center flex flex-col items-center justify-center animate-in shake duration-500">
                <div className="bg-red-500/10 p-5 rounded-2xl text-red-500 mb-6">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-2xl font-bold text-red-200 mb-3">System Interruption</h3>
                <p className="text-red-300/60 max-w-md mb-10 font-medium leading-relaxed">{processingState.message}</p>
                <button 
                  onClick={() => { setProcessingState({ status: 'idle' }); setCurrentFile(null); }}
                  className="px-10 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-2xl shadow-red-500/40"
                >
                  Reset Module
                </button>
              </div>
            )}

            {analysisResult && <AnalysisResult result={analysisResult} />}
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-800/50 text-center">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">Optimized for Gemini Flash 3.0 Analysis</p>
      </footer>
      
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
