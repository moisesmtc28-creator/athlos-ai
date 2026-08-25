import "server-only";
import { GoogleGenAI } from "@google/genai";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type AiResponseMode = "text" | "json";

async function askGroq(
  prompt: string,
  mode: AiResponseMode,
  model = "openai/gpt-oss-20b",
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
          model,
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

async function askCloudflare(
  prompt: string,
  mode: AiResponseMode,
): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("Cloudflare Workers AI não configurado.");
  }

  const model = "@cf/meta/llama-3.1-8b-instruct-fast";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: mode === "json" ? 6000 : 1200,
          ...(mode === "json" ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro Cloudflare ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const text = data?.result?.response;
    if (!text) throw new Error("Cloudflare Workers AI retornou resposta vazia.");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

async function askAI(
  prompt: string,
  mode: AiResponseMode,
): Promise<string> {
  const errors: string[] = [];

  // Dois modelos Groq gratuitos. Se um modelo estiver indisponível, tenta o outro.
  if (process.env.GROQ_API_KEY) {
    const groqModels = ["openai/gpt-oss-20b", "qwen/qwen3.6-27b"];
    for (const model of groqModels) {
      try {
        return await askGroq(prompt, mode, model);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Groq ${model}: ${message}`);
        console.error(`Erro Groq (${model}):`, error);
      }
    }
  } else {
    errors.push("GROQ_API_KEY não configurada.");
  }

  // Provedor gratuito independente do Groq.
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_AI_TOKEN) {
    try {
      return await askCloudflare(prompt, mode);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Cloudflare: ${message}`);
      console.error("Erro Cloudflare Workers AI:", error);
    }
  } else {
    errors.push("Cloudflare Workers AI não configurado.");
  }

  // Gemini fica apenas como último recurso, pois a cota gratuita pode acabar.
  if (process.env.GEMINI_API_KEY) {
    try {
      return await askGeminiBackup(prompt, mode);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Gemini: ${message}`);
      console.error("Erro Gemini:", error);
    }
  } else {
    errors.push("GEMINI_API_KEY não configurada.");
  }

  console.error("Todos os provedores de IA falharam:", errors.join(" | "));
  throw new Error("A IA está temporariamente indisponível. Tente novamente em alguns minutos.");
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
