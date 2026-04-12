import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Order from "../models/Order";
import Product from "../models/Product";
import { protect } from "../middleware/auth.middleware";
import bcrypt from "bcryptjs";

// Brevo (sib-api-v3-sdk) import
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKeyAuth = defaultClient.authentications['api-key'];
apiKeyAuth.apiKey = process.env.BREVO_API_KEY || "";
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const router = Router();

// Temporary storage for registration OTPs
const otpStore: { [key: string]: { otp: string, expires: number } } = {};

// Helper: Send Mail using Brevo
const sendEmailOTP = async (email: string, otp: string, subject: string) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>KisanX Verification</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2e7d32, #66bb6a); padding: 36px 40px; text-align:center;">
                  <h1 style="margin:0; color:#ffffff; font-size:28px; letter-spacing:1px;">🌾 KisanX</h1>
                  <p style="margin:6px 0 0; color:#c8e6c9; font-size:14px;">Empowering Farmers, Connecting Markets</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px 40px 30px;">
                  <h2 style="margin:0 0 10px; color:#1b5e20; font-size:22px;">Verification Code</h2>
                  <p style="margin:0 0 24px; color:#555555; font-size:15px; line-height:1.6;">
                    We received a request to verify your identity. Please use the OTP below to proceed. This code is valid for <strong>10 minutes</strong>.
                  </p>

                  <!-- OTP Box -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 10px 0 30px;">
                        <div style="display:inline-block; background-color:#f1f8e9; border: 2px dashed #66bb6a; border-radius:10px; padding: 20px 50px;">
                          <span style="font-size:38px; font-weight:700; letter-spacing:10px; color:#2e7d32;">${otp}</span>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0 0 10px; color:#777777; font-size:13px; line-height:1.6;">
                    If you did not request this code, please ignore this email or contact our support team immediately. Do not share this OTP with anyone.
                  </p>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding: 0 40px;">
                  <hr style="border:none; border-top:1px solid #e8f5e9; margin:0;" />
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 40px; text-align:center;">
                  <p style="margin:0; color:#aaaaaa; font-size:12px;">
                    © ${new Date().getFullYear()} KisanX. All rights reserved.<br/>
                    This is an automated email. Please do not reply to this message.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  sendSmtpEmail.sender = { name: "KisanX Support", email: "saniya122400@gmail.com" };
  sendSmtpEmail.to = [{ email: email }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully via Brevo to:", email);
  } catch (error) {
    console.error("Brevo Error:", error);
    throw new Error("Email sending failed");
  }
};

// 1 ROUTE: SEND OTP
router.post("/send-registration-otp", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email.toLowerCase()] = { otp, expires: Date.now() + 600000 };

    await sendEmailOTP(email.toLowerCase(), otp, "KisanX Email Verification Code");
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// 2 ROUTE: VERIFY OTP
router.post("/verify-registration-otp", async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const record = otpStore[email.toLowerCase()];

  if (record && record.otp === otp && record.expires > Date.now()) {
    delete otpStore[email.toLowerCase()];
    res.json({ success: true, message: "Email verified successfully" });
  } else {
    res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  }
});

// 3 ROUTE: REGISTER ✅ FIXED
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, phone, role, address, farmName, location, isVerified } = req.body;

    // Required fields check
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "firstName, lastName, email aur password zaroori hain" });
    }

    if (!isVerified) {
      return res.status(400).json({ message: "Please verify your email first" });
    }

    // Duplicate user check
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "Yeh email already registered hai" });
    }

    //  Plain password bhejo — User model ka pre-save hook khud hash karega
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,   //Plain password — pre-save hook hash karega
      phone,
      role,
      address,
      farmName,
      location,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: { id: user._id, firstName: user.firstName, role: user.role },
    });

  } catch (error: any) {
    // Mongoose validation errors 
    console.error("❌ Register Error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e: any) => e.message).join(", ");
      return res.status(400).json({ message: `Validation Error: ${messages}` });
    }

    if (error.code === 11000) {
      return res.status(400).json({ message: "Yeh email already registered hai (duplicate)" });
    }

    res.status(500).json({ message: error.message || "Registration failed" });
  }
});

// LOGIN
router.post("/login", async (req: Request, res: Response) => {
  const { email, password, pushToken } = req.body; // ✅ pushToken add kiya
  try {
    const user = await User.findOne({ email }).select("+password");
    if (user && (await bcrypt.compare(password, user.password))) {
      
      // pushToken save karo agar mila toh
      if (pushToken) {
        await User.findByIdAndUpdate(user._id, { pushToken });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );
      res.json({ token, user: { id: user._id, firstName: user.firstName, role: user.role } });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req: Request, res: Response) => {
  const { contact, method } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: contact }, { phone: contact }]
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[contact] = { otp, expires: Date.now() + 600000 };

    if (method === "email") {
      await sendEmailOTP(contact, otp, "KisanX Password Reset OTP");
    } else {
      console.log(`[SIMULATION] SMS Sent to ${contact}: Your OTP is ${otp}`);
    }

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req: Request, res: Response) => {
  const { contact, otp, newPassword } = req.body;
  const record = otpStore[contact];

  if (!record || record.otp !== otp || record.expires < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP. Password not changed." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findOneAndUpdate(
      { $or: [{ email: contact }, { phone: contact }] },
      { password: hashedPassword }
    );

    delete otpStore[contact];
    res.json({ message: "Success" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update password" });
  }
});

// ME ROUTE
router.get("/me", protect, async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    let salesOrOrdersCount = 0;

    if (user.role === "farmer") {
      const farmerProducts = await Product.find({ farmerId: req.user.id });
      const productIds = farmerProducts.map(p => p._id);
      salesOrOrdersCount = await Order.countDocuments({
        "items.productId": { $in: productIds },
        orderStatus: "Delivered"
      });
    } else {
      salesOrOrdersCount = await Order.countDocuments({
        userId: req.user.id,
        orderStatus: { $ne: "Cancelled" }
      });
    }

    res.json({
      ...user.toObject(),
      orderCount: salesOrOrdersCount,
      points: user.points || 0
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

router.put("/update", protect, async (req: any, res: Response) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, { new: true }).select("-password");
    res.json({ message: "Success", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

// DELETE USER ROUTE
router.delete("/delete-user/:id", protect, async (req: any, res: Response) => {
  try {
    const userIdToDelete = req.params.id;
    if (req.user.id !== userIdToDelete) {
      return res.status(403).json({ message: "Access denied. You can only delete your own account." });
    }
    await User.findByIdAndDelete(userIdToDelete);
    res.json({ message: "User account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user account" });
  }
});

export default router;