import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { File as MulterFile } from "multer";
const s3 = new S3Client({ region: process.env.AWS_REGION });

const storage = multer.memoryStorage(); // Store file in memory for direct upload to S3
const upload = multer({ storage });

interface MulterRequest extends Request {
  file?: MulterFile;
}

export const uploadImage = [
  upload.single("image"),
  async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded!" });
        return;
      }

      const { type = "general", identifier } = req.body;
      if (!identifier) {
        res.status(400).json({ message: "Identifier is required." });
        return;
      }

      // Generate a unique filename or use identifier
      const filename = `${identifier}.png`;
      const key = `${type}/${filename}`;

      // Upload to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      // Optionally, generate a signed URL for access
      // const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: key }), { expiresIn: 3600 });
      // Or use the public S3 URL if your bucket is public:
      const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      res.status(200).json({
        message: "File uploaded successfully!",
        imagePath: url,
      });
    } catch (error) {
      next(error);
    }
  },
];