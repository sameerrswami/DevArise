import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { planId, billingCycle } = await req.json();

    // Map plan IDs to Razorpay Plan IDs
    const planMap = {
      premium: billingCycle === 'yearly' ? process.env.NEXT_PUBLIC_RAZORPAY_YEARLY_PLAN_ID : process.env.NEXT_PUBLIC_RAZORPAY_MONTHLY_PLAN_ID,
      lifetime: process.env.NEXT_PUBLIC_RAZORPAY_LIFETIME_PLAN_ID
    };

    const razorpayPlanId = planMap[planId];

    if (!razorpayPlanId) {
      return NextResponse.json({ message: "Invalid plan" }, { status: 400 });
    }

    // Create Razorpay Order
    const orderAmount = {
      monthly: 99900, // ₹999 in paise
      yearly: 999900, // ₹9999 in paise
      lifetime: 1999900 // ₹19999 in paise
    };

    const amount = orderAmount[planId === 'lifetime' ? 'lifetime' : billingCycle] || 99900;

    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: `receipt_${session.user.id}_${Date.now()}`,
      notes: {
        userId: session.user.id,
        planId: planId,
        billingCycle: billingCycle,
        userEmail: session.user.email,
        userName: session.user.name
      }
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      userEmail: session.user.email,
      userName: session.user.name,
      userId: session.user.id
    });
  } catch (error) {
    logger.error("POST /api/stripe/checkout - Razorpay order creation failed", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
