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

  /* =====================
     AUTH CHECK FIRST
  ====================== */
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

  /* 🔴 LIVE USER SYNC */
  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem("user")
      if (storedUser) setUser(JSON.parse(storedUser))
    }
    window.addEventListener("userUpdated", syncUser)
    return () => window.removeEventListener("userUpdated", syncUser)
  }, [])

  /* =====================
     FETCH TASKS
  ====================== */
  const fetchTasks = async () => {
    try {
      setLoading(true)
      const res = await api.get("/api/task/my")
      setTasks(res.data || [])
    } catch (err) {
      setError("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!ready) return
    fetchTasks()
  }, [ready])

  /* =====================
     ADD TASK
  ====================== */
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

  const toggleTask = async (id, completed) => {
    try {
      await api.put(`/api/task/update/${id}`, { completed: !completed })
      fetchTasks()
    } catch {
      setError("Failed to update task")
    }
  }

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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome{user?.name ? `, ${user.name}` : ""}! 👋
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">{pendingTasks}</span> pending task{pendingTasks !== 1 && "s"} remaining
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">

            {/* Avatar */}
            <Link to="/profile">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold shadow-md hover:scale-105 transition">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            </Link>

            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              onClick={() => {
                localStorage.clear()
                navigate("/login")
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-medium"
            >
              Logout
            </button>

            <Link
              to="/profile"
              className="text-sm text-amber-600 hover:text-amber-500 hover:underline"
            >
              Profile
            </Link>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-200 text-rose-700 rounded-xl shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
            <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700">✕</button>
          </div>
        )}

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ADD TASK CARD */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Task</h2>

              <form onSubmit={addTask} className="space-y-6">
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />

                <div className="grid grid-cols-2 gap-4">
                  <select value={priority} onChange={e => setPriority(e.target.value)} className="p-4 border rounded-xl">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>

                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="p-4 border rounded-xl" />
                </div>

                <button className="w-full bg-purple-600 text-white py-4 rounded-xl">Add Task</button>
              </form>
            </div>
          </div>

          {/* TASK LIST CARD */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800">My Tasks</h2>

              {/* FILTER MENU */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mt-4 flex-wrap">
                {["All", "Pending", "Completed", "High", "Medium", "Low"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      filter === f ? "bg-white text-purple-600 shadow-sm" : "text-gray-600"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {loading ? (
                <p className="mt-6">Loading...</p>
              ) : filteredTasks.length === 0 ? (
                <p className="mt-6 text-gray-500">No tasks found</p>
              ) : (
                <div className="space-y-3 mt-6 max-h-[400px] overflow-y-auto">
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

        {/* STATS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-purple-500 text-white p-6 rounded-2xl shadow-lg">
            <p>Total Tasks</p>
            <p className="text-3xl font-bold">{tasks.length}</p>
          </div>
          <div className="bg-amber-500 text-white p-6 rounded-2xl shadow-lg">
            <p>Pending</p>
            <p className="text-3xl font-bold">{pendingTasks}</p>
          </div>
          <div className="bg-emerald-500 text-white p-6 rounded-2xl shadow-lg">
            <p>Completed</p>
            <p className="text-3xl font-bold">{tasks.filter(t => t.completed).length}</p>
          </div>
        </div>

      </div>
    </div>
  )
}
