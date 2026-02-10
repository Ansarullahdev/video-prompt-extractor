
import { GoogleGenAI, Type } from "@google/genai";
import { PromptAnalysis } from "../types";
import { extractFramesFromVideo } from "./videoUtils";

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    mainPrompt: {
      type: Type.STRING,
      description: "A comprehensive generative AI prompt to replicate this video perfectly.",
    },
    negativePrompt: {
      type: Type.STRING,
      description: "Negative constraints to prevent artifacts or unwanted styles.",
    },
    artStyle: {
      type: Type.STRING,
      description: "The visual style, medium, and renderer (e.g., Octane Render, 35mm Film).",
    },
    cameraAngles: {
      type: Type.STRING,
      description: "Camera movement, focal length, and perspective details.",
    },
    lightingAndAtmosphere: {
      type: Type.STRING,
      description: "Lighting setup, time of day, and weather conditions.",
    },
    subjectDescription: {
      type: Type.STRING,
      description: "Detailed breakdown of the subjects, their actions, and textures.",
    }
  },
  required: ["mainPrompt", "negativePrompt", "artStyle", "cameraAngles", "lightingAndAtmosphere", "subjectDescription"],
};

export const analyzeVideo = async (file: File, onStatusUpdate?: (status: string) => void): Promise<PromptAnalysis> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing. Please add it to your project settings.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-flash-preview";

  try {
    if (onStatusUpdate) onStatusUpdate("Extracting frames...");
    
    const frames = await extractFramesFromVideo(file, (progress) => {
      if (onStatusUpdate) onStatusUpdate(`Analyzing frames (${Math.round(progress)}%)...`);
    });

    if (onStatusUpdate) onStatusUpdate("Reverse engineering prompt...");

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
            text: `Act as a world-class AI Video Prompt Engineer.
            I am providing a sequence of frames from a video. 
            Analyze the temporal consistency, lighting, camera movement, and artistic style.
            Generate a full, highly-detailed prompt that could be used in high-end video models like Sora, Runway, or Luma to recreate this exact aesthetic and motion.
            Return the analysis in the provided JSON schema.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Analysis failed to generate a response.");

    return JSON.parse(text) as PromptAnalysis;

  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("API Key")) {
      throw new Error("The API key is invalid or not correctly configured in the environment.");
    }
    throw new Error(error.message || "An unexpected error occurred during analysis.");
  }
};
