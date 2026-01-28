const express = require("express")
const Task = require("../models/Task")
const auth = require("../middleware/authMiddleware")

const router = express.Router()

// Add new task
router.post("/add", auth, async (req, res) => {
  try {
    const { title, priority, dueDate } = req.body

    const task = new Task({
      userId: req.user.id,
      title,
      priority,
      dueDate
    })

    await task.save()
    res.status(201).json({ message: "Task added successfully", task })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


// Get all tasks of logged-in user
router.get("/my", auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id })
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete task
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    res.json({ message: "Task deleted successfully" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update task (mark complete / incomplete)
router.put("/update/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { completed: req.body.completed },
      { new: true }
    )

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    res.json({ message: "Task updated successfully", task })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


module.exports = router
