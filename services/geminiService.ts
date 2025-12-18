import { GoogleGenAI } from "@google/genai";
import { SourceLanguage } from "../types";
import { fileToBase64, extractTextFromPdf } from "../utils/fileHelpers";

const GEMINI_API_KEY = process.env.API_KEY || '';

// Initialize client securely
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are a highly skilled translator specializing in "Casual Malayalam". 
Your goal is to translate the input text (which could be English or Manglish) into natural, spoken-style Malayalam (Casual Malayalam).
Avoid formal, bookish, or "Achadi" Malayalam. Use the kind of language friends use when chatting.
If the input is technical, keep the technical terms in English or transliterated Malayalam if that's how people naturally speak.
`;

export const translateText = async (
  text: string, 
  sourceLang: SourceLanguage
): Promise<string> => {
  try {
    const prompt = `Translate the following ${sourceLang} text to Casual Malayalam:\n\n"${text}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 8192, // Increased for longer translations
      }
    });

    return response.text || "Could not generate translation.";
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate text. Please try again.");
  }
};

export const translatePdf = async (
  file: File,
  sourceLang: SourceLanguage
): Promise<string> => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("API Key is missing.");
    }

    // Strategy 1: Attempt to extract text first.
    // This solves issues with "Long PDFs" that are text-heavy (e.g., contracts, stories)
    // by bypassing the image processing payload limits and latencies.
    let textContent = '';
    try {
        textContent = await extractTextFromPdf(file);
    } catch (e) {
        console.warn("PDF Text extraction failed or file is image-only, falling back to vision.", e);
    }

    // If we successfully extracted substantial text (> 50 chars), treat it as a text translation
    if (textContent && textContent.length > 50) {
        // Truncate if insanely huge (Gemini Flash limit is ~1M tokens, so ~4MB text is fine)
        // Check text length approx. 1 char ~ 1 byte. 
        // We handle up to large amounts, but let's be safe against browser hang.
        
        const prompt = `Translate the content of this document from ${sourceLang} to Casual Malayalam. Maintain the original structure where possible.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${prompt}\n\n--- Document Content ---\n${textContent}`,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            maxOutputTokens: 8192,
          }
        });

        return response.text || "Could not generate translation from extracted PDF text.";
    }

    // Strategy 2: Fallback to Vision/Multimodal (for scanned PDFs or extraction failure)
    // Note: Inline data has a size limit (~20MB total payload).
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        throw new Error(`File is too large for image-based translation (Max ${MAX_SIZE_MB}MB for scanned PDFs). Try a text-based PDF.`);
    }

    const base64Pdf = await fileToBase64(file);
    const prompt = `Translate the content of this PDF from ${sourceLang} to Casual Malayalam. Maintain the original structure where possible, but ensure the tone is conversational.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Pdf
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 8192,
      }
    });

    return response.text || "Could not generate translation from PDF.";

  } catch (error: any) {
    console.error("PDF Translation error:", error);
    if (error.message && error.message.includes("too large")) {
        throw error;
    }
    throw new Error("Failed to translate PDF. " + (error.message || ""));
  }
};