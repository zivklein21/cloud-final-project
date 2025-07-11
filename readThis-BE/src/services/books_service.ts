import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const AI_ML_API_URL = "https://api.aimlapi.com/v1/chat/completions"; // API/ML chat URL
const AI_ML_API_KEY = process.env.OPENAI_API_KEY; // API key from .env file

export const getBookRecommendations = async (bookTitle: string): Promise<string[]> => {
    try {
        if (!AI_ML_API_KEY) {
            throw new Error("AI/ML API key is missing.");
        }

        const response = await axios.post(
            AI_ML_API_URL,
            {
                model: "gpt-4o-mini", // Replace if AI/ML API has a specific model
                messages: [
                    { role: "system", content: "You are a helpful AI assistant that recommends books." },
                    { role: "user", content: `Can you find for me 5-10 books in the same genre as ${bookTitle}? Provide book name, author, and a short description for each.` }
                ],
                max_tokens: 300,
            },
            {
                headers: {
                    Authorization: `Bearer ${AI_ML_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // Extract the text response
        const responseText = response.data.choices[0]?.message?.content?.trim();
        
        if (!responseText) {
            return ["No recommendations found."];
        }

        // Splitting response into a list format (assuming AI returns numbered books)
        return responseText.split("\n").filter(line => line.trim() !== "");
    } catch (error) {
        console.error("❌ Error fetching book recommendations:", error);
        return ["No recommendations found."];
    }
};