import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Generate Razorpay signature for webhook verification
 */
export const generateSignature = (orderId, paymentId, secret) => {
  const crypto = require("crypto");
  const message = `${orderId}|${paymentId}`;
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
};
