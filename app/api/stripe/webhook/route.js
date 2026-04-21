import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = headers().get("x-razorpay-signature");

    // Verify Razorpay webhook signature
    const hash = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      logger.error("Razorpay webhook signature verification failed");
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const eventData = event.payload;

    logger.info(`Razorpay webhook event: ${eventType}`);

    switch (eventType) {
      case "payment.authorized":
      case "payment.captured":
        // Payment successful
        const payment = eventData.payment.entity;
        const orderId = payment.order_id;

        // Get order details to fetch userId
        const order = await prisma.$queryRaw`
          SELECT notes FROM stripe_orders WHERE razorpay_order_id = ${orderId}
        `;

        if (order && payment.notes) {
          const userId = payment.notes.userId;
          const planId = payment.notes.planId;
          const billingCycle = payment.notes.billingCycle;

          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                isPremium: true,
                planType: billingCycle || "one-time",
                razorpayCustomerId: payment.customer_id,
                razorpayPaymentId: payment.id,
              }
            });

            // Record Transaction
            await prisma.transaction.create({
              data: {
                userId: userId,
                amount: payment.amount / 100, // Convert from paise to rupees
                currency: payment.currency,
                status: "succeeded",
                paymentIntentId: payment.id,
                planType: planId
              }
            });

            logger.info(`Payment captured for user: ${userId}, amount: ${payment.amount}`);
          }
        }
        break;

      case "payment.failed":
        // Payment failed
        const failedPayment = eventData.payment.entity;
        logger.error(`Payment failed: ${failedPayment.id}`, { error: failedPayment.error_description });
        break;

      case "subscription.activated":
        // Subscription started
        const subscription = eventData.subscription.entity;
        if (subscription.notes && subscription.notes.userId) {
          await prisma.user.update({
            where: { id: subscription.notes.userId },
            data: {
              isPremium: true,
              razorpaySubscriptionId: subscription.id,
            }
          });
        }
        break;

      case "subscription.cancelled":
        // Subscription cancelled
        const cancelledSubscription = eventData.subscription.entity;
        if (cancelledSubscription.notes && cancelledSubscription.notes.userId) {
          await prisma.user.update({
            where: { id: cancelledSubscription.notes.userId },
            data: {
              isPremium: false,
              razorpaySubscriptionId: null,
            }
          });
        }
        break;

      case "subscription.paused":
        // Subscription paused
        logger.info(`Subscription paused: ${eventData.subscription.entity.id}`);
        break;

      default:
        logger.warn(`Unhandled Razorpay event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Razorpay webhook processing failed", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
