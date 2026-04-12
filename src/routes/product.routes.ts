import { Router } from "express";
import Product from "../models/Product";
import { protect, farmerOnly } from "../middleware/auth.middleware";

const router = Router();

// Customer: View All Products
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find()
      .populate("farmerId", "firstName lastName")
      .exec();
    const activeProducts = products.filter(p => p.farmerId !== null);
    res.json(activeProducts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Single Product Details
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "farmerId",
      "firstName lastName phone"
    );
    if (!product || !product.farmerId) {
      return res.status(404).json({ message: "Product or Farmer not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product details" });
  }
});

// Farmer: Add Product with Price Normalization
router.post("/", protect, farmerOnly, async (req, res) => {
  try {
    let { name, description, price, quantity, category, image, unit } = req.body;
    if (!name || price == null || quantity == null || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let storePrice = Number(price);
    let storeQuantity = Number(quantity);

    if (unit?.toLowerCase() === "quintal") {
      storePrice = storePrice / 100;       
      storeQuantity = storeQuantity * 100; 
    }

    const farmerId = (req as any).user.id;
    const product = await Product.create({
      name,
      description,
      price: storePrice,       
      quantity: storeQuantity, 
      farmerId,
      category,
      unit: "kg",              
      image: image || "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce"
    });

    res.status(201).json({ message: "Product added successfully", product });
  } catch (error) {
    res.status(500).json({ message: "Failed to add product" });
  }
});

//  UPDATED: Product delete logic
router.delete("/:id", protect, farmerOnly, async (req, res) => {
  try {
    const productId = req.params.id;
    const farmerId = (req as any).user.id;

    // Check if product exists and belongs to this farmer before deleting
    const product = await Product.findOneAndDelete({ _id: productId, farmerId });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    res.json({ message: "Product deleted successfully from market" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
});

export default router;