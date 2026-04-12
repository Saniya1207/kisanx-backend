import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: {
    productId: mongoose.Types.ObjectId;
    quantity: number;
    weight: string; 
  }[];
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: "Online" | "COD";
  paymentStatus: "Pending" | "Paid" | "Completed" | "Failed";
  orderStatus: "Pending" | "Placed" | "Dispatched" | "In-Transit" | "Delivered" | "Cancelled";
  trackingId: string;
  estimatedDelivery: Date;
  razorpayOrderId?: string;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        weight: { type: String, default: "1kg" }, 
      },
    ],
    totalAmount: { type: Number, required: true },
    shippingAddress: { type: String, required: true },
    paymentMethod: { type: String, enum: ["Online", "COD"], default: "Online" },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Completed", "Failed"],
      default: "Pending",
    },
    // Status Enum
    orderStatus: {
      type: String,
      enum: ["Pending", "Placed", "Dispatched", "In-Transit", "Delivered", "Cancelled"],
      default: "Pending",
    },
    trackingId: {
      type: String,
      default: () => `KX${Math.floor(100000 + Math.random() * 900000)}`,
    },
    razorpayOrderId: { type: String },
    estimatedDelivery: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", OrderSchema);