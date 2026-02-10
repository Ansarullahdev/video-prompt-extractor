import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PromptAnalysis } from "../types";
import { extractFramesFromVideo } from "./videoUtils";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    mainPrompt: {
      type: Type.STRING,
      description: "The primary text prompt that would generate this video. Be extremely descriptive, covering subject, action, camera movement, and setting in full detail.",
    },
    negativePrompt: {
      type: Type.STRING,
      description: "Elements to exclude to maintain quality (e.g., 'blurry, distorted, low quality, text, watermark').",
    },
    artStyle: {
      type: Type.STRING,
      description: "The artistic style (e.g., 'Photorealistic', '3D Animation', 'Cinematic', 'Anime').",
    },
    cameraAngles: {
      type: Type.STRING,
      description: "Description of camera movement inferred from the frame sequence (e.g., 'Drone shot', 'Close up', 'Tracking shot', 'FPV').",
    },
    lightingAndAtmosphere: {
      type: Type.STRING,
      description: "Description of lighting conditions and mood (e.g., 'Golden hour', 'Cyberpunk neon', 'Natural lighting').",
    },
    subjectDescription: {
      type: Type.STRING,
      description: "Detailed description of the main subject(s) and their specific actions across the frames.",
    }
  },
  required: ["mainPrompt", "negativePrompt", "artStyle", "cameraAngles", "lightingAndAtmosphere", "subjectDescription"],
};

export const analyzeVideo = async (file: File, onStatusUpdate?: (status: string) => void): Promise<PromptAnalysis> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = "gemini-2.5-flash";

  try {
    // Phase 1: Client-Side Processing (Fast)
    if (onStatusUpdate) onStatusUpdate("Extracting keyframes...");
    
    // Instead of uploading the whole video, we extract 10 keyframes.
    // This reduces payload from ~500MB to ~2MB and removes server processing wait time.
    const frames = await extractFramesFromVideo(file, (progress) => {
      if (onStatusUpdate) onStatusUpdate(`Extracting keyframes (${Math.round(progress)}%)...`);
    });

    if (onStatusUpdate) onStatusUpdate("Analyzing visual sequence...");

    // Create image parts for Gemini
    const imageParts = frames.map(frameData => ({
      inlineData: {
        data: frameData,
        mimeType: "image/jpeg"
      }
    }));

    // Phase 2: Inference
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          ...imageParts,
          {
            text: `You are an expert AI Video Prompt Engineer. 
            
            I have provided a sequence of ${frames.length} keyframes extracted from a continuous video at equal intervals.
            
            Analyze these frames to reverse-engineer the EXACT prompt used to generate this video.
            
            1. **Infer Motion**: Look at the changes between frames to determine subject action and camera movement (e.g., if the background shifts left, it's a truck right or pan right).
            2. **Detail**: Describe the subject, lighting, textures, and style in extreme detail.
            3. **Completeness**: Do not miss any visual element.
            
            Return the result strictly as a valid JSON object matching the schema.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response. The content might have triggered safety filters.");
    }

    const cleanedText = text.replace(/```json\s*|\s*```/g, "").trim();

    try {
      return JSON.parse(cleanedText) as PromptAnalysis;
    } catch (parseError) {
      console.error("JSON Parse failed:", parseError);
      throw new Error("Failed to process the AI response. Please try again.");
    }

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    
    const msg = (error.message || "").toLowerCase();
    
    if (msg.includes("400")) throw new Error("The video frames could not be processed.");
    if (msg.includes("401") || msg.includes("unauthenticated")) throw new Error("Invalid API Key. Please check your settings.");
    if (msg.includes("413")) throw new Error("File payload too large. Try a shorter video.");
    if (msg.includes("429")) throw new Error("Too many requests. Please wait a moment.");
    if (msg.includes("safety")) throw new Error("The video content was blocked by safety settings.");
    
    throw error;
  }
};
