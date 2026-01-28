const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password by default
    },

    /* 🔐 Security */
    passwordVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },

    /* 🔁 Reset Password */
    resetToken: {
      type: String,
      select: false,
    },
    resetTokenExpiry: {
      type: Date,
      select: false,
    },

    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

/* ================= PASSWORD HASHING ================= */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  // Always set passwordVersion
  this.passwordVersion = (this.passwordVersion ?? 0) + 1;
});


/* ================= PASSWORD METHODS ================= */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ================= LOGIN ATTEMPT SECURITY ================= */
userSchema.methods.incrementFailedAttempts = async function () {
  this.failedLoginAttempts += 1;

  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = Date.now() + 30 * 60 * 1000; // 30 min lock
  }

  return await this.save();
};

userSchema.methods.resetFailedAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = Date.now();
  return await this.save();
};

/* ================= RESET TOKEN METHODS ================= */
userSchema.methods.generateResetToken = async function () {
  const crypto = require("crypto");
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetToken = resetToken;
  this.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  await this.save();

  return resetToken;
};

userSchema.methods.clearResetToken = async function () {
  this.resetToken = undefined;
  this.resetTokenExpiry = undefined;
  return await this.save();
};

module.exports = mongoose.model("User", userSchema);
