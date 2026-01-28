const express = require("express");
const Task = require("../models/Task");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

/* ================= ADD TASK ================= */
router.post("/add", auth, async (req, res) => {
  try {
    const { title, priority, dueDate } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Task title is required" });
    }

    const task = await Task.create({
      userId: req.user.id,
      title: title.trim(),
      priority: ["High", "Medium", "Low"].includes(priority) ? priority : "Medium",
      dueDate: dueDate || null,
    });

    res.status(201).json({ message: "Task added successfully", task });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET USER TASKS ================= */
router.get("/my", auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE TASK ================= */
router.put("/update/:id", auth, async (req, res) => {
  try {
    const updates = {};

    if (req.body.title !== undefined) updates.title = req.body.title.trim();
    if (req.body.priority && ["High", "Medium", "Low"].includes(req.body.priority))
      updates.priority = req.body.priority;
    if (req.body.dueDate !== undefined) updates.dueDate = req.body.dueDate;
    if (req.body.completed !== undefined) updates.completed = req.body.completed;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updates,
      { new: true }
    );

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task updated successfully", task });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= DELETE TASK ================= */
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
