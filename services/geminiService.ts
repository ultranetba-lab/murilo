
import { GoogleGenAI, Type } from "@google/genai";

// Always use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeJustification = async (reason: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise a seguinte justificativa de atraso/ponto de um funcionário de um provedor de internet e sugira se ela é profissional e completa. Justificativa: "${reason}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            professionalScore: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            suggestedImprovement: { type: Type.STRING }
          },
          required: ["professionalScore", "feedback"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
