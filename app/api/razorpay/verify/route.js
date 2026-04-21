import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import crypto from "crypto";
import { logger } from "@/lib/logger";

export async function POST(req) {
  try {
    const { orderId, paymentId, signature, userId, planId, billingCycle } = await req.json();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
    }

    // Verify signature: hmac_sha256(orderId|paymentId, key_secret)
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expected !== signature) {
      logger.error("Razorpay signature mismatch", { orderId, paymentId });
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    // Fetch payment details from Razorpay to confirm
    const payment = await razorpay.payments.fetch(paymentId);

    if (!payment || payment.status !== "captured") {
      // Could be authorized -> captured later; handle accordingly
      if (payment.status !== "captured") {
        logger.warn("Razorpay payment not captured yet", { paymentId, status: payment.status });
        return NextResponse.json({ message: "Payment not captured" }, { status: 400 });
      }
    }

    // Update user and record transaction
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: true,
          planType: billingCycle || "one-time",
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderId,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: userId,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: "succeeded",
          paymentIntentId: paymentId,
          planType: planId || billingCycle || "premium",
        },
      });
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    logger.error("Razorpay verify error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
