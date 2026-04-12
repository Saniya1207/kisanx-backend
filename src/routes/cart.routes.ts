import { Router } from "express";
import Cart from "../models/Cart";
import Product from "../models/Product";
import { protect, customerOnly } from "../middleware/auth.middleware";

const router = Router();

/**
 * ADD TO CART / INITIAL ADD
 * POST /cart
 */
router.post("/", protect, customerOnly, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ message: "Product and quantity required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [{ productId, quantity }]
      });
    } else {
      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
        // Agar product pehle se hai, toh quantity badhao
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Naya item add karo
        cart.items.push({ productId, quantity });
      }

      await cart.save();
    }

    res.json({ message: "Added to cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Add to cart failed" });
  }
});

/**
 * UPDATE QUANTITY (Used by Stepper +/- Buttons)
 * PUT /cart/update
 */
router.put("/update", protect, customerOnly, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    if (quantity <= 0) {
      // Agar quantity 0 ya kam ho jaye, toh item remove kar do
      cart.items.splice(itemIndex, 1);
    } else {
      // Quantity update karo
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    const updatedCart = await Cart.findOne({ userId }).populate("items.productId", "name price image");
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: "Update quantity failed" });
  }
});

/**
 * VIEW CART
 * GET /cart
 */
router.get("/", protect, customerOnly, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const cart = await Cart.findOne({ userId }).populate(
      "items.productId",
      "name price image category"
    );

    res.json(cart || { items: [] });
  } catch (error) {
    res.status(500).json({ message: "Fetch cart failed" });
  }
});

/**
 * REMOVE SINGLE ITEM
 * DELETE /cart/:productId
 */
router.delete("/:productId", protect, customerOnly, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    await cart.save();
    res.json({ message: "Item removed", cart });
  } catch (error) {
    res.status(500).json({ message: "Remove item failed" });
  }
});

/**
 * CLEAR CART (Internal helper)
 */
export const clearCart = async (userId: string) => {
  await Cart.findOneAndDelete({ userId });
};

export default router;