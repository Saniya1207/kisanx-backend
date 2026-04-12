import { Router } from "express";
import Order from "../models/Order"; 
import Product from "../models/Product";
import User from "../models/User";
import { protect, customerOnly } from "../middleware/auth.middleware";
import { clearCart } from "./cart.routes";
import { sendPushNotification } from "../utils/notifications";
import Razorpay from "razorpay";

const router = Router();

// ✅ Razorpay instance ko upar initialize karna zaroori hai
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
});
/**
 * FARMER: Get orders for products belonging to the logged-in farmer
 */
router.get("/farmer", protect, async (req: any, res) => {
  try {
    const farmerProducts = await Product.find({ farmerId: req.user.id });
    const productIds = farmerProducts.map(p => p._id);
    const orders = await Order.find({ "items.productId": { $in: productIds } })
      .populate("userId", "firstName lastName phone")
      .populate("items.productId")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) { 
    res.status(500).json({ message: "Failed to fetch farmer orders" }); 
  }
});

/**
 * FARMER: Update Order Status & Points Logic
 */
router.put("/update-status/:id", protect, async (req: any, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate("items.productId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status === "Delivered" && order.orderStatus !== "Delivered") {
      const farmerIdsAwarded = new Set<string>();
      for (const item of order.items) {
        if (item.productId) {
          const product = await Product.findById((item.productId as any)._id || item.productId);
          if (product && product.farmerId) {
            const farmerIdStr = product.farmerId.toString();
            if (!farmerIdsAwarded.has(farmerIdStr)) {
              farmerIdsAwarded.add(farmerIdStr);
              await User.findByIdAndUpdate(product.farmerId, { $inc: { points: 10 } });
            }
          }
        }
      }

      const customer = await User.findById(order.userId);
      if (customer?.pushToken) {
          let title = "📦 Order Update!";
          let body = `Aapka order #${order.trackingId} ab ${status} ho chuka hai.`;
          if (status === "Delivered") {
              title = "🎉 Order Delivered!";
              body = "Khushkhabri! Aapka fresh saaman pahunch gaya hai. 🍎";
          }
          await sendPushNotification(customer.pushToken, title, body);
      }
      await User.findByIdAndUpdate(order.userId, { $inc: { points: 10 } });
    }

    order.orderStatus = status;
    await order.save();
    res.json({ success: true, message: "Status updated successfully", orderStatus: order.orderStatus });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
});

/**
 * CUSTOMER: Checkout and Place Order (Integrated Stock Check & Razorpay)
 */
router.post("/checkout", protect, customerOnly, async (req: any, res) => {
  try {
    const { amount, address, items, paymentMethod } = req.body;

    // 1. Stock Check Logic
    for (const item of items) {
      const product = await Product.findById(item._id);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.name}` });

      const weightStr = String(item.selectedWeight || "1kg").toLowerCase();
      const weightVal = parseFloat(weightStr);
      const isGram = weightStr.includes('g') && !weightStr.includes('kg');
      const weightInKg = (isGram ? weightVal / 1000 : weightVal) * item.quantity;

      if (product.quantity < weightInKg) {
        return res.status(400).json({ success: false, message: `Insufficient stock for: ${product.name}` });
      }
    }

    // 2. Create Order in Database
    const newOrder = await Order.create({
      userId: req.user.id,
      items: items.map((i: any) => ({ 
        productId: i._id, 
        quantity: i.quantity, 
        weight: i.selectedWeight 
      })),
      totalAmount: amount,
      shippingAddress: address,
      paymentMethod,
      orderStatus: "Placed",
      paymentStatus: "Pending",
      trackingId: `KX${Math.floor(100000 + Math.random() * 900000)}`
    });

    // 3. Stock Deduct
    for (const item of items) {
      const weightStr = String(item.selectedWeight || "1kg").toLowerCase();
      const weightVal = parseFloat(weightStr);
      const isGram = weightStr.includes('g') && !weightStr.includes('kg');
      const weightInKg = (isGram ? weightVal / 1000 : weightVal) * item.quantity;
      await Product.findByIdAndUpdate(item._id, { $inc: { quantity: -weightInKg } });
    }

    // 4. Handle Online Payment (Razorpay)
    if (paymentMethod === "Online") {
      const options = {
        amount: Math.round(amount * 100), // paise mein
        currency: "INR",
        receipt: `receipt_${newOrder._id}`,
      };
      
      // Razorpay order create karein
      const razorpayOrder = await razorpay.orders.create(options);
      
      // DB mein Razorpay Order ID save karein
      newOrder.razorpayOrderId = razorpayOrder.id;
      await newOrder.save();
      
      // Frontend ko exactly ye keys bhejein
      return res.status(201).json({ 
        success: true, 
        orderId: newOrder._id,         // DB Order ID
        razorpayOrderId: razorpayOrder.id // Razorpay Order ID (rzp_order_...)
      });
    }

    // 5. Handle COD
    await clearCart(req.user.id);
    res.status(201).json({ success: true, orderId: newOrder._id });

  } catch (error: any) { 
    res.status(500).json({ success: false, message: error.message }); 
  }
});

/**
 * ONLINE PAYMENT VERIFICATION
 */
router.post("/verify-payment", protect, customerOnly, async (req: any, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await Order.findById(orderId).populate("items.productId");

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (status === "success") {
      order.paymentStatus = "Paid";
      order.orderStatus = "Placed";
      await order.save();
      await clearCart(req.user.id);
      return res.json({ success: true, message: "Payment Verified Successfully" });
    } else {
      // Revert Stock if payment fails
      for (const item of order.items) {
        if (item.productId) {
            const weightStr = String(item.weight || "1kg").toLowerCase();
            const weightVal = parseFloat(weightStr);
            const isGram = weightStr.includes('g') && !weightStr.includes('kg');
            const weightInKg = (isGram ? weightVal / 1000 : weightVal) * item.quantity;
            await Product.findByIdAndUpdate(item.productId._id, { $inc: { quantity: weightInKg } });
        }
      }
      order.paymentStatus = "Failed";
      order.orderStatus = "Cancelled";
      await order.save();
      return res.status(400).json({ success: false, message: "Payment Failed. Stock Reverted." });
    }
  } catch (error: any) { 
    res.status(500).json({ message: "Internal Server Error during verification" }); 
  }
});

router.get("/my-orders", protect, customerOnly, async (req: any, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).populate("items.productId").sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) { res.status(500).json({ message: "Error fetching orders" }); }
});

router.get("/track/:id", protect, customerOnly, async (req: any, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ status: order.orderStatus, trackingId: order.trackingId, address: order.shippingAddress });
  } catch (error) { res.status(500).json({ message: "Error tracking order" }); }
});

router.patch("/cancel/:id", protect, customerOnly, async (req: any, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id }).populate("items.productId");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (["Dispatched", "Delivered", "Cancelled"].includes(order.orderStatus)) {
      return res.status(400).json({ message: "Cannot cancel order in current status" });
    }
    for (const item of order.items) {
      if (item.productId) {
          const weightStr = String(item.weight || "1kg").toLowerCase();
          const weightVal = parseFloat(weightStr);
          const isGram = weightStr.includes('g') && !weightStr.includes('kg');
          const weightInKg = (isGram ? weightVal / 1000 : weightVal) * item.quantity;
          await Product.findByIdAndUpdate(item.productId._id, { $inc: { quantity: weightInKg } });
      }
    }
    order.orderStatus = "Cancelled";
    await order.save();
    res.json({ message: "Order cancelled successfully and stock restored" });
  } catch (error) { res.status(500).json({ message: "Error cancelling order" }); }
});

export default router;