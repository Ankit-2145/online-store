import mongoose, { Schema, model, models, Document, Model } from "mongoose";
import { IImageVariant, IImageVariantType } from "./Product";

interface PopulatedUser {
  _id: mongoose.Types.ObjectId;
  email: string;
}

interface PopulatedProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  imageUrl: string;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | PopulatedUser;
  productId: mongoose.Types.ObjectId | PopulatedProduct;
  variant: IImageVariant;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  downloadUrl?: string;
  previewUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant: {
      type: {
        type: String,
        required: true,
        enum: ["SQUARE", "WIDE", "PORTRAIT"] as IImageVariantType[],
        set: (v: string) => v.toUpperCase(),
      },
      price: {
        type: Number,
        required: true,
      },
      license: {
        type: String,
        required: true,
        enum: ["personal", "commercial"],
      },
    },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    downloadUrl: { type: String },
    previewUrl: { type: String },
  },
  { timestamps: true }
);

const Order: Model<IOrder> =
  models.Order || model<IOrder>("Order", orderSchema);

export default Order;
