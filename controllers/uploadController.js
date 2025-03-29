import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import e from 'express';

const uploadFile = async (req, res) => {
  try {
    const file = req.files.file; // Assuming you're using express-fileupload or multer

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      resource_type: 'auto', // Detect file type automatically
    });

    res.json({ success: true, url: result.secure_url }); // Return Cloudinary URL
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

export { uploadFile };
