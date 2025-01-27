import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";

// Set up a nodemailer transporter (use your SMTP details here)
const transporter = nodemailer.createTransport({
  service: "gmail", // Or any other email service
  auth: {
    user: "YOUR_EMAIL",
    pass: "YOUR_EMAIL_PASSWORD",
  },
});

// Send OTP to email
export const sendOtpEmail = (email, otp) => {
  const mailOptions = {
    from: "YOUR_EMAIL",
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
  };

  return transporter.sendMail(mailOptions);
};

// Generate OTP
export const generateOtp = () => {
  return otpGenerator.generate(6, { upperCase: false, specialChars: false, digits: true });
};

// Save OTP to user's document (for validation later)
export const saveOtpToUser = async (userId, otp) => {
  const user = await User.findById(userId);
  user.otp = otp;
  await user.save();
};
