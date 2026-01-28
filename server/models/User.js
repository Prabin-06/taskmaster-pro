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
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },
    resetToken: {
      type: String,
      select: false,
    },
    resetTokenExpiry: {
      type: Date,
      select: false,
    },
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
    lastLogin: {
      type: Date,
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },
    deletedAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.resetToken;
        delete ret.resetTokenExpiry;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        delete ret.passwordVersion;
        delete ret.deletedAt;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.resetToken;
        delete ret.resetTokenExpiry;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        delete ret.passwordVersion;
        delete ret.deletedAt;
        return ret;
      },
    },
  }
);

// Virtual for checking if account is locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for checking if account is deleted
userSchema.virtual("isDeleted").get(function () {
  return !!this.deletedAt;
});

// Index for better query performance
userSchema.index({ email: 1, deletedAt: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });

// Middleware to hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(12);
    
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    
    // Increment password version when password changes
    this.passwordVersion = (this.passwordVersion || 0) + 1;
    
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware to update timestamps on certain operations
userSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
};

// Method to increment failed login attempts
userSchema.methods.incrementFailedAttempts = async function () {
  this.failedLoginAttempts += 1;
  
  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
  }
  
  return await this.save();
};

// Method to reset failed attempts after successful login
userSchema.methods.resetFailedAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = Date.now();
  return await this.save();
};

// Method to generate reset token
userSchema.methods.generateResetToken = async function () {
  const crypto = require("crypto");
  const resetToken = crypto.randomBytes(32).toString("hex");
  
  this.resetToken = resetToken;
  this.resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
  
  await this.save();
  return resetToken;
};

// Method to clear reset token
userSchema.methods.clearResetToken = async function () {
  this.resetToken = undefined;
  this.resetTokenExpiry = undefined;
  return await this.save();
};

// Method to soft delete user
userSchema.methods.softDelete = async function () {
  this.deletedAt = Date.now();
  this.email = `${this.email}.deleted.${Date.now()}`; // Make email unusable
  this.isActive = false;
  return await this.save();
};

// Static method to find active users only
userSchema.statics.findActive = function () {
  return this.find({ 
    deletedAt: { $exists: false },
    isActive: true 
  });
};

// Static method to find by email (including deleted check)
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ 
    email: email.toLowerCase().trim(),
    deletedAt: { $exists: false }
  });
};

// Query helper to exclude deleted users
userSchema.query.active = function () {
  return this.where({ 
    deletedAt: { $exists: false },
    isActive: true 
  });
};

// Query helper to include deleted users
userSchema.query.withDeleted = function () {
  return this.where({});
};

module.exports = mongoose.model("User", userSchema);