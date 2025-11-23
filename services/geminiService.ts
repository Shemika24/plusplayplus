import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

// This file assumes that process.env.API_KEY is available in the execution environment.
const API_KEY = process.env.API_KEY || '';

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

export const generateAITask = async (): Promise<Omit<Task, 'id' | 'status' | 'image'>> => {
  if (!API_KEY) {
    throw new Error("API Key is not configured.");
  }
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Generate a unique and creative task for a user of a rewards app. The task should be something that can be done online in a few minutes. Provide a name, description, estimated time in seconds, and a reward in points.',
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'The name of the task.' },
            description: { type: Type.STRING, description: 'A brief description of the task.' },
            time: { type: Type.NUMBER, description: 'Estimated time to complete in seconds.' },
            reward: { type: Type.NUMBER, description: 'The reward in points.' },
          },
          required: ['name', 'description', 'time', 'reward'],
        },
      },
    });

    const jsonText = response.text.trim();
    const taskData = JSON.parse(jsonText);
    
    // Validate the received data structure
    if (typeof taskData.name === 'string' && typeof taskData.description === 'string' && typeof taskData.time === 'number' && typeof taskData.reward === 'number') {
        return taskData;
    } else {
        throw new Error("Invalid data structure received from Gemini API.");
    }

  } catch (error) {
    console.error("Error generating task with Gemini AI:", error);
    throw new Error("Failed to generate a new task. Please try again later.");
  }
};