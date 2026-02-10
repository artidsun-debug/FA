
import { GoogleGenAI, Type } from "@google/genai";
import { Property } from "../types";

/**
 * Utility to wait for a specific duration
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Robust wrapper for AI calls with exponential backoff retry logic
 * Target: 429 (Quota) and 5xx (Server) errors
 */
const callWithRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Extract status code from various possible error structures
      const status = error?.status || error?.error?.status || 
                    (error?.message?.includes('429') ? 429 : 
                     error?.message?.includes('500') ? 500 : 0);

      // Retry on Rate Limit (429) or Server Errors (5xx)
      if (status === 429 || (status >= 500 && status < 600)) {
        const waitTime = Math.pow(2, i) * 1500 + Math.random() * 1000;
        console.warn(`Gemini API Error ${status}. Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await delay(waitTime);
        continue;
      }
      
      // Re-throw if it's a client error (400, 401, 403)
      throw error;
    }
  }
  throw lastError;
};

export const queryPropertiesWithAI = async (properties: Property[], query: string) => {
  if (!process.env.API_KEY) return properties;

  const prompt = `
    You are an assistant for Firstarthur Property Management. 
    Below is a list of properties in JSON format.
    Process the user query: "${query}"
    Filter or sort the properties based on this query. Users might search by room number, building, floor, project name, or status.
    Return ONLY a JSON array of the matching property IDs.
    
    Data: ${JSON.stringify(properties.map(p => ({ 
      id: p.id, 
      name: p.name, 
      building: p.building,
      floor: p.floor,
      room: p.roomNumber,
      unit: p.unitNumber,
      status: p.status, 
      rent: p.rentAmount, 
      tenant: p.tenantName,
      repair: p.repairStatus
    })))}
  `;

  try {
    const result = await callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return response.text;
    });

    const resultIds = JSON.parse(result || '[]');
    return properties.filter(p => resultIds.includes(p.id));
  } catch (error) {
    console.error("AI Search Error:", error);
    return properties;
  }
};

export const getPropertyInsights = async (properties: Property[]) => {
  if (!process.env.API_KEY) return "ไม่สามารถดึงข้อมูลสรุปจาก AI ได้ในขณะนี้";

  const summary = properties.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as any);

  const prompt = `
    Summarize the following property portfolio status:
    - Total Properties: ${properties.length}
    - Status Counts: ${JSON.stringify(summary)}
    - Total Revenue Potential: ${properties.reduce((sum, p) => sum + p.rentAmount, 0)}
    Provide a short professional 2-sentence insight in Thai for the dashboard.
  `;

  try {
    const result = await callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text;
    });
    return result;
  } catch (error) {
    console.error("Insight Generation Error:", error);
    return "ไม่สามารถดึงข้อมูลสรุปจาก AI ได้ในขณะนี้ (โควตาการใช้งานอาจเต็ม)";
  }
};

/**
 * Processes a receipt image and extracts data using Gemini
 */
export const scanReceiptWithAI = async (base64Image: string) => {
  if (!process.env.API_KEY) throw new Error("API Key is missing");

  const prompt = "Extract details from this receipt image. Focus on the vendor name (title), the total amount, the date, and categorize it into one of these: REPAIR, UTILITY, COMMON_FEE, COMMISSION, or OTHER. Return ONLY a JSON object.";
  
  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(',')[1] || base64Image,
    },
  };

  try {
    const result = await callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Vendor or store name" },
              amount: { type: Type.NUMBER, description: "Total amount in numbers" },
              date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
              category: { type: Type.STRING, description: "Category of the expense" },
            },
            required: ["title", "amount", "date", "category"]
          }
        }
      });
      return response.text;
    });

    return JSON.parse(result || "{}");
  } catch (error) {
    console.error("Receipt Scan Error:", error);
    throw error;
  }
};
