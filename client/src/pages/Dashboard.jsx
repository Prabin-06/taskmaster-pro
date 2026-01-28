import { useEffect, useState } from "react"
import api from "../api"
import { useNavigate } from "react-router-dom"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("tasks") // "tasks" or "profile"
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
  
  // Profile states
  const [profileName, setProfileName] = useState("")
  const [profileEmail, setProfileEmail] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState("")

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
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      setProfileName(parsedUser.name || "")
      setProfileEmail(parsedUser.email || "")
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
     UPDATE PROFILE
  ====================== */
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileError("")
    setProfileSuccess("")

    try {
      setProfileLoading(true)
      const res = await api.put("/api/auth/update", { name: profileName })
      
      // Update localStorage
      const updatedUser = { ...user, name: res.data.name }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      setProfileSuccess("Profile updated successfully!")
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile")
    } finally {
      setProfileLoading(false)
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {activeTab === "tasks" 
                ? `Welcome, ${user?.name || "User"}! 🎉` 
                : "Profile Settings"}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setActiveTab("tasks")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "tasks" 
                      ? "bg-gray-900 text-white" 
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "profile" 
                      ? "bg-gray-900 text-white" 
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Profile
                </button>
              </div>
              <button
                onClick={() => {
                  localStorage.clear()
                  navigate("/login")
                }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          <p className="text-gray-600">
            {activeTab === "tasks" 
              ? `${pendingTasks} pending task${pendingTasks !== 1 ? "s" : ""} remaining`
              : "Manage your account information"}
          </p>
        </div>

        <hr className="my-6 md:my-8 border-gray-200" />

        {/* TASKS TAB */}
        {activeTab === "tasks" ? (
          <>
            {/* ERROR MESSAGE */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
                <button 
                  onClick={() => setError("")}
                  className="float-right text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
              {/* ADD TASK SECTION */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Add New Task
                </h2>
                
                <form onSubmit={addTask} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Title
                    </label>
                    <input
                      type="text"
                      placeholder="What needs to be done?"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={e => setPriority(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none appearance-none bg-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!title.trim()}
                    className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Task
                  </button>
                </form>
              </div>

              {/* TASKS SECTION */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">
                    My Tasks
                  </h2>
                  
                  <div className="flex flex-wrap gap-2">
                    {["All", "Pending", "Completed", "High", "Medium", "Low"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${filter === f 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SEARCH */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                  />
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-600">Loading your tasks...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg mb-1">No tasks found</p>
                    <p className="text-gray-400">Try adding a new task or changing your filter</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {filteredTasks.map(task => {
                      const priorityColors = {
                        High: 'border-red-200 bg-red-50',
                        Medium: 'border-yellow-200 bg-yellow-50',
                        Low: 'border-green-200 bg-green-50'
                      }
                      
                      const priorityTextColors = {
                        High: 'text-red-700',
                        Medium: 'text-yellow-700',
                        Low: 'text-green-700'
                      }
                      
                      return (
                        <div
                          key={task._id}
                          className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${priorityColors[task.priority] || 'border-gray-200 bg-gray-50'} ${task.completed ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => toggleTask(task._id, task.completed)}
                              className={`mt-1 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${task.completed 
                                ? 'bg-gray-900 border-gray-900' 
                                : 'border-gray-400 hover:border-gray-600'}`}
                            >
                              {task.completed && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            
                            <div className="flex-grow min-w-0" onClick={() => toggleTask(task._id, task.completed)}>
                              <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityTextColors[task.priority]} ${priorityColors[task.priority]}`}>
                                  {task.priority}
                                </span>
                                {task.dueDate && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {new Date(task.dueDate).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    }).replace(/\//g, '-')}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => deleteTask(task._id)}
                              className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

            <hr className="my-8 md:my-12 border-gray-200" />

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Tasks</h3>
                <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
              </div>
              
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Tasks</h3>
                <p className="text-3xl font-bold text-gray-900">{pendingTasks}</p>
              </div>
              
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed Tasks</h3>
                <p className="text-3xl font-bold text-gray-900">{tasks.filter(t => t.completed).length}</p>
              </div>
            </div>
          </>
        ) : (
          /* PROFILE TAB */
          <>
            {/* PROFILE ERROR/SUCCESS MESSAGES */}
            {profileError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span>{profileError}</span>
                  <button onClick={() => setProfileError("")} className="text-red-500 hover:text-red-700">
                    ✕
                  </button>
                </div>
              </div>
            )}

            {profileSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span>{profileSuccess}</span>
                  <button onClick={() => setProfileSuccess("")} className="text-green-500 hover:text-green-700">
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* USER INFO CARD */}
              <div className="lg:col-span-1">
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user?.name || "User"}</h3>
                      <p className="text-sm text-gray-600">{user?.email || "user@example.com"}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Account Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="font-medium text-gray-900">Active</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium text-gray-900">
                        {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* EDIT FORM */}
              <div className="lg:col-span-2">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Profile</h2>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition-all"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileEmail}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-400 mt-2">Email address cannot be modified.</p>
                    </div>

                    <div className="flex gap-4 pt-2">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {profileLoading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <hr className="my-8 md:my-12 border-gray-200" />

            {/* PROFILE STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Account Created</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Profile Status</h3>
                <p className="text-lg font-semibold text-gray-900">Active</p>
              </div>

              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Last Updated</h3>
                <p className="text-lg font-semibold text-gray-900">Today</p>
              </div>

              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Security</h3>
                <p className="text-lg font-semibold text-gray-900">Protected</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}