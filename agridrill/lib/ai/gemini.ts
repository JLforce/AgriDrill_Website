import { GoogleGenAI } from "@google/genai";

const gemini = new GoogleGenAI({});

export const GEMINI_MODEL = "gemini-3.5-flash-lite";

export default gemini;