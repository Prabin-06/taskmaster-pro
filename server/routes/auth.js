const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const User = require("../models/User")
const auth = require("../middleware/authMiddleware")
const router = express.Router()

// SIGNUP
router.post("/signup", async (req, res) => {
  console.log("SIGNUP BODY RECEIVED:", req.body)

  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      name,
      email,
      password: hashedPassword,
    })

    await user.save()

    res.status(201).json({ message: "User registered successfully" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "User not found" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// UPDATE PROFILE NAME
router.put("/update-profile", auth, async (req, res) => {
  try {
    const { name } = req.body
    const userId = req.user.id  // comes from auth middleware

    if (!name) {
      return res.status(400).json({ message: "Name is required" })
    }

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: "User not found" })

    user.name = name
    await user.save()

    res.json({ message: "Profile updated", name: user.name })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const resetToken = crypto.randomBytes(20).toString("hex")
    user.resetToken = resetToken
    await user.save()

    res.json({
      message: "Reset token generated",
      resetToken, // In real apps this is emailed
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


// RESET PASSWORD
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body

    const user = await User.findOne({ resetToken: req.params.token })
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" })
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)
    user.resetToken = undefined

    await user.save()

    res.json({ message: "Password reset successful" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
