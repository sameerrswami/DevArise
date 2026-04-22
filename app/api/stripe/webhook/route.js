import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = headers().get("x-razorpay-signature");

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ message: "Webhook secret not configured" }, { status: 500 });
    }

    const hash = crypto
      .createHmac("sha256", webhookSecret)
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
      case "payment.captured": {
        const payment = eventData.payment.entity;
        const notes = payment.notes || {};
        const userId = notes.userId;
        const planId = notes.planId;
        const billingCycle = notes.billingCycle;

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              isPremium: true,
              planType: billingCycle || "one-time",
            },
          });

          await prisma.transaction.create({
            data: {
              userId,
              amount: payment.amount / 100,
              currency: payment.currency,
              status: "succeeded",
              paymentIntentId: payment.id,
              planType: planId || billingCycle || "premium",
            },
          });

          logger.info(`Payment captured for user: ${userId}, amount: ${payment.amount}`);
        }
        break;
      }

      case "payment.failed": {
        const failedPayment = eventData.payment.entity;
        logger.error(`Payment failed: ${failedPayment.id}`, {
          error: failedPayment.error_description,
        });
        break;
      }

      case "subscription.activated": {
        const subscription = eventData.subscription.entity;
        const userId = subscription.notes?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              isPremium: true,
              subscriptionId: subscription.id,
            },
          });
        }
        break;
      }

      case "subscription.cancelled": {
        const cancelledSub = eventData.subscription.entity;
        const userId = cancelledSub.notes?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              isPremium: false,
              subscriptionId: null,
            },
          });
        }
        break;
      }

      case "subscription.paused":
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
