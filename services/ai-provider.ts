import "server-only";
import { GoogleGenAI } from "@google/genai";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type AiResponseMode = "text" | "json";

async function askGroq(
  prompt: string,
  mode: AiResponseMode,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY não encontrada no ambiente do servidor.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.4,
          ...(mode === "json"
            ? { response_format: { type: "json_object" } }
            : {}),
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro Groq ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("A Groq retornou uma resposta vazia.");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não encontrada no ambiente do servidor.");
  }

  return new GoogleGenAI({ apiKey });
}

async function askGeminiBackup(
  prompt: string,
  mode: AiResponseMode,
): Promise<string> {
  const ai = createGeminiClient();

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
    config: {
      ...(mode === "json"
        ? { responseMimeType: "application/json" }
        : {}),
      temperature: 0.4,
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("O Gemini retornou uma resposta vazia.");
  }

  return text;
}

async function askAI(
  prompt: string,
  mode: AiResponseMode,
): Promise<string> {
  const errors: string[] = [];

  if (process.env.GROQ_API_KEY) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await askGroq(prompt, mode);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Groq ${attempt}/2: ${message}`);
        console.error(`Erro Groq - tentativa ${attempt}/2:`, error);

        if (attempt < 2) await sleep(1200);
      }
    }
  } else {
    errors.push("GROQ_API_KEY não configurada.");
  }

  if (process.env.GEMINI_API_KEY) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await askGeminiBackup(prompt, mode);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Gemini ${attempt}/2: ${message}`);
        console.error(`Erro Gemini - tentativa ${attempt}/2:`, error);

        if (attempt < 2) await sleep(1600);
      }
    }
  } else {
    errors.push("GEMINI_API_KEY não configurada.");
  }

  throw new Error(
    `Nenhum provedor de IA respondeu. ${errors.join(" | ")}`,
  );
}

// Mantém o nome usado pelas rotas existentes de geração de plano.
export async function askGemini(prompt: string): Promise<string> {
  return askAI(prompt, "json");
}

// O chat precisa de texto livre. Antes ele também forçava JSON, o que quebrava
// a conversa em alguns provedores.
export async function askCoachAI(prompt: string): Promise<string> {
  return askAI(prompt, "text");
}
