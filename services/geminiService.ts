
import { GoogleGenAI, Type } from "@google/genai";
import { PromptAnalysis } from "../types";
import { extractFramesFromVideo } from "./videoUtils";

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    mainPrompt: {
      type: Type.STRING,
      description: "The primary text prompt that would generate this video. Include subject, action, camera movement, lens type, and setting.",
    },
    negativePrompt: {
      type: Type.STRING,
      description: "Elements to exclude (e.g., 'blurry, low res, glitchy, morphing').",
    },
    artStyle: {
      type: Type.STRING,
      description: "The artistic style (e.g., 'Hyper-realistic', '3D Unreal Engine 5', 'Oil Painting', 'Cine-Kodak 16mm').",
    },
    cameraAngles: {
      type: Type.STRING,
      description: "Specific camera movement and lens info (e.g., '70mm anamorphic, tracking shot, low angle').",
    },
    lightingAndAtmosphere: {
      type: Type.STRING,
      description: "Lighting and mood (e.g., 'Volumetric lighting, noir, dramatic shadows').",
    },
    subjectDescription: {
      type: Type.STRING,
      description: "Detailed description of subjects and their specific physics/motion.",
    }
  },
  required: ["mainPrompt", "negativePrompt", "artStyle", "cameraAngles", "lightingAndAtmosphere", "subjectDescription"],
};

export const analyzeVideo = async (file: File, onStatusUpdate?: (status: string) => void): Promise<PromptAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = "gemini-3-flash-preview";

  try {
    if (onStatusUpdate) onStatusUpdate("Extracting keyframes...");
    
    // Extract frames locally to keep latency low
    const frames = await extractFramesFromVideo(file, (progress) => {
      if (onStatusUpdate) onStatusUpdate(`Extracting keyframes (${Math.round(progress)}%)...`);
    });

    if (onStatusUpdate) onStatusUpdate("Consulting Gemini Vision...");

    const imageParts = frames.map(frameData => ({
      inlineData: {
        data: frameData,
        mimeType: "image/jpeg"
      }
    }));

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          ...imageParts,
          {
            text: `You are an elite AI Video Prompt Engineer. 
            Analyze this sequence of ${frames.length} keyframes from a video.
            
            1. Reverse-engineer the EXACT prompt used to generate this (if it was AI) or the prompt needed to REPLICATE this (if it's real footage).
            2. Focus on: Cinematic lighting, specific lens types, motion vectors (how fast things move), and textures.
            3. Return the result in the requested JSON format.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI. Content might have been blocked.");
    }

    return JSON.parse(text) as PromptAnalysis;

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    if (error.message?.includes("401")) {
      throw new Error("API configuration error. Please ensure your project environment is correctly set up.");
    }
    
    throw new Error(error.message || "An error occurred during video analysis.");
  }
};
