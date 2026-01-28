import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

const priorityColors = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const priorityIcons = {
  High: "🔴",
  Medium: "🟡",
  Low: "🟢",
};

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  /* FETCH TASKS */
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/task/my");
      setTasks(res.data.data || res.data || []);
    } catch {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /* ADD TASK */
  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Task title is required");

    try {
      setIsAdding(true);
      const res = await api.post("/api/task/add", { title, priority, dueDate });
      const newTask = res.data?.data?.task || res.data?.task || res.data;
      setTasks((prev) => [newTask, ...prev]);
      setTitle("");
      setPriority("Medium");
      setDueDate("");
      setError("");
    } catch {
      setError("Failed to add task");
    } finally {
      setIsAdding(false);
    }
  };

  /* TOGGLE TASK */
  const toggleTask = async (id, completed) => {
    try {
      const res = await api.put(`/api/task/update/${id}`, { completed: !completed });
      const updatedTask = res.data?.data?.task || res.data?.task || res.data;
      setTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));
    } catch {
      setError("Failed to update task");
    }
  };

  /* DELETE TASK */
  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/api/task/delete/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch {
      setError("Failed to delete task");
    }
  };

  /* FILTERING */
  const filteredTasks = tasks
    .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => {
      if (filter === "All") return true;
      if (filter === "Completed") return t.completed;
      if (filter === "Pending") return !t.completed;
      if (filter === "High") return t.priority === "High";
      return true;
    });

  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-6">

      {/* HEADER */}
      <div className="bg-white shadow-sm rounded-xl px-6 py-4 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">TaskMaster Pro</h1>
          <p className="text-sm text-gray-500">Welcome back, {user.name || "User"}</p>
        </div>

        <div className="flex gap-3">
          <Link to="/profile" className="px-4 py-2 rounded-lg border hover:bg-gray-50">
            Profile
          </Link>
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
          >
            Logout
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Tasks</p>
          <p className="text-2xl font-bold">{tasks.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pendingTasks}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-8 flex flex-col md:flex-row gap-4 justify-between">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border rounded-lg"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="All">All Tasks</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="High">High Priority</option>
        </select>
      </div>

      {/* ADD TASK */}
      <form onSubmit={addTask} className="bg-white p-6 rounded-xl shadow-sm border mb-8 space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="w-full p-3 border rounded-lg"
        />
        <div className="flex gap-4">
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="p-3 border rounded-lg">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="p-3 border rounded-lg" />
        </div>
        <button disabled={isAdding} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
          {isAdding ? "Adding..." : "Add Task"}
        </button>
      </form>

      {/* TASK LIST */}
      <div className="space-y-4">
        {loading ? (
          <p>Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border shadow-sm">
            <p className="text-lg font-semibold">No tasks found</p>
            <p className="text-sm text-gray-500">Add a task to get started</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task._id} className="p-5 bg-white rounded-xl border shadow-sm flex justify-between items-center hover:shadow-md transition">
              <div onClick={() => toggleTask(task._id, task.completed)} className="cursor-pointer">
                <p className={`font-semibold ${task.completed ? "line-through text-gray-400" : ""}`}>
                  {task.title}
                </p>
                <div className="flex gap-2 mt-1 items-center">
                  <span className={`text-xs px-2 py-1 rounded-full border ${priorityColors[task.priority]}`}>
                    {priorityIcons[task.priority]} {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-gray-500">
                      📅 {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => deleteTask(task._id)} className="text-red-500 hover:underline text-sm">
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
