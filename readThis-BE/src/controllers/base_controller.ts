import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getAllPosts = async (req: Request, res: Response) => {
  const filter = req.query.owner;
  try {
    if (filter) {
      const posts = await prisma.post.findMany({ where: { ownerId: Number(filter) } });
      res.send(posts);
    } else {
      const posts = await prisma.post.findMany();
      res.send(posts);
    }
  } catch (error) {
    res.status(400).send(error);
  }
};

export const getPostById = async (req: Request, res: Response) => {
  const postId = Number(req.params.id);
  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post) {
      res.send(post);
    } else {
      res.status(404).send("Post not found");
    }
  } catch (error) {
    res.status(400).send(error);
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const post = await prisma.post.create({ data: req.body });
    res.status(201).send(post);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const deletePost = async (req: Request, res: Response) => {
  const postId = Number(req.params.id);
  try {
    const post = await prisma.post.delete({ where: { id: postId } });
    res.status(200).send(post);
  } catch (error) {
    res.status(400).send(error);
  }
};
