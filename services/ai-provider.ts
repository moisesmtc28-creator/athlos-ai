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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const candidate = error as {
    status?: number;
    message?: string;
  };

  return (
    candidate.status === 429 ||
    candidate.status === 500 ||
    candidate.status === 502 ||
    candidate.status === 503 ||
    candidate.status === 504 ||
    candidate.message?.includes('"code":503') === true ||
    candidate.message?.includes('"code":429') === true
  );
}

export async function askGemini(prompt: string): Promise<string> {
  const ai = createGeminiClient();

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
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
    } catch (error) {
      console.error(
        `Erro Gemini - tentativa ${attempt}/${maxAttempts}:`,
        error,
      );

      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }

      // Espera progressivamente antes de tentar novamente:
      // 2 segundos -> 4 segundos
      await sleep(2000 * attempt);
    }
  }

  throw new Error("Não foi possível obter resposta do Gemini.");
}
