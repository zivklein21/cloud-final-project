import env from "dotenv";
if (process.env.NODE_ENV === "test") {
  env.config({ path: ".env.test" });
} else if (process.env.NODE_ENV === "prod") {
  env.config({ path: ".env.prod" });
} else {
  env.config();
}
import express, { Express } from "express";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Routes
import postsRoute from "./routes/post_route";
import commentsRoute from "./routes/comments_route";
import authRoutes from "./routes/users_route";
import bookRoutes from "./routes/books_route";

import swaggerJsDoc from "swagger-jsdoc";
import path from "path";

import swaggerUI from "swagger-ui-express";
import cors from "cors";
import { execArgv } from "process";

// Initialize app
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // Allow frontend requests
    credentials: true, 
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
// Allow cookies and authentication headers if needed
  })
);


// 2) Parse incoming JSON
app.use(express.json());

// 3) Define routes


app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use('/',express.static("front"));
app.get('/ui/*', (req, res) => { res.sendFile(path.join("front", 'index.html')); });

app.use("/posts", postsRoute);
app.use("/comments", commentsRoute);
app.use("/auth", authRoutes);
app.use("/books", bookRoutes);
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// 4) Connect to PostgreSQL


// 5) Swagger setup (optional, for API docs)
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web Dev 2025 - D - REST API",
      version: "1.0.0",
      description: "REST server including authentication using JWT",
    },
    servers: [
      { url: "http://localhost:" + process.env.PORT }, 
      {url: "http://10.10.246.56"}, 
      {url: "https://10.10.246.56"}
    ],
  },
  apis: ["./src/routes/*.ts"], // or wherever your routes with swagger comments are
};
const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

export default app;
