/**
 * Builds the strict prompt instructing Gemini to return structural JSON
 * for inventory identification.
 * 
 * @param {Object} config - Currently unused, but follows brief for future agentModes
 * @returns {string} The prompt text
 */
export function buildIdentifyPrompt(config = {}) {
  return `You are an AI inventory tracking assistant. I am going to show you an image of a person holding an item, or an item placed in front of a camera.

Your task is to identify the main object being presented.

CRITICAL INSTRUCTIONS:
1. You MUST return ONLY valid JSON.
2. Do NOT include any markdown formatting like \`\`\`json. 
3. Do NOT include any preamble, explanations, or conversational text.
4. Your response must precisely match the following JSON schema:

{
  "name": "string (the common, specific name of the item, e.g. 'Phillips Screwdriver')",
  "item_type": "string (the broad category, e.g. 'tool', 'office supplies', 'electronics')",
  "distinguishing_features": {
    "key1": "value1",
    "key2": "value2"
  },
  "confidence": number (your certainty from 0 to 100)
}

GUIDELINES FOR distinguishing_features:
- Provide specific, concrete visual attributes as key-value pairs (e.g., color, brand, size, material, condition).
- Do NOT write sentences or prose.
- GOOD Example: { "color": "yellow", "brand": "DeWalt", "condition": "worn", "size": "large" }
- BAD Example: { "description": "It's a large yellow tool that looks worn out" }

Analyze the image carefully and output the JSON now.`;
}
