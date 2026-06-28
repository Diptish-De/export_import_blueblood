import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Gen AI client using client-side safety or environmental API key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Check if API key exists
if (!apiKey) {
    console.error("Gemini API Key (VITE_GEMINI_API_KEY) is missing in environmental variables.");
}

/**
 * Loads an image from a File object (e.g., from file input or drag-drop).
 */
export function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to decode image file: ${file.name}`));
            img.src = reader.result;
        };
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
    });
}

/**
 * Empty/Dummy visual indexing since Gemini handles search dynamically without building visual client indexes.
 */
export async function buildCatalogIndex(products, onProgress) {
    // resolve instantly
    if (onProgress) {
        onProgress(products.length, products.length);
    }
    return products;
}

export function clearCatalogCache() {
    // Noop
}

/**
 * Converts a file object to a Google Gen AI Part object (inlineData).
 */
function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Matches an uploaded image file against the catalog database using Gemini Multimodal.
 * We send the image + a list of catalog products, and request the AI to find matching products.
 */
export async function matchAgainstCatalogGemini(file, products, topN = 3) {
    if (!apiKey) {
        throw new Error("Gemini API Key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
    }

    // Initialize Google Gen AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

    // Format catalogue to pass to the model as text context (only key fields to optimize token usage)
    const catalogSubset = products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        subcategory: p.subcategory,
        description: p.description || ''
    }));

    const imagePart = await fileToGenerativePart(file);

    const prompt = `You are a product matching expert for Blueblood Exports, an Indian handicrafts and furniture exporter.
Your task is to identify and match the product shown in the uploaded image against our catalog of products listed below.

Here is our catalog list:
${JSON.stringify(catalogSubset, null, 2)}

Analyze the uploaded image visually. Find the top ${topN} closest matching products from our catalog.
Return ONLY a valid JSON array of objects representing the matches, sorted by match confidence (highest score first).
Do not include any markdown styling, codeblock wrapping, or text explanation. The output must be exactly parseable by JSON.parse().

Each object in the array must have:
- productId: the ID of the matched product from our catalog (e.g. BBE-MUK-TB-0001)
- score: a confidence score from 0 to 100 representing how likely this is the correct match.
- reason: a very short (1 sentence) explanation of why it matches (e.g. "Similar wood grain and drawers layout", "Exact match for dhokra art design").

Response format:
[
  { "productId": "ID", "score": 90, "reason": "Explanation" }
]`;

    try {
        const response = await model.generateContent([imagePart, prompt]);
        const textResponse = response.response.text();
        const matches = JSON.parse(textResponse);
        return matches.map(match => ({
            productId: match.productId,
            score: match.score,
            reason: match.reason
        }));
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw error;
    }
}
