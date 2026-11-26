import { GoogleGenAI } from "@google/genai";

/** Text generation model for questions and explanations. */
export const GENERATION_MODEL = "gemini-3.8-flash";

let client: GoogleGenAI | undefined;

/** Lazily created so builds and pages that never call Gemini don't need the key. */
export function getGeminiClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}
