import multer from "multer";

// No need for disk storage or fs/path logic
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const isValidType =
      allowedTypes.test(file.mimetype) && allowedTypes.test(file.originalname.toLowerCase());

    if (isValidType) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, JPG, and PNG files are allowed!"));
    }
  },
});

export default upload;
