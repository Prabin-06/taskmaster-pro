import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

// Task Priority Colors
const priorityColors = {
  High: "bg-red-100 text-red-800 border-red-200",
  Medium: "bg-amber-100 text-amber-800 border-amber-200",
  Low: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

// Priority Icons
const priorityIcons = {
  High: "🟥",
  Medium: "🟨",
  Low: "🟩",
};

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const navigate = useNavigate();

  /* AUTH CHECK */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      navigate("/login");
      return;
    }

    if (storedUser) setUser(JSON.parse(storedUser));
    setReady(true);
  }, [navigate]);

  /* USER SYNC (ONLY ONCE) */
  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    window.addEventListener("userUpdated", syncUser);
    return () => window.removeEventListener("userUpdated", syncUser);
  }, []);

  /* FETCH TASKS */
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/task/my");
      setTasks(res.data || []);
    } catch {
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) fetchTasks();
  }, [ready, fetchTasks]);

  /* ADD TASK */
  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Task title is required");

    try {
      setIsAdding(true);
      await api.post("/api/task/add", { title, priority, dueDate });
      await fetchTasks();
      setTitle("");
      setPriority("Medium");
      setDueDate("");
      setError("");
    } catch {
      setError("Failed to add task. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  /* TOGGLE TASK */
  const toggleTask = async (id, completed) => {
    try {
      await api.put(`/api/task/update/${id}`, { completed: !completed });
      fetchTasks();
    } catch {
      setError("Failed to update task status.");
    }
  };

  /* DELETE TASK */
  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/api/task/delete/${id}`);
      fetchTasks();
    } catch {
      setError("Failed to delete task.");
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

  if (!ready) return <div className="p-10 text-center">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user?.name || "User"} 👋</h1>
        <div className="flex gap-4">
          <Link to="/profile" className="text-blue-600 hover:underline">Profile</Link>
          <button onClick={() => { localStorage.clear(); navigate("/login"); }} className="bg-black text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* ADD TASK */}
      <form onSubmit={addTask} className="bg-white p-6 rounded shadow mb-8 space-y-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="w-full p-2 border rounded" />
        <div className="flex gap-4">
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="p-2 border rounded">
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="p-2 border rounded" />
        </div>
        <button disabled={isAdding} className="bg-blue-600 text-white px-4 py-2 rounded">
          {isAdding ? "Adding..." : "Add Task"}
        </button>
      </form>

      {/* TASK LIST */}
      <div className="space-y-4">
        {loading ? "Loading..." : filteredTasks.map(task => (
          <div key={task._id} className="p-4 bg-white rounded shadow flex justify-between">
            <div onClick={() => toggleTask(task._id, task.completed)} className="cursor-pointer">
              <p className={task.completed ? "line-through text-gray-500" : ""}>{task.title}</p>
              <span className={`text-xs px-2 py-1 rounded border ${priorityColors[task.priority]}`}>
                {priorityIcons[task.priority]} {task.priority}
              </span>
            </div>
            <button onClick={() => deleteTask(task._id)} className="text-red-500">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
