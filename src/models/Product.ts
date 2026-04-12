import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: "vegetables" | "fruits" | "grains" | "spices";
  unit?: string;         
  pricePerUnit?: number;
  image?: string;
  offerText?: string;
  deliveryType?: string;
  rating?: number;
  farmerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      maxlength: 120, // small description like Flipkart/Meesho cards
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      enum: ["vegetables", "fruits", "grains", "spices"],
      required: true,
    },

    unit: { 
      type: String,
      default: "kg" },

    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce",
    },

    offerText: {
      type: String,
      default: "", // e.g. "20% OFF", "Special Offer"
    },

    deliveryType: {
      type: String,
      default: "Free Delivery",
    },

    rating: {
      type: Number,
      default: 4.0,
      min: 0,
      max: 5,
    },

    farmerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProduct>("Product", ProductSchema);
