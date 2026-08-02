import "server-only";
import { GoogleGenAI } from "@google/genai";

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não encontrada. Configure a variável no ambiente do servidor.",
    );
  }

  return new GoogleGenAI({ apiKey });
}

export async function askGemini(prompt: string): Promise<string> {
  const ai = createGeminiClient();

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("O Gemini retornou uma resposta vazia.");
  }

  return text;
}
