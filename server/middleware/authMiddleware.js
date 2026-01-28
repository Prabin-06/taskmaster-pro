const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, access denied" })
  }

  // 🔑 Remove "Bearer "
  const token = authHeader.split(" ")[1]

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET)
    req.user = verified
    next()
  } catch (err) {
    res.status(401).json({ message: "Invalid token" })
  }
}
