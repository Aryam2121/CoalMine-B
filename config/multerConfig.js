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

const upload = multer({ storage });

export default upload;
