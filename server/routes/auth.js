const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const router = express.Router();

/* =========================
   HELPERS
========================= */

const validateInput = (data, rules) => {
  const errors = [];

  if (rules.required) {
    rules.required.forEach((field) => {
      if (!data[field] || data[field].trim() === "") {
        errors.push(`${field} is required`);
      }
    });
  }

  if (rules.email && data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) errors.push("Invalid email format");
  }

  if (rules.password && data.password && data.password.length < 6)
    errors.push("Password must be at least 6 characters");

  if (rules.name && data.name && data.name.trim().length < 2)
    errors.push("Name must be at least 2 characters");

  return errors;
};

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

/* =========================
   SIGNUP
========================= */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const errors = validateInput(
      { name, email, password },
      { required: ["name", "email", "password"], email: true, password: true, name: true }
    );
    if (errors.length) return sendResponse(res, false, errors[0], null, 400);

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) return sendResponse(res, false, "User already exists", null, 409);

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    sendResponse(res, true, "User registered successfully", {
      token,
      user: sanitizeUser(user),
    }, 201);
  } catch (err) {
    console.error("Signup error:", err);
    sendResponse(res, false, "Server error", null, 500);
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const errors = validateInput(
      { email, password },
      { required: ["email", "password"], email: true }
    );
    if (errors.length) return sendResponse(res, false, errors[0], null, 400);

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return sendResponse(res, false, "Invalid credentials", null, 401);

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return sendResponse(res, false, `Account locked. Try again in ${minutes} minutes`, null, 423);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) user.lockUntil = Date.now() + 30 * 60 * 1000;
      await user.save();
      return sendResponse(res, false, "Invalid credentials", null, 401);
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    sendResponse(res, true, "Login successful", {
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    sendResponse(res, false, "Server error", null, 500);
  }
});

/* =========================
   GET PROFILE
========================= */
router.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return sendResponse(res, false, "User not found", null, 404);
  sendResponse(res, true, "Profile retrieved", { user: sanitizeUser(user) });
});

/* =========================
   UPDATE PROFILE
========================= */
router.put("/update-profile", auth, async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2)
    return sendResponse(res, false, "Name must be at least 2 characters", null, 400);

  const user = await User.findById(req.user.id);
  user.name = name.trim();
  await user.save();

  sendResponse(res, true, "Profile updated", { user: sanitizeUser(user) });
});

/* =========================
   CHANGE PASSWORD
========================= */
router.put("/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || newPassword.length < 6)
    return sendResponse(res, false, "Invalid password input", null, 400);

  const user = await User.findById(req.user.id);
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return sendResponse(res, false, "Current password is incorrect", null, 401);

  user.password = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = Date.now();
  await user.save();

  sendResponse(res, true, "Password changed successfully");
});

/* =========================
   FORGOT PASSWORD
========================= */
router.post("/forgot-password", async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase().trim() });
  if (!user) return sendResponse(res, true, "If an account exists, a reset link was sent");

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetToken = resetToken;
  user.resetTokenExpiry = Date.now() + 3600000;
  await user.save();

  console.log(`Reset link: ${process.env.FRONTEND_URL}/reset-password/${resetToken}`);

  sendResponse(res, true, "Reset instructions sent", process.env.NODE_ENV === "development" ? { resetToken } : null);
});

/* =========================
   RESET PASSWORD
========================= */
router.post("/reset-password/:token", async (req, res) => {
  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) return sendResponse(res, false, "Invalid or expired token", null, 400);
  if (!req.body.password || req.body.password.length < 6)
    return sendResponse(res, false, "Password must be at least 6 characters", null, 400);

  user.password = await bcrypt.hash(req.body.password, 12);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  sendResponse(res, true, "Password reset successful");
});

/* =========================
   LOGOUT
========================= */
router.post("/logout", auth, (req, res) => {
  sendResponse(res, true, "Logged out successfully");
});

module.exports = router;
