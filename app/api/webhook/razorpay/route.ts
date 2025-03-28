import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    await connectDB();

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      const order = await Order.findOneAndUpdate(
        {
          razorpayOrderId: payment.order_id,
        },
        {
          razorpayPaymentId: payment.id,
          status: "completed",
        }
      ).populate([
        { path: "productId", select: "name" },
        { path: "userId", select: "email" },
      ]);
      if (order) {
        const transporter = nodemailer.createTransport({
          service: "sandbox.smtp.mailtrap.io",
          port: 2525,
          auth: {
            user: "00abcc4e5c00ca",
            pass: "7eab17fec615e7",
          },
        });
        await transporter.sendMail({
          from: "your@example.com",
          to: (order.userId as { email: string }).email,
          subject: "Payment Successful",
          text: `Your payment of ₹${order.amount} for ${
            (order.productId as { name: string }).name
          } was successful. Thank you for your purchase!`,
        });
      }
    }

    return NextResponse.json({ message: "success" }, { status: 200 });
  } catch (error) {
    console.error("Error in Razorpay webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
