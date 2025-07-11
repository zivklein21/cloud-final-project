import express from "express";
const router = express.Router();
import { getAllComments, getCommentById, createComment, deleteComment } from "../controllers/comments_controller";

router.get("/", getAllComments);

router.get("/:id", getCommentById);

router.post("/", createComment);

router.delete("/:id", deleteComment);

export default router;