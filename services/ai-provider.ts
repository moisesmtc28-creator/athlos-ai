import "server-only";
import { GoogleGenAI } from "@google/genai";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ========================================
// GROQ - IA PRINCIPAL
// ========================================

async function askGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY não encontrada.");
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.4,
        response_format: {
          type: "json_object",
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Erro Groq ${response.status}: ${errorText}`,
    );
  }

  const data = await response.json();

  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("A Groq retornou uma resposta vazia.");
  }

  return text;
}

// ========================================
// GEMINI - IA RESERVA
// ========================================

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não encontrada.");
  }

  return new GoogleGenAI({ apiKey });
}

async function askGeminiBackup(prompt: string): Promise<string> {
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

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

export async function askGemini(prompt: string): Promise<string> {

  // ----------------------------------------
  // 1 - TENTA GROQ
  // ----------------------------------------

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(
        `Groq - tentativa ${attempt}/2`,
      );

      const answer = await askGroq(prompt);

      console.log(
        "Resposta gerada com sucesso pela Groq.",
      );

      return answer;

    } catch (error) {

      console.error(
        `Erro Groq - tentativa ${attempt}/2:`,
        error,
      );

      if (attempt < 2) {
        await sleep(1500);
      }
    }
  }

  // ----------------------------------------
  // 2 - FALLBACK PARA GEMINI
  // ----------------------------------------

  console.warn(
    "Groq indisponível. Tentando Gemini como reserva.",
  );

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {

      console.log(
        `Gemini reserva - tentativa ${attempt}/2`,
      );

      const answer = await askGeminiBackup(prompt);

      console.log(
        "Resposta gerada com sucesso pelo Gemini.",
      );

      return answer;

    } catch (error) {

      console.error(
        `Erro Gemini reserva - tentativa ${attempt}/2:`,
        error,
      );

      if (attempt < 2) {
        await sleep(2000);
      }
    }
  }

  throw new Error(
    "Os serviços de inteligência artificial estão temporariamente indisponíveis.",
  );
}
