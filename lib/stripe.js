import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export const razorpay = new Razorpay({
  key_id: keyId || "dummy_key_to_prevent_crash",
  key_secret: keySecret || "dummy_secret_to_prevent_crash",
});
