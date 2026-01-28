require("dotenv").config()


const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config()
const authRoutes = require("./routes/auth")
const taskRoutes = require("./routes/task")

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/task", taskRoutes)

const auth = require("./middleware/authMiddleware")

app.get("/api/private", auth, (req, res) => {
  res.json({ message: "You are authorized 🎉", userId: req.user.id })
})

app.get("/", (req, res) => {
  res.send("Task Manager API running 🚀")
})

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(5000, () => console.log("Server running on port 5000"))
  })
  .catch(err => console.log(err))
