import Razorpay from "razorpay";
import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn(
    "⚠️ Razorpay keys are missing. Payments will not work until RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are configured."
  );
}

export const razorpay = new Razorpay({
  key_id: keyId || "dummy_key_to_prevent_crash",
  key_secret: keySecret || "dummy_secret_to_prevent_crash",
});

export const generateSignature = (orderId, paymentId, secret) => {
  return crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
};
