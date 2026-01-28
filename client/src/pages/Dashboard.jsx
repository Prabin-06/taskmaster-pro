import { useEffect, useState } from "react"
import api from "../api"
import { useNavigate } from "react-router-dom"

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
     ADD TASK (FIXED)
  ====================== */
  const addTask = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await api.post("/api/task/add", {
        title,
        priority,
        dueDate,
      })

      // ✅ SAFEST: refetch tasks from backend
      fetchTasks()

      setTitle("")
      setPriority("Medium")
      setDueDate("")
    } catch {
      setError("Failed to add task")
    }
  }

  /* =====================
     TOGGLE TASK (FIXED ROUTE)
  ====================== */
  const toggleTask = async (id, completed) => {
    try {
      await api.put(`/api/task/update/${id}`, {
        completed: !completed,
      })
      fetchTasks()
    } catch {
      setError("Failed to update task")
    }
  }

  /* =====================
     DELETE TASK (FIXED ROUTE)
  ====================== */
  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return

    try {
      await api.delete(`/api/task/delete/${id}`)
      fetchTasks()
    } catch {
      setError("Failed to delete task")
    }
  }

  /* =====================
     FILTERS
  ====================== */
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
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-200 text-rose-700 rounded-xl shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
            <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700">
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ADD TASK */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Add New Task</h2>
              </div>

              <form onSubmit={addTask} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                  <input
                    type="text"
                    placeholder="What needs to be done?"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 outline-none bg-gray-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                      className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 outline-none appearance-none bg-gray-50/50"
                    >
                      <option value="Low" className="text-green-600">Low</option>
                      <option value="Medium" className="text-amber-600">Medium</option>
                      <option value="High" className="text-red-600">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 outline-none bg-gray-50/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Add Task
                </button>
              </form>
            </div>
          </div>

          {/* TASK LIST */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <div className="flex items-center gap-3 mb-4 sm:mb-0">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">My Tasks</h2>
                </div>

                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                  {["All", "Pending", "Completed", "High", "Medium", "Low"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter === f 
                        ? 'bg-white text-purple-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500">Loading your tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">No tasks found</p>
                  <p className="text-gray-400 text-sm mt-1">Try adding a new task or changing your filter</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {filteredTasks.map(task => {
                    const priorityColors = {
                      High: 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200',
                      Medium: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200',
                      Low: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                    }
                    
                    const priorityBadgeColors = {
                      High: 'bg-rose-100 text-rose-700',
                      Medium: 'bg-amber-100 text-amber-700',
                      Low: 'bg-emerald-100 text-emerald-700'
                    }
                    
                    return (
                      <div
                        key={task._id}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${priorityColors[task.priority] || 'bg-gray-50 border-gray-200'} ${task.completed ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => toggleTask(task._id, task.completed)}
                            className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-500' 
                              : 'border-gray-300 hover:border-purple-500'}`}
                          >
                            {task.completed && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          
                          <div className="flex-grow min-w-0" onClick={() => toggleTask(task._id, task.completed)}>
                            <p className={`font-medium text-gray-800 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityBadgeColors[task.priority]}`}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => deleteTask(task._id)}
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Tasks</p>
                <p className="text-3xl font-bold mt-2">{tasks.length}</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Pending Tasks</p>
                <p className="text-3xl font-bold mt-2">{pendingTasks}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Completed Tasks</p>
                <p className="text-3xl font-bold mt-2">{tasks.filter(t => t.completed).length}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}