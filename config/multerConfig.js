import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'shift_logs', // Cloudinary folder
    resource_type: 'auto', // Detect file type automatically
    allowedFormats: ['jpg', 'jpeg', 'png', 'pdf', 'docx'],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image") && !file.mimetype.startsWith("application")) {
      return cb(new Error("Only images and PDFs are allowed"), false);
    }
    cb(null, true);
  },
});

export default upload;
