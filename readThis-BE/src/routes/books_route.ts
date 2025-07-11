import express from "express";
import { recommendBooks } from "../controllers/book_recommendation_controller";

const router = express.Router();

/**
* @swagger
* tags:
*   name: Books
*   description: The Authentication API
*/

/**
 * @swagger
 * /books/recommend:
 *   post:
 *     summary: Get AI-based book recommendations
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookTitle:
 *                 type: string
 *                 example: "Harry Potter"
 *     responses:
 *       200:
 *         description: A list of recommended books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Missing book title
 *       500:
 *         description: Internal server error
 */
router.post("/recommend", recommendBooks);

export default router;