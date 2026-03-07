import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildIdentifyPrompt } from '../prompts/identifyItem';

/**
 * identifyItem
 * Takes a base64 encoded image frame and sends it to Gemini 2.0 Flash.
 * 
 * @param {string} base64Frame - The raw base64 string from canvas.toDataURL (e.g., 'data:image/jpeg;base64,...')
 * @returns {Promise<Object>} The parsed JSON result { name, item_type, distinguishing_features, confidence }
 */
export async function identifyItem(base64Frame) {
  // Use environment variable instead of local storage
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please configure it in your .env file.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-2.0-flash as it's the fastest and best suited for multimodal rapid tasks
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Strip the prefix from the base64 string
  const base64Data = base64Frame.replace(/^data:image\/(png|jpeg|webp);base64,/, '');

  const prompt = buildIdentifyPrompt();

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: 'image/jpeg',
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    console.log("Raw Gemini JSON:", responseText); // Helpful for debugging prompt adherence

    // Hack parser: sometimes Gemini still returns ```json ... ``` despite instructions
    let jsonString = responseText.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedData = JSON.parse(jsonString);

    // Ensure all expected fields exist to prevent UI crashes
    return {
      name: parsedData.name || 'Unknown Item',
      item_type: parsedData.item_type || 'uncategorized',
      distinguishing_features: parsedData.distinguishing_features || {},
      confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : 50
    };

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw new Error('Failed to analyze image with Gemini: ' + error.message);
  }
}
