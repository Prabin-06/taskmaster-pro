const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const router = express.Router();

// Input validation helper
const validateInput = (data, rules) => {
  const errors = [];
  
  if (rules.required) {
    rules.required.forEach(field => {
      if (!data[field] || data[field].trim() === "") {
        errors.push(`${field} is required`);
      }
    });
  }
  
  if (rules.email && data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Invalid email format");
    }
  }
  
  if (rules.minLength && data.password) {
    if (data.password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }
  }
  
  if (rules.nameLength && data.name) {
    if (data.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters");
    }
  }
  
  return errors;
};

// Response helper
const sendResponse = (res, success, message, data = null, statusCode = 200) => {
  const response = { success, message };
  if (data) response.data = data;
  return res.status(statusCode).json(response);
};

// Sanitize user data
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    const errors = validateInput({ name, email, password }, {
      required: ["name", "email", "password"],
      email: true,
      minLength: true,
      nameLength: true,
    });
    
    if (errors.length > 0) {
      return sendResponse(res, false, errors[0], null, 400);
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (existingUser) {
      return sendResponse(res, false, "User already exists", null, 409);
    }
    
    // Hash password with better salt rounds
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "7d" }
    );
    
    sendResponse(res, true, "User registered successfully", {
      token,
      user: sanitizeUser(user),
    }, 201);
    
  } catch (err) {
    console.error("Signup error:", err);
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      return sendResponse(res, false, "Email already registered", null, 409);
    }
    
    // Handle validation errors from mongoose
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return sendResponse(res, false, messages[0], null, 400);
    }
    
    sendResponse(res, false, "Server error. Please try again later", null, 500);
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    const errors = validateInput({ email, password }, {
      required: ["email", "password"],
      email: true,
    });
    
    if (errors.length > 0) {
      return sendResponse(res, false, errors[0], null, 400);
    }
    
    // Find user with email normalization
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (!user) {
      return sendResponse(res, false, "Invalid credentials", null, 401);
    }
    
    // Check if user is locked (simple implementation)
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return sendResponse(
        res, 
        false, 
        `Account locked. Try again in ${minutesLeft} minute(s)`, 
        null, 
        423
      );
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      // Simple failed attempt tracking
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
      }
      
      await user.save();
      
      return sendResponse(res, false, "Invalid credentials", null, 401);
    }
    
    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      user.lastLogin = Date.now();
      await user.save();
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "7d" }
    );
    
    sendResponse(res, true, "Login successful", {
      token,
      user: sanitizeUser(user),
    });
    
  } catch (err) {
    console.error("Login error:", err);
    sendResponse(res, false, "Server error. Please try again", null, 500);
  }
});

// GET PROFILE (NEW ENDPOINT)
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    
    if (!user) {
      return sendResponse(res, false, "User not found", null, 404);
    }
    
    sendResponse(res, true, "Profile retrieved", {
      user: sanitizeUser(user),
    });
    
  } catch (err) {
    console.error("Profile fetch error:", err);
    sendResponse(res, false, "Unable to fetch profile", null, 500);
  }
});

// UPDATE PROFILE
router.put("/update-profile", auth, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!name || name.trim() === "") {
      return sendResponse(res, false, "Name is required", null, 400);
    }
    
    if (name.trim().length < 2) {
      return sendResponse(res, false, "Name must be at least 2 characters", null, 400);
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return sendResponse(res, false, "User not found", null, 404);
    }
    
    user.name = name.trim();
    await user.save();
    
    // Update localStorage in frontend (optional)
    const updatedUser = sanitizeUser(user);
    
    sendResponse(res, true, "Profile updated successfully", {
      name: user.name,
      user: updatedUser,
    });
    
  } catch (err) {
    console.error("Profile update error:", err);
    
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return sendResponse(res, false, messages[0], null, 400);
    }
    
    sendResponse(res, false, "Unable to update profile", null, 500);
  }
});

// CHANGE PASSWORD (NEW ENDPOINT)
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return sendResponse(res, false, "Both current and new password are required", null, 400);
    }
    
    if (newPassword.length < 6) {
      return sendResponse(res, false, "New password must be at least 6 characters", null, 400);
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return sendResponse(res, false, "User not found", null, 404);
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return sendResponse(res, false, "Current password is incorrect", null, 401);
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Invalidate old tokens (optional: add token versioning)
    user.passwordChangedAt = Date.now();
    await user.save();
    
    sendResponse(res, true, "Password changed successfully");
    
  } catch (err) {
    console.error("Password change error:", err);
    sendResponse(res, false, "Unable to change password", null, 500);
  }
});

// FORGOT PASSWORD (IMPROVED)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || email.trim() === "") {
      return sendResponse(res, false, "Email is required", null, 400);
    }
    
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    // Don't reveal if user exists (security)
    if (!user) {
      // Still return success to prevent email enumeration
      return sendResponse(res, true, "If an account exists, you will receive a reset link");
    }
    
    // Generate secure reset token with expiry
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour
    
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();
    
    // In production: Send email here
    console.log(`Password reset token for ${user.email}: ${resetToken}`);
    console.log(`Reset link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`);
    
    sendResponse(res, true, "Password reset instructions sent to your email", {
      // Only return token in development
      ...(process.env.NODE_ENV === "development" && { resetToken, resetLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}` })
    });
    
  } catch (err) {
    console.error("Forgot password error:", err);
    sendResponse(res, false, "Unable to process request", null, 500);
  }
});

// RESET PASSWORD (IMPROVED)
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return sendResponse(res, false, "Password must be at least 6 characters", null, 400);
    }
    
    // Find user with valid token (not expired)
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() } // Check token expiry
    });
    
    if (!user) {
      return sendResponse(res, false, "Invalid or expired reset token", null, 400);
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.passwordChangedAt = Date.now();
    
    await user.save();
    
    sendResponse(res, true, "Password reset successful. You can now login with your new password.");
    
  } catch (err) {
    console.error("Reset password error:", err);
    sendResponse(res, false, "Unable to reset password", null, 500);
  }
});

// LOGOUT (OPTIONAL - FRONTEND CLEARS TOKEN)
router.post("/logout", auth, async (req, res) => {
  try {
    // In a real app, you might want to add token to blacklist
    // For now, just acknowledge logout (frontend clears token)
    sendResponse(res, true, "Logged out successfully");
  } catch (err) {
    console.error("Logout error:", err);
    sendResponse(res, false, "Logout failed", null, 500);
  }
});

module.exports = router;