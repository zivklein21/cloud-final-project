import api from "./api";
import { SERVER_URL } from "./vars";

export const fetchBookRecommendations = async (bookTitle: string): Promise<string[]> => {
    try {
        const response = await api.post(`${SERVER_URL}/books/recommend`, { bookTitle });
        return response.data.recommendations;
    } catch (error) {
        console.error("Error fetching book recommendations:", error);
        return ["No recommendations found."];
    }
};