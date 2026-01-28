const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

/* ================= HELPERS ================= */

const sendResponse = (res, success, message, data = null, status = 200) => {
  const response = { success, message };
  if (data) response.data = data;
  return res.status(status).json(response);
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

/* ================= SIGNUP ================= */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // ❗ DO NOT HASH HERE
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
    });

  } catch (err) {
    console.error("Signup error:", err);   // 👈 THIS will show real error
    res.status(500).json({ message: "Server error" });
  }
});


/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return sendResponse(res, false, "Email and password required", null, 400);

    // ❗ MUST select password manually
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password +passwordVersion");

    if (!user)
      return sendResponse(res, false, "Invalid credentials", null, 401);

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return sendResponse(res, false, `Account locked. Try again in ${minutes} minutes`, null, 423);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementFailedAttempts();
      return sendResponse(res, false, "Invalid credentials", null, 401);
    }

    await user.resetFailedAttempts();

    const token = jwt.sign(
      { id: user._id, pv: user.passwordVersion },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    sendResponse(res, true, "Login successful", {
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    sendResponse(res, false, "Server error", null, 500);
  }
});

/* ================= PROFILE ================= */
router.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return sendResponse(res, false, "User not found", null, 404);
  sendResponse(res, true, "Profile retrieved", { user: sanitizeUser(user) });
});

/* ================= UPDATE PROFILE ================= */
router.put("/update-profile", auth, async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2)
    return sendResponse(res, false, "Name must be at least 2 characters", null, 400);

  const user = await User.findById(req.user.id);
  user.name = name.trim();
  await user.save();

  sendResponse(res, true, "Profile updated", { user: sanitizeUser(user) });
});

/* ================= CHANGE PASSWORD ================= */
router.put("/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || newPassword.length < 6)
    return sendResponse(res, false, "Invalid password input", null, 400);

  const user = await User.findById(req.user.id).select("+password");

  const match = await user.comparePassword(currentPassword);
  if (!match)
    return sendResponse(res, false, "Current password is incorrect", null, 401);

  user.password = newPassword; // model hashes
  await user.save();

  sendResponse(res, true, "Password changed successfully");
});

/* ================= FORGOT PASSWORD ================= */
router.post("/forgot-password", async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase().trim() });

  if (!user)
    return sendResponse(res, true, "If an account exists, a reset link was sent");

  const resetToken = await user.generateResetToken();

  console.log(`Reset link: ${process.env.FRONTEND_URL}/reset-password/${resetToken}`);

  sendResponse(
    res,
    true,
    "Reset instructions sent",
    process.env.NODE_ENV === "development" ? { resetToken } : null
  );
});

/* ================= RESET PASSWORD ================= */
router.post("/reset-password/:token", async (req, res) => {
  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpiry: { $gt: Date.now() },
  }).select("+password");

  if (!user)
    return sendResponse(res, false, "Invalid or expired token", null, 400);

  if (!req.body.password || req.body.password.length < 6)
    return sendResponse(res, false, "Password must be at least 6 characters", null, 400);

  user.password = req.body.password; // model hashes
  await user.clearResetToken();

  sendResponse(res, true, "Password reset successful");
});

/* ================= LOGOUT ================= */
router.post("/logout", auth, (req, res) => {
  sendResponse(res, true, "Logged out successfully");
});

module.exports = router;
