import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllComments = async (req: Request, res: Response) => {
  try {
    const comments = await prisma.comment.findMany();
    res.send(comments);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const getCommentById = async (req: Request, res: Response) => {
  const commentId = Number(req.params.id);
  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (comment) {
      res.send(comment);
    } else {
      res.status(404).send("Comment not found");
    }
  } catch (error) {
    res.status(400).send(error);
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const comment = await prisma.comment.create({ data: req.body });
    res.status(201).send(comment);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  const commentId = Number(req.params.id);
  try {
    const comment = await prisma.comment.delete({ where: { id: commentId } });
    res.status(200).send(comment);
  } catch (error) {
    res.status(400).send(error);
  }
};
