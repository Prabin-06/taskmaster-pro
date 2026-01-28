const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("+passwordVersion");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // 🔒 Invalidate old tokens if password was changed
    if ((decoded.pv ?? 0) !== (user.passwordVersion ?? 0)) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }

    req.user = { id: user._id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
