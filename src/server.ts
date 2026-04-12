import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import testRoutes from "./routes/test.routes";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import marketRoutes from "./routes/market.routes";
import chatRoutes from "./routes/chat.routes";
import newsRoutes from "./routes/news.routes";

connectDB();

const app = express();

// 1. Sabse pehle CORS
app.use(cors());

// 2. Body Limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. Routes
app.use("/auth", authRoutes);
app.use("/test", testRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/market", marketRoutes);
app.use("/chat", chatRoutes);
app.use("/news", newsRoutes);

app.get("/", (_req, res) => {
  res.send("KisanX API running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🔥 Server running on port ${PORT}`);
});