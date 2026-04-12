import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    
    // ✅ CHANGE YAHAN - MONGODB_URI (not MONGO_URI)
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error("MONGODB_URI not found in .env file!");
    }
    
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed", error);
    process.exit(1);
  }
};