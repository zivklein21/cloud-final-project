import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
export interface AuthUser {
  id: number;
  email?: string;
  username?: string;
  imageUrl?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.header("Authorization");
  if (!authorization) {
    console.log(" No token provided");
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }

  const token = authorization.split(" ")[1]; // חילוץ ה-token
  console.log(token);
  if (!token) {
    console.log("invalid token");
    res.status(401).json({ message: "Unauthorized: Invalid token" });
    return;
  }

  jwt.verify(token, process.env.TOKEN_SECRET!, (err, decoded) => {
    if (err || !decoded) {
      console.log(err);
      res.status(401).json({ message: "Unauthorized: Token expired or invalid" });
      return;
    }
  
    // Ensure decoded is treated as a JWT payload
    const userPayload = decoded as jwt.JwtPayload;
    let id: number | undefined = undefined;
    if (userPayload._id) {
      id = Number(userPayload._id);
    } else if (userPayload.id) {
      id = Number(userPayload.id);
    }
    if (!id || isNaN(id)) {
      res.status(401).json({ message: "Unauthorized: Invalid user id in token" });
      return;
    }
    req.user = {
      id,
      email: userPayload.email as string,
      username: userPayload.username as string,
      imageUrl: userPayload.imageUrl as string,
    };
    next();
  });
};

export default authMiddleware;
