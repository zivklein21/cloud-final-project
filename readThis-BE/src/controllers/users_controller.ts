import { Response, Request } from "express";
import { AuthRequest } from "../common/auth_middleware";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import type { File as MulterFile } from "multer";

// Extend AuthRequest to include file property for multer
export interface MulterAuthRequest extends AuthRequest {
  file?: MulterFile;
}

const s3 = new S3Client({ region: process.env.AWS_REGION });
const prisma = new PrismaClient();

const register = async (req: MulterAuthRequest, res: Response):Promise<void> => {
  try {
    const { email, username, password } = req.body;
    
    if (!email || !username || !password) {
      res.status(400).json({ message: "All fields are required: email, username, password." });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email format." });
      return;
    }
    // Check if a user with the same email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (!req.file) {
      res.status(400).json({ message: "Profile image is required." });
      return;
    }

    if (existingUser) {
        res.status(400).json({
        message: "Username or Email already exists. Please try a different one.",
      });
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user first (without the imageUrl)
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        imageUrl: "", // Temporarily empty
      }
    });

    // Upload profile image to S3
    const filename = `${user.id}.png`;
    const key = `profile/${filename}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );
    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { imageUrl: url }
    });

    res.status(200).send(updatedUser);
  } catch (err) {
    res.status(400).send(err);
  }
};

type tTokens = {
  accessToken: string;
  refreshToken: string;
};

const generateToken = (userId: string): tTokens | null => {
  if (!process.env.TOKEN_SECRET) {
    return null;
  }
  const random = Math.random().toString();
  const accessToken = jwt.sign(
    { _id: userId, random },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRES }
  );

  const refreshToken = jwt.sign(
    { _id: userId, random },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES }
  );

  return { accessToken, refreshToken };
};

const login = async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(400).send("User not found");
      return;
    }

    // Check the password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).send("Wrong username or password");
      return;
    }

    // Generate tokens
    const tokens = generateToken(user.id.toString());
    if (!tokens) {
      res.status(500).send("Server Error");
      return;
    }

    // Update refresh tokens
    const newRefreshTokens = [...(user.refreshToken || []), tokens.refreshToken];
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshTokens }
    });

    res.status(200).send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      _id: user.id,
    });
  } catch (err) {
    res.status(400).send(err);
  }
};

const logout = async (req: AuthRequest, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
      res.status(400).send("Refresh token is required");
      return;
    }

    // Find the user and remove the refresh token
    const user = await prisma.user.findFirst({ where: { refreshToken: { has: refreshToken } } });
    if (user) {
      const newRefreshTokens = user.refreshToken?.filter((token) => token !== refreshToken) || [];
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshTokens }
      });
    }

    res.status(200).send("Success");
  } catch (err) {
    res.status(400).send(err);
  }
};

const refresh = async (req: AuthRequest, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
      res.status(400).send("Refresh token is required");
      return;
    }

    if (!process.env.TOKEN_SECRET) {
      res.status(500).send("Server Error");
      return;
    }

    // Verify the refresh token
    jwt.verify(refreshToken, process.env.TOKEN_SECRET, async (err, payload: any) => {
      if (err) {
        res.status(401).send("Invalid refresh token");
        return;
      }

      const userId = payload._id;
      const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
      if (!user || !(user.refreshToken?.includes(refreshToken))) {
        res.status(401).send("Invalid refresh token");
        return;
      }

      // Generate new tokens
      const tokens = generateToken(user.id.toString());
      if (!tokens) {
        res.status(500).send("Server Error");
        return;
      }

      // Update refresh tokens
      const newRefreshTokens = user.refreshToken.filter((token) => token !== refreshToken);
      newRefreshTokens.push(tokens.refreshToken);
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshTokens }
      });

      res.status(200).send({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: user.id,
      });
    });
  } catch (err) {
    res.status(400).send(err);
  }
};

const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).send("Unauthorized: No user ID provided.");
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        email: true,
        username: true,
        imageUrl: true,
        // Exclude password and refreshToken
      }
    });
    if (!user) {
      res.status(404).send("User not found");
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error });
  }
};

export const updateProfile = async (req: MulterAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).send("Unauthorized");
      return;
    }

    const updateData: any = { username: req.body.username };

    if (req.file) {
      // Upload profile image to S3
      const filename = `${userId}.png`;
      const key = `profile/${filename}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );
      const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      updateData.imageUrl = url;
    }

    const user = await prisma.user.update({
      where: { id: Number(userId) },
      data: updateData
    });
    res.status(200).send(user);
  } catch (err) {
    res.status(500).send(err);
  }
};

export default {
  register,
  login,
  refresh,
  logout,
  getMyProfile,
  updateProfile,
  generateToken
};