// controllers/NotificationController.js
import axios from "axios";
const FIREBASE_SERVER_KEY = process.env.FIREBASE_SERVER_KEY; // Make sure it's in your .env file

// Send Notification function
const sendNotification = async (req, res) => {
  const { title, body, token } = req.body;

  if (!title || !body || !token) {
    return res.status(400).json({ success: false, message: "Title, body, and token are required" });
  }

  const message = {
    to: token,
    notification: {
      title,
      body,
    },
  };

  try {
    const response = await axios.post("https://fcm.googleapis.com/fcm/send", message, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${FIREBASE_SERVER_KEY}`,
      },
    });

    res.status(200).json({ success: true, message: "Notification sent!", response: response.data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to send notification", error: error.message });
  }
};

export { sendNotification };
