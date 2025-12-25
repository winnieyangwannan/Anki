
import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard } from "../types";

// Always use the recommended initialization format
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFlashcards = async (topic: string, count: number = 5): Promise<Partial<Flashcard>[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate ${count} flashcards for revision based on the following topic or content. 
    Make them challenging but concise.
    If the question is about writing code, provide a clear prompt and set "isCoding" to true.
    Include a detailed "explanation" for each card that breaks down the solution step-by-step.
    Topic/Content: "${topic}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: {
              type: Type.STRING,
              description: "The prompt or question on the front of the card.",
            },
            back: {
              type: Type.STRING,
              description: "The concise answer or solution.",
            },
            explanation: {
              type: Type.STRING,
              description: "A detailed breakdown or step-by-step explanation of the answer.",
            },
            isCoding: {
              type: Type.BOOLEAN,
              description: "Whether this card requires a code input field.",
            }
          },
          required: ["front", "back", "explanation", "isCoding"],
        },
      },
    },
  });

  try {
    // response.text is a property, not a method
    const text = response.text || "[]";
    const cards = JSON.parse(text);
    return cards;
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return [];
  }
};
