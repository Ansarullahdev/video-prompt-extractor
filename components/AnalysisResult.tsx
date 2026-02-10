import React, { useState } from 'react';
import { PromptAnalysis } from '../types';
import { Copy, Check, Camera, Palette, Sun, Zap } from 'lucide-react';

interface AnalysisResultProps {
  result: PromptAnalysis;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Main Prompt Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="fill-current text-yellow-300" size={20} />
            Reverse Engineered Prompt
          </h2>
          <button
            onClick={() => copyToClipboard(result.mainPrompt, 'main')}
            className="flex items-center space-x-1 text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm"
          >
            {copied === 'main' ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied === 'main' ? 'Copied' : 'Copy Prompt'}</span>
          </button>
        </div>
        <div className="p-6">
          <p className="text-lg text-slate-200 leading-relaxed font-light font-mono">
            {result.mainPrompt}
          </p>
        </div>
      </div>

      {/* Grid for details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Art Style */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
          <div className="flex items-center space-x-2 mb-3 text-purple-400">
            <Palette size={20} />
            <h3 className="font-semibold uppercase text-xs tracking-wider">Art Style</h3>
          </div>
          <p className="text-slate-300">{result.artStyle}</p>
        </div>

        {/* Camera */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
          <div className="flex items-center space-x-2 mb-3 text-emerald-400">
            <Camera size={20} />
            <h3 className="font-semibold uppercase text-xs tracking-wider">Camera Angles</h3>
          </div>
          <p className="text-slate-300">{result.cameraAngles}</p>
        </div>

        {/* Lighting */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
          <div className="flex items-center space-x-2 mb-3 text-amber-400">
            <Sun size={20} />
            <h3 className="font-semibold uppercase text-xs tracking-wider">Lighting & Atmosphere</h3>
          </div>
          <p className="text-slate-300">{result.lightingAndAtmosphere}</p>
        </div>

        {/* Negative Prompt */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors relative group">
           <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2 mb-3 text-red-400">
                <span className="font-bold text-lg">-</span>
                <h3 className="font-semibold uppercase text-xs tracking-wider">Negative Prompt</h3>
            </div>
             <button
                onClick={() => copyToClipboard(result.negativePrompt, 'neg')}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white"
            >
                {copied === 'neg' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-slate-400 text-sm italic">{result.negativePrompt}</p>
        </div>

      </div>

        {/* Subject Detail */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-slate-400 text-xs font-semibold uppercase mb-2">Subject Details</h3>
            <p className="text-slate-300 text-sm">{result.subjectDescription}</p>
        </div>
    </div>
  );
};