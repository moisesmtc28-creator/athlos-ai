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
    candidate.message?.includes('"code":429') === true ||
    candidate.message?.includes('"code":500') === true ||
    candidate.message?.includes('"code":502') === true ||
    candidate.message?.includes('"code":503') === true ||
    candidate.message?.includes('"code":504') === true
  );
}

export async function askGemini(prompt: string): Promise<string> {
  const ai = createGeminiClient();

  // Modelo principal + modelo reserva
  const models = [
    "gemini-flash-latest",
    "gemini-3.6-flash",
  ];

  for (const model of models) {
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(
          `Gemini: usando ${model} - tentativa ${attempt}/${maxAttempts}`,
        );

        const response = await ai.models.generateContent({
          model,
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

        console.log(`Gemini respondeu com sucesso usando ${model}.`);

        return text;
      } catch (error) {
        console.error(
          `Erro Gemini no modelo ${model} - tentativa ${attempt}/${maxAttempts}:`,
          error,
        );

        // Erros que não são temporários não devem ser repetidos.
        if (!isRetryableError(error)) {
          throw error;
        }

        // Aguarda antes da segunda tentativa.
        if (attempt < maxAttempts) {
          await sleep(2000 * attempt);
        }
      }
    }

    console.warn(
      `Modelo ${model} indisponível. Tentando modelo reserva...`,
    );
  }

  throw new Error(
    "Os modelos do Gemini estão temporariamente indisponíveis. Tente novamente em alguns minutos.",
  );
}
