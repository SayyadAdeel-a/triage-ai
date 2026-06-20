import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

const models = [
  groq('llama-3.1-8b-instant'),
  google('gemini-1.5-flash'),
  openrouter('meta-llama/llama-3.1-8b-instruct:free'),
  groq('llama-3.3-70b-versatile')
];

export async function generateTextWithFallback(options: { prompt: string; temperature?: number }): Promise<{ text: string }> {
  if (process.env.NODE_ENV === 'development') {
    return generateTextWithLocalFallback(options);
  }

  const proxyUrl = process.env.PROXY_URL || 'https://triage-ai.onrender.com';
  const proxyApiKey = process.env.PROXY_API_KEY;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (proxyApiKey) {
    headers['Authorization'] = `Bearer ${proxyApiKey}`;
  }

  const response = await fetch(`${proxyUrl}/api/categorize`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt: options.prompt })
  });

  if (!response.ok) {
    throw new Error(`Proxy server failed: ${response.statusText}`);
  }

  const data = await response.json();
  return { text: data.text };
}

export async function generateTextWithLocalFallback(options: { prompt: string; temperature?: number }): Promise<{ text: string }> {
  let lastError;
  for (const model of models) {
    try {
      const response = await generateText({
        model,
        prompt: options.prompt,
        temperature: options.temperature ?? 0.2,
      });
      return { text: response.text };
    } catch (e) {
      console.warn(`Model failed, falling back to next provider. Error:`, e);
      lastError = e;
    }
  }
  throw lastError;
}
