import "server-only";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY não encontrada. Confira o arquivo .env.local.",
  );
}

const ai = new GoogleGenAI({ apiKey });

export async function askGemini(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.35,
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("O Gemini retornou uma resposta vazia.");
  }

  return text;
}

export async function askGeminiText(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
    config: {
      temperature: 0.45,
    },
  });

  const text = response.text?.trim();

  if (!text) {
    throw new Error("O treinador retornou uma resposta vazia.");
  }

  return text;
}
