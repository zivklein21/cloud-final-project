import { Request, Response } from "express";
import { getBookRecommendations } from "../services/books_service";

export const recommendBooks = async (req: Request, res: Response): Promise<void> =>  {
    try {
        const { bookTitle } = req.body;
        if (!bookTitle) {
             res.status(400).json({ error: "Book title is required." });
        }

        const recommendations = await getBookRecommendations(bookTitle);

        if (!recommendations.length) {
             res.status(404).json({ message: "No similar books found." });
        }

         res.json({ recommendations });
    } catch (error) {
        console.error("❌ Error fetching book recommendations:", error);
         res.status(500).json({ error: "Internal server error." });
    }
};