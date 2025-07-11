import { Request, Response } from "express";
import { AuthRequest } from "../common/auth_middleware";
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";
import sharp from "sharp";
import type { File as MulterFile } from "multer";

const prisma = new PrismaClient();
const s3 = new S3Client({ region: process.env.AWS_REGION });

// Extend AuthRequest to include file property for multer
export interface MulterAuthRequest extends AuthRequest {
  file?: MulterFile;
}

export const createPost = async (req: MulterAuthRequest, res: Response) => {
  try {
    const { title, content, owner } = req.body;
    if (!title || !content || !owner) {
      res.status(400).json({ message: "Title, content, and owner are required." });
      return;
    }

    // Create the post first (without imageUrl)
    const post = await prisma.post.create({
      data: {
        title,
        content,
        ownerId: Number(owner),
        imageUrl: "",
      },
    });

    let imageUrl = "";
    if (req.file) {
      // Upload image to S3
      const filename = `${post.id}.png`;
      const key = `posts/${filename}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );
      imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } else {
      // Fallback: fetch book cover from Google Books/Open Library, upload to S3
      imageUrl = await fetchBookCoverAndUploadToS3(title, post.id.toString());
    }

    const updatedPost = await prisma.post.update({
      where: { id: post.id },
      data: { imageUrl },
    });

    res.status(201).json({ message: "Post created successfully.", post: updatedPost });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Failed to create post." });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  const postId = Number(req.params.id);
  try {
    if (!req.user) {
      res.status(401).send({ message: "Unauthorized" });
      return;
    }
    const post = await prisma.post.findFirst({ where: { id: postId, ownerId: Number(req.user.id) } });
    if (!post) {
      res.status(400).send({ message: "Post not found or unauthorized" });
      return;
    }
    // Optionally: delete image from S3 (not implemented here)
    await prisma.post.delete({ where: { id: postId } });
    res.status(200).send({ message: "Post deleted successfully." });
  } catch (err: any) {
    console.error("Error deleting post:", err);
    res.status(500).send({ message: err.message });
  }
};

export const getAllPaged = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;
    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: { username: true, imageUrl: true } },
          comments: { include: { owner: { select: { username: true, imageUrl: true } } } }
        },
      }),
      prisma.post.count(),
    ]);
    const S3_BASE = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    const mappedPosts = posts.map(post => ({
      ...post,
      imageUrl: post.imageUrl && post.imageUrl.startsWith('http') ? post.imageUrl : S3_BASE + post.imageUrl,
      owner: {
        ...post.owner,
        imageUrl: post.owner?.imageUrl && post.owner.imageUrl.startsWith('http') ? post.owner.imageUrl : (post.owner?.imageUrl ? S3_BASE + post.owner.imageUrl : undefined)
      },
      comments: post.comments?.map(comment => ({
        ...comment,
        owner: {
          ...comment.owner,
          imageUrl: comment.owner?.imageUrl && comment.owner.imageUrl.startsWith('http') ? comment.owner.imageUrl : (comment.owner?.imageUrl ? S3_BASE + comment.owner.imageUrl : undefined)
        }
      }))
    }));
    const totalPages = Math.ceil(totalPosts / limit);
    res.json({ posts: mappedPosts, totalPages });
  } catch (err) {
    console.error("Error fetching paged posts:", err);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

export const getAllPosts = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        owner: { select: { username: true, imageUrl: true } },
        comments: { include: { owner: { select: { username: true, imageUrl: true } } } }
      },
      orderBy: { createdAt: "desc" },
    });
    const S3_BASE = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    const mappedPosts = posts.map(post => ({
      ...post,
      imageUrl: post.imageUrl && post.imageUrl.startsWith('http') ? post.imageUrl : S3_BASE + post.imageUrl,
      owner: {
        ...post.owner,
        imageUrl: post.owner?.imageUrl && post.owner.imageUrl.startsWith('http') ? post.owner.imageUrl : (post.owner?.imageUrl ? S3_BASE + post.owner.imageUrl : undefined)
      },
      comments: post.comments?.map(comment => ({
        ...comment,
        owner: {
          ...comment.owner,
          imageUrl: comment.owner?.imageUrl && comment.owner.imageUrl.startsWith('http') ? comment.owner.imageUrl : (comment.owner?.imageUrl ? S3_BASE + comment.owner.imageUrl : undefined)
        }
      }))
    }));
    res.json(mappedPosts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

export const getPostById = async (req: AuthRequest, res: Response) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        owner: { select: { username: true, imageUrl: true } },
        comments: { include: { owner: { select: { username: true, imageUrl: true } } } }
      },
    });
    if (!post) {
      res.status(404).send({ message: "Post not found" });
      return;
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch post" });
  }
};

export const likePost = async (req: AuthRequest, res: Response) => {
  const postId = Number(req.params.id);
  try {
    if (!req.user) {
      res.status(401).send({ message: "Unauthorized: User not logged in" });
      return;
    }
    const userId = Number(req.user.id);
    const post = await prisma.post.findUnique({ where: { id: postId }, include: { usersWhoLiked: true } });
    if (!post) {
      res.status(404).send({ message: "Post not found" });
      return;
    }
    if (post.usersWhoLiked.some((u) => u.id === userId)) {
      res.status(406).send({ message: "User already liked this post" });
      return;
    }
    await prisma.post.update({
      where: { id: postId },
      data: { usersWhoLiked: { connect: { id: userId } } },
    });
    res.status(200).send({ message: "Post liked" });
  } catch (err: any) {
    res.status(500).send({ message: err.message || "An error occurred while liking the post" });
  }
};

export const unlikePost = async (req: AuthRequest, res: Response) => {
  const postId = Number(req.params.id);
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized: User not logged in" });
      return;
    }
    const userId = Number(req.user.id);
    const post = await prisma.post.findUnique({ where: { id: postId }, include: { usersWhoLiked: true } });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    if (!post.usersWhoLiked.some((u) => u.id === userId)) {
      res.status(406).json({ message: "User has not liked this post" });
      return;
    }
    await prisma.post.update({
      where: { id: postId },
      data: { usersWhoLiked: { disconnect: { id: userId } } },
    });
    res.status(200).send({ message: "Post unliked" });
  } catch (error: any) {
    res.status(500).json({ message: "An error occurred while unliking the post", error: error.message });
  }
};

export const addCommentToPost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body.text || !req.user) {
      res.status(400).json({ message: "Missing required fields." });
      return;
    }
    const postId = Number(req.params.id);
    const comment = await prisma.comment.create({
      data: {
        comment: req.body.text, // Use 'comment' field
        ownerId: Number(req.user.id), // Use 'ownerId' for user relation
        postId: postId,
      },
      include: { owner: { select: { username: true, imageUrl: true } } },
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Failed to add comment." });
  }
};

export const getMyPosts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).send({ message: "Unauthorized" });
      return;
    }
    const posts = await prisma.post.findMany({ where: { ownerId: Number(req.user.id) } });
    res.status(200).json(posts);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePost = async (req: MulterAuthRequest, res: Response): Promise<void> => {
  const postId = Number(req.params.id);
  try {
    if (!req.user) {
      res.status(401).send({ message: "Unauthorized" });
      return;
    }
    const post = await prisma.post.findFirst({ where: { id: postId, ownerId: Number(req.user.id) } });
    if (!post) {
      res.status(404).send({ message: "Post not found or unauthorized" });
      return;
    }
    const { title, content } = req.body;
    let imageUrl = post.imageUrl;
    if (req.file) {
      // Upload new image to S3
      const filename = `${postId}-${Date.now()}.png`;
      const key = `posts/${filename}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );
      imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { title, content, imageUrl },
    });
    res.status(200).json(updatedPost);
  } catch (err: any) {
    res.status(500).send({ message: err.message });
  }
};

async function fetchBookCoverAndUploadToS3(title: string, postId: string): Promise<string> {
  const query = encodeURIComponent(`${title}`);
  const googleApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}`;
  const openLibraryUrl = `https://openlibrary.org/search.json?title=${query}`;
  try {
    // Try Google Books API first
    const googleResponse = await axios.get(googleApiUrl);
    const googleData = googleResponse.data;
    if (googleData.items && googleData.items.length > 0) {
      const book = googleData.items[0].volumeInfo;
      const imageUrl =
        book.imageLinks?.thumbnail ||
        book.imageLinks?.smallThumbnail ||
        getRandomImage();
      return await downloadAndUploadImageToS3(imageUrl, postId);
    }
  } catch (error: any) {
    console.error("Google Books API failed. Trying Open Library API...");
  }
  try {
    // Fallback: Try Open Library API
    const openLibraryResponse = await axios.get(openLibraryUrl);
    const openLibraryData = openLibraryResponse.data;
    if (openLibraryData.docs && openLibraryData.docs.length > 0) {
      const coverId = openLibraryData.docs[0].cover_i;
      if (coverId) {
        const imageUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
        return await downloadAndUploadImageToS3(imageUrl, postId);
      }
    }
  } catch (error: any) {
    console.error("Open Library API also failed.");
  }
  console.log("Both APIs failed. Using fallback image.");
  return getRandomImage();
}

async function downloadAndUploadImageToS3(imageUrl: string, postId: string): Promise<string> {
  try {
    if (!imageUrl.startsWith("http")) {
      throw new Error(`Invalid image URL: ${imageUrl}`);
    }
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    // Resize and optimize image using sharp
    const buffer = await sharp(Buffer.from(response.data))
      .resize(500, 750, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
    const key = `posts/${postId}.png`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: "image/png",
      })
    );
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error saving image to S3:", error);
    return getRandomImage();
  }
}

function getRandomImage(): string {
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/posts/DefaultBook.png`;
}
