import sgMail from '@sendgrid/mail';
import otpGenerator from 'otp-generator';
import User from '../models/User.js'; // assuming you're using Mongoose
import dotenv from "dotenv";
dotenv.config();
// Set your SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Function to generate OTP
export const generateOtp = () => {
  return otpGenerator.generate(6, { upperCase: false, specialChars: false, digits: true });
};

// Send OTP email using SendGrid
export const sendOtpEmail = async (email, otp) => {
  const msg = {
    to: email,
    from: 'aryamangupta2121@gmail.com', // Replace with your email
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`,
  };

  try {
    await sgMail.send(msg);
    console.log('OTP email sent');
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }
};

// Save OTP to user's document (for validation later)
export const saveOtpToUser = async (userId, otp) => {
  const user = await User.findById(userId);
  user.otp = otp;
  await user.save();
};

