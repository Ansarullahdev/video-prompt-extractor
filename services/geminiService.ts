
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
  // Use the pre-configured API key from the environment.
  // In Vercel, this must be set in the Project Settings -> Environment Variables.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = "gemini-3-flash-preview";

  try {
    if (onStatusUpdate) onStatusUpdate("Extracting frames...");
    
    const frames = await extractFramesFromVideo(file, (progress) => {
      if (onStatusUpdate) onStatusUpdate(`Sampling frames (${Math.round(progress)}%)...`);
    });

    if (onStatusUpdate) onStatusUpdate("Synthesizing prompt...");

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
            Analyze the provided visual frames and generate a comprehensive reverse-engineered prompt.
            The prompt should capture motion, lighting, style, and camera work perfectly.
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
    if (!text) throw new Error("Empty response from AI engine.");

    return JSON.parse(text) as PromptAnalysis;

  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Generic error handling to avoid exposing API key details if they are missing
    throw new Error(error.message || "Failed to analyze video. Please try again.");
  }
};
