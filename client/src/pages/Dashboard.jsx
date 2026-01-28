import { useEffect, useState } from "react"
import api from "../api"
import { useNavigate, Link } from "react-router-dom"

export default function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState("Medium")
  const [dueDate, setDueDate] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)

  const navigate = useNavigate()

  /* AUTH CHECK */
  useEffect(() => {
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (!token) {
      navigate("/login")
      return
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    setReady(true)
  }, [navigate])
  /* SYNC USER ON UPDATE */
  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem("user")
      if (storedUser) setUser(JSON.parse(storedUser))
    }

    window.addEventListener("userUpdated", syncUser)
    return () => window.removeEventListener("userUpdated", syncUser)
  }, [])


  /* FETCH TASKS */
  const fetchTasks = async () => {
    try {
      setLoading(true)
      const res = await api.get("/api/task/my")
      setTasks(res.data || [])
    } catch {
      setError("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ready) fetchTasks()
  }, [ready])

  /* ADD TASK */
  const addTask = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await api.post("/api/task/add", { title, priority, dueDate })
      fetchTasks()
      setTitle("")
      setPriority("Medium")
      setDueDate("")
    } catch {
      setError("Failed to add task")
    }
  }

  /* TOGGLE */
  const toggleTask = async (id, completed) => {
    try {
      await api.put(`/api/task/update/${id}`, { completed: !completed })
      fetchTasks()
    } catch {
      setError("Failed to update task")
    }
  }

  /* DELETE */
  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return
    try {
      await api.delete(`/api/task/delete/${id}`)
      fetchTasks()
    } catch {
      setError("Failed to delete task")
    }
  }

  const filteredTasks = tasks
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    .filter(t => {
      if (filter === "All") return true
      if (filter === "Completed") return t.completed
      if (filter === "Pending") return !t.completed
      return t.priority === filter
    })

  const pendingTasks = tasks.filter(t => !t.completed).length

  if (!ready) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome{user?.name ? `, ${user.name}` : ""}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              <span className="font-semibold text-gray-800">{pendingTasks}</span> pending task{pendingTasks !== 1 && "s"} remaining
            </p>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">

            {/* Avatar */}

            <Link to="/profile">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold shadow-md hover:scale-105 transition">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            </Link>

            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-4 py-2 border rounded-full"
            />

            {/* PROFILE FIRST */}
            <Link
              to="/profile"
              className="text-sm font-medium text-amber-600 hover:underline"
            >
              Profile
            </Link>

            {/* LOGOUT */}
            <button
              onClick={() => {
                localStorage.clear()
                navigate("/login")
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ADD TASK */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Add New Task</h2>

            <form onSubmit={addTask} className="space-y-4">
              <input
                type="text"
                placeholder="Task title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-4 border rounded-xl"
              />

              <div className="grid grid-cols-2 gap-4">
                <select value={priority} onChange={e => setPriority(e.target.value)} className="p-4 border rounded-xl">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>

                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="p-4 border rounded-xl" />
              </div>

              <button className="w-full bg-purple-600 text-white py-4 rounded-xl">
                Add Task
              </button>
            </form>
          </div>

          {/* TASK LIST */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">My Tasks</h2>

            <div className="flex gap-2 mb-4">
              {["All", "Pending", "Completed", "High", "Medium", "Low"].map(f => (
                <button key={f} onClick={() => setFilter(f)} className="px-3 py-1 bg-gray-100 rounded">
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <p>Loading...</p>
            ) : filteredTasks.length === 0 ? (
              <p>No tasks found</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredTasks.map(task => (
                  <div key={task._id} className="p-4 border rounded-xl flex justify-between items-center">
                    <div onClick={() => toggleTask(task._id, task.completed)} className="cursor-pointer">
                      <p className={task.completed ? "line-through text-gray-500" : ""}>{task.title}</p>
                      <p className="text-sm text-gray-500">{task.priority}</p>
                    </div>
                    <button onClick={() => deleteTask(task._id)} className="text-red-500">Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
