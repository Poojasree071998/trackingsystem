import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import {
  LogOut, CheckCircle, Activity, LayoutList, Clock,
  Sun, Moon, Search, Filter, ChevronRight, Bell, List, Settings, Layout,
  User as UserIcon, Send, Edit3, Inbox, Calendar, LayoutDashboard, AlertCircle, X, ShieldAlert
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie } from 'recharts';
import axios from 'axios';
import { API_BASE_URL, UPLOADS_BASE_URL } from '../apiConfig';
import EmployeeAttendance from '../components/EmployeeAttendance';
import EmployeeLOPView from '../components/EmployeeLOPView';

import { useSocket } from '../context/SocketContext';

const EmployeeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [selectedProjectData, setSelectedProjectData] = useState(null);
  const [showProjectBrief, setShowProjectBrief] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, overdue: 0 });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifTab, setNotifTab] = useState('inbox'); // 'inbox' or 'sent'
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sysStatus, setSysStatus] = useState('checking'); // 'checking', 'online', 'offline'

  useEffect(() => {
    if (socket) {
      socket.on('newNotification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
        fetchData(); // Refresh on notification
      });

      socket.on('dataUpdated', (data) => {
        fetchData();
      });

      return () => {
        socket.off('newNotification');
        socket.off('dataUpdated');
      };
    }
  }, [socket, user]);

  const fetchData = async () => {
    if (!user || !user.id) {
      console.error("❌ Authentication Error: user.id is missing", user);
      setSysStatus('offline');
      return;
    }
    
    console.log("🕵️ [DIAGNOSTIC] Fetching tasks for employee:", {
      id: user.id,
      name: user.name,
      role: user.role,
      apiBase: API_BASE_URL
    });

    try {
      const [tasksRes, statsRes, notifRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/tasks?role=employee&userId=${user.id}`).catch(err => { throw new Error(`Tasks: ${err.message}`); }),
        axios.get(`${API_BASE_URL}/api/tasks/stats?role=employee&userId=${user.id}`).catch(err => { throw new Error(`Stats: ${err.message}`); }),
        axios.get(`${API_BASE_URL}/api/notifications?userId=${user.id}`).catch(err => { throw new Error(`Notifications: ${err.message}`); })
      ]);
      setTasks(tasksRes.data);
      setStats(statsRes.data);
      setNotifications(notifRes.data);

      const uniqueProjects = Array.from(new Set(tasksRes.data.map(t => t.project?._id).filter(Boolean)))
        .map(id => tasksRes.data.find(t => t.project?._id === id).project);
      setProjects(uniqueProjects);
      setUnreadCount(notifRes.data.filter(n => n.status === 'Unread').length);
      setSysStatus('online');
    } catch (e) {
      console.error("Failed fetching employee data", e);
      setSysStatus('offline');
      // If we are in production and it failed, it's likely the API_BASE_URL
      if (window.location.hostname !== 'localhost' && !API_BASE_URL) {
        alert("Critical: API Configuration missing. Tasks cannot be loaded.");
      }
    }
  };

  useEffect(() => {
    fetchData();
    // Check system health
    const checkHealth = async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/health`);
        setSysStatus('online');
      } catch (err) {
        setSysStatus('offline');
      }
    };
    checkHealth();
    const healthInterval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(healthInterval);
  }, [user]);


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/api/notifications/${id}/read`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setTasks(tasks.map(t => t._id === id ? { ...t, status: newStatus } : t));
    try {
      await axios.put(`${API_BASE_URL}/api/tasks/${id}/status`, { status: newStatus });
      fetchData(); // Refresh stats
    } catch (err) {
      fetchData();
    }
  };

  // --- Drag and Drop Logic --- //
  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const onDragOver = (e) => { e.preventDefault(); };

  const onDrop = async (e, newStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    updateStatus(taskId, newStatus);
  };

  const filteredTasks = tasks.filter(t => {
    const sm = (t.taskTitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    const pm = priorityFilter ? t.priority === priorityFilter : true;
    const prm = selectedProjectFilter ? (t.project?._id?.toString() === selectedProjectFilter.toString()) : true;
    return sm && pm && prm;
  });

  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);

  return (
    <div className="jira-layout">
      {/* JIRA TOP NAV */}
      <nav className="jira-top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="nav-icon-container" style={{ background: 'var(--primary)', color: 'white' }}>
            <Activity size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px', color: 'white' }}>FORGE INDIA</span>
            <span style={{ fontWeight: 600, fontSize: '0.65rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.7)', marginTop: '-4px' }}>CONNECT</span>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)', marginLeft: '1rem' }}></div>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginLeft: '0.5rem' }}>Employee Portal</span>
          <div style={{ display: 'flex', gap: '1.2rem', marginLeft: '2rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <span 
              style={{ cursor: 'pointer', color: activeTab === 'dashboard' ? 'var(--primary) !important' : 'rgba(255,255,255,0.8) !important', borderBottom: activeTab === 'dashboard' ? '2px solid var(--primary)' : 'none', padding: '4px 0' }} 
              onClick={() => { console.log("Tab Clicked: Summary"); setActiveTab('dashboard'); }}
            >
              Summary
            </span>
            <span 
              style={{ cursor: 'pointer', color: activeTab === 'projects' ? 'var(--primary) !important' : 'rgba(255,255,255,0.8) !important', borderBottom: activeTab === 'projects' ? '2px solid var(--primary)' : 'none', padding: '4px 0' }} 
              onClick={() => { console.log("Tab Clicked: My Projects"); setActiveTab('projects'); }}
            >
              My Projects
            </span>
            <button
              onClick={() => setIsTaskDrawerOpen(true)}
              style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
              Create
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.7)' }} size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px 8px 36px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', width: '100%', fontSize: '0.9rem', color: 'white' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '20px', background: sysStatus === 'online' ? 'rgba(54, 179, 126, 0.15)' : 'rgba(255, 86, 48, 0.15)', border: `1px solid ${sysStatus === 'online' ? 'var(--success)' : 'var(--danger)'}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: sysStatus === 'online' ? 'var(--success)' : 'var(--danger)', boxShadow: sysStatus === 'online' ? '0 0 8px var(--success)' : 'none' }}></div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: sysStatus === 'online' ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase' }}>{sysStatus}</span>
          </div>

          <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div style={{ position: 'relative' }} onClick={() => setActiveTab('notifications')}>
            <Bell size={20} style={{ cursor: 'pointer', color: 'white' }} />
            {unreadCount > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: 'white', borderRadius: '10px', fontSize: '10px', padding: '2px 5px', fontWeight: 800 }}>{unreadCount}</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              onClick={logout}
              title="Logout"
              style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', fontWeight: 'bold', overflow: 'hidden' }}>
              {user?.profileImage ? (
                <img src={user.profileImage.startsWith('http') ? user.profileImage : `${UPLOADS_BASE_URL}/${user.profileImage}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name?.charAt(0)
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="jira-body-container">
        {/* JIRA SIDEBAR */}
        <aside className="jira-sidebar">
          <div style={{ padding: '0 0.8rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Operation Hub</div>
            <div className={`jira-sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><Activity size={18} /> Summary</div>
            <div className={`jira-sidebar-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}><LayoutList size={18} /> My List</div>
            <div className={`jira-sidebar-btn ${activeTab === 'board' ? 'active' : ''}`} onClick={() => setActiveTab('board')}><Layout size={18} /> Kanban Board</div>
            <div className={`jira-sidebar-btn ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}><Calendar size={18} /> Work Log</div>
          </div>

          <div style={{ padding: '0 0.8rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Direct Links</div>
            <div className={`jira-sidebar-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}><Bell size={18} /> Notifications</div>
            <div className={`jira-sidebar-btn ${activeTab === 'lop' ? 'active' : ''}`} onClick={() => setActiveTab('lop')} style={{ color: activeTab === 'lop' ? 'var(--primary)' : '#FF5630', fontWeight: activeTab === 'lop' ? 800 : 500 }}><ShieldAlert size={18} /> My LOP</div>
            <div className={`jira-sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><UserIcon size={18} /> Profile</div>
          </div>

          <div style={{ padding: '0 0.8rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Active Projects</div>
            {projects.map(proj => (
              <div
                key={proj._id}
                className={`jira-sidebar-btn ${selectedProjectFilter === proj._id ? 'active' : ''}`}
                onClick={() => setSelectedProjectFilter(selectedProjectFilter === proj._id ? '' : proj._id)}
              >
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--secondary)' }}></div>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{proj.projectName}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', padding: '1rem' }}>
            <div className="jira-sidebar-btn" onClick={handleLogout} style={{ color: '#FF5630', background: 'rgba(255, 86, 48, 0.05)' }}>
              <LogOut size={18} /> Logout
            </div>
          </div>
        </aside>

        {/* JIRA MAIN CONTENT AREA */}
        <main className="jira-main-content">
          <header style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Governance <ChevronRight size={14} /> FIC <ChevronRight size={14} /> <span style={{ color: 'var(--primary)' }}>{activeTab.toUpperCase()}</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-color)', margin: 0 }}>
              {activeTab === 'dashboard' ? 'Performance Summary' : activeTab === 'list' ? 'Task Backlog' : activeTab === 'board' ? 'Work Board' : activeTab === 'attendance' ? 'My Attendance' : activeTab === 'lop' ? 'My Loss of Pay' : 'Profile'}
            </h1>
          </header>

          {activeTab === 'dashboard' && (
            <div className="fade-in-up">
              {/* TOP: EMPLOYEE STATS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(0, 82, 204, 0.1)', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LayoutList size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.total}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>MY TASKS</div>
                  </div>
                </div>
                <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(255, 171, 0, 0.1)', color: 'var(--warning)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.pending}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>PENDING</div>
                  </div>
                </div>
                <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(54, 179, 126, 0.1)', color: 'var(--success)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.completed}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>COMPLETED</div>
                  </div>
                </div>
                <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(255, 86, 48, 0.1)', color: 'var(--danger)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{tasks.filter(t => t.deadline && new Date(t.deadline) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && t.status !== 'Completed').length}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>DEADLINES</div>
                  </div>
                </div>
              </div>

              {/* MIDDLE: PRODUCTIVITY CHARTS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                <div className="jira-card" style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 800 }}>Weekly Productivity Flow</h3>
                  <div style={{ height: '300px', minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { day: 'Mon', tasks: 2 },
                        { day: 'Tue', tasks: 5 },
                        { day: 'Wed', tasks: 3 },
                        { day: 'Thu', tasks: 6 },
                        { day: 'Fri', tasks: stats.completed || 4 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                        <Line type="monotone" dataKey="tasks" stroke="var(--primary)" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="jira-card" style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 800 }}>Workload Diversity</h3>
                  <div style={{ height: '300px', minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: 'To Do', value: tasks.filter(t => t.status === 'To Do').length || 5 },
                          { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length || 3 },
                          { name: 'Under Review', value: tasks.filter(t => t.status === 'Under Review').length || 2 }
                        ]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          <Cell fill="#0052CC" />
                          <Cell fill="#6F6EF5" />
                          <Cell fill="#FFAB00" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* BOTTOM: ACTIVITY / NOTIFICATIONS / QUICK ACTIONS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                <div className="jira-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1.2rem', fontSize: '1rem', fontWeight: 800 }}>Recent Experience</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {tasks.slice(0, 3).map(t => (
                      <div key={t._id} style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: '6px' }}></div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t.taskTitle}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Last updated: {t.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="jira-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1.2rem', fontSize: '1rem', fontWeight: 800 }}>Your Inbox</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {notifications.slice(0, 3).map(n => (
                      <div key={n._id} style={{ fontSize: '0.8rem', color: 'var(--text-color)' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>•</span> {n.message}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="jira-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1.2rem', fontSize: '1rem', fontWeight: 800 }}>Quick Actions</h3>
                  <div style={{ display: 'grid', gap: '0.8rem' }}>
                    <button onClick={() => setActiveTab('board')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem' }}>
                      <Edit3 size={16} /> Update Task Status
                    </button>
                    <button onClick={() => setActiveTab('notifications')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem' }}>
                      <Inbox size={16} /> View Inbox
                    </button>
                    <button onClick={() => setActiveTab('profile')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem', color: 'white' }}>
                      <UserIcon size={16} /> Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {activeTab === 'list' && (
            <div className="fade-in-up">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#F4F5F7', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                  <Filter size={16} style={{ marginRight: '8px', color: 'var(--text-muted)' }} />
                  <select
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', fontWeight: 600, outline: 'none' }}
                  >
                    <option value="">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="jira-table-container">
                <table className="jira-table">
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>Key</th>
                      <th>Summary</th>
                      <th style={{ width: '150px' }}>Status</th>
                      <th style={{ width: '150px' }}>Manager</th>
                      <th style={{ width: '120px' }}>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No records match your filters.</td></tr>
                    ) : (
                      filteredTasks.map(task => (
                        <tr key={task._id} onClick={() => { setSelectedProjectData(task.project); setShowProjectBrief(true); }}>
                          <td className="table-key" style={{ fontWeight: 700, color: 'var(--primary)' }}>{task.project?.projectKey || 'FIC'}-{task._id.substring(18, 24).toUpperCase()}</td>
                          <td className="table-summary">{task.taskTitle}</td>
                          <td>
                            <select
                              className={`badge ${task.status === 'Completed' ? 'badge-low' : 'badge-medium'}`}
                              value={task.status}
                              onClick={e => e.stopPropagation()}
                              onChange={(e) => updateStatus(task._id, e.target.value)}
                              style={{ border: 'none', outline: 'none', cursor: 'pointer' }}
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </td>
                          <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{task.assignedByHR?.name?.charAt(0)}</div>
                            {task.assignedByHR?.name}
                          </td>
                          <td>
                            <span className={`badge ${task.priority === 'High' ? 'badge-high' : task.priority === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                              {task.priority === 'High' ? <AlertCircle size={12} /> : <Clock size={12} />} {task.priority}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KANBAN BOARD */}
          {activeTab === 'board' && (
            <div className="fade-in-up" style={{ display: 'flex', gap: '1.5rem', minHeight: '60vh', overflowX: 'auto', paddingBottom: '1rem' }}>
              {['To Do', 'In Progress', 'Under Review', 'Completed'].map(column => (
                <div
                  key={column}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, column)}
                  style={{ flex: 1, minWidth: '280px', background: 'var(--column-bg)', borderRadius: '4px', display: 'flex', flexDirection: 'column', padding: '12px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '4px 8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{column}</span>
                    <span style={{ background: 'var(--card-border)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {filteredTasks.filter(t => t.status === column).length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    {filteredTasks.filter(t => t.status === column).map(task => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => onDragStart(e, task._id)}
                        onClick={() => { setSelectedProjectData(task.project); setShowProjectBrief(true); }}
                        className="kanban-card-premium"
                        style={{
                          background: 'var(--card-bg)',
                          color: 'var(--text-color)',
                          borderBottom: `3px solid ${task.issueType === 'Interview' ? '#6F6EF5' : (task.priority === 'High' ? 'var(--danger)' : 'var(--success)')}`,
                          borderLeft: task.issueType === 'Interview' ? '3px solid #6F6EF5' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
                          {task.issueType === 'Interview' && <Calendar size={14} style={{ color: '#6F6EF5' }} />}
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: task.issueType === 'Interview' ? '#6F6EF5' : 'inherit' }}>{task.taskTitle}</div>
                        </div>
                        {task.issueType === 'Interview' && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.8rem', background: 'rgba(111, 110, 245, 0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                            🕒 {task.taskDate} at {task.taskTime}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="table-key" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{task.issueType === 'Interview' ? 'HIRING' : task.project?.projectKey || 'FIC'}-...{task._id.substring(21)}</div>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{task.assignedByHR?.name?.charAt(0)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="fade-in-up">
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--card-border)' }}>
                <div onClick={() => setNotifTab('inbox')} style={{ paddingBottom: '12px', borderBottom: notifTab === 'inbox' ? '3px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: 800, color: notifTab === 'inbox' ? 'var(--primary)' : 'var(--text-muted)' }}>Inbox</div>
                <div onClick={() => setNotifTab('sent')} style={{ paddingBottom: '12px', borderBottom: notifTab === 'sent' ? '3px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: 800, color: notifTab === 'sent' ? 'var(--primary)' : 'var(--text-muted)' }}>Sent</div>
              </div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {(() => {
                  const filtered = notifications.filter(n => {
                    const senderId = n.sender?._id?.toString() || n.sender?.toString();
                    const recipientId = n.recipient?._id?.toString() || n.recipient?.toString();
                    const currentUserId = user.id?.toString();

                    return notifTab === 'sent' 
                      ? senderId === currentUserId 
                      : recipientId === currentUserId;
                  });

                  return filtered.length === 0 ? (
                    <div className="jira-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Inbox size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                      <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Your transmission feed is clear.</p>
                      <p style={{ fontSize: '0.9rem' }}>No active alerts in your current sector.</p>
                    </div>
                  ) : (
                    filtered.map(notif => (
                      <div key={notif._id} onClick={() => notifTab === 'inbox' && markAsRead(notif._id)} className="jira-card" style={{ display: 'flex', gap: '1.5rem', background: notif.status === 'Unread' ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--card-bg)' }}>
                        <div style={{ padding: '8px', background: notif.type === 'interview_assignment' ? 'rgba(111, 110, 245, 0.1)' : 'rgba(0, 82, 204, 0.1)', color: notif.type === 'interview_assignment' ? '#6F6EF5' : 'var(--primary)', borderRadius: '8px', height: 'fit-content' }}>
                          {notif.type === 'interview_assignment' ? <Calendar size={20} /> : <Bell size={20} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: notif.type === 'interview_assignment' ? '#6F6EF5' : 'var(--primary)' }}>{notif.type === 'interview_assignment' ? 'HIRING' : (notif.type?.toUpperCase() || 'ALERT')}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p style={{ fontWeight: 600, fontSize: '1rem', color: notif.type === 'interview_assignment' ? 'var(--text-color)' : 'inherit' }}>{notif.message}</p>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{notifTab === 'sent' ? `To: ${notif.recipient?.name || 'Unit'}` : `From: ${notif.sender?.name || 'System'}`}</div>
                        </div>
                      </div>
                    ))
                  );
                })()}
              </div>
            </div>
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="fade-in-up">
              <div className="jira-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem', textAlign: 'center' }}>
                <div style={{ width: 100, height: 100, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800, borderRadius: '24px', margin: '0 auto 1.5rem', overflow: 'hidden' }}>
                  {user?.profileImage ? (
                    <img src={user.profileImage.startsWith('http') ? user.profileImage : `${UPLOADS_BASE_URL}/${user.profileImage}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user?.name?.charAt(0)
                  )}
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{user?.name}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{user?.email}</p>
                <div style={{ textAlign: 'left', display: 'grid', gap: '1.5rem' }}>
                  <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>MEMBER SINCE</div>
                    <div style={{ fontWeight: 800 }}>
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' }) : 'Join Date Not Available'}
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>USER ROLE</div>
                    <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>{user?.role}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MY LOP STATUS */}
          {activeTab === 'lop' && <EmployeeLOPView userId={user?.id} />}

          {/* ATTENDANCE SECTION */}
          {activeTab === 'attendance' && (
            <EmployeeAttendance />
          )}

          {/* MY PROJECTS GRID */}
          {activeTab === 'projects' && (
            <div className="fade-in-up">
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Assigned Workspaces</h2>
                <p style={{ color: 'var(--text-muted)' }}>Overview of all projects linked to your active tasks.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {projects.length === 0 ? (
                  <div className="jira-card" style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Layout size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No active projects found.</p>
                    <p style={{ fontSize: '0.9rem' }}>Projects appear here once tasks are assigned to you.</p>
                  </div>
                ) : (
                  projects.map(proj => (
                    <div key={proj._id} className="jira-card" style={{ padding: '0', overflow: 'hidden' }}>
                      <div style={{ height: '6px', background: 'var(--primary)' }}></div>
                      <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Activity size={20} />
                          </div>
                          <span className="table-key" style={{ fontSize: '0.75rem', fontWeight: 800 }}>{proj.projectKey}</span>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>{proj.projectName}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '38px' }}>
                          {proj.instructions || 'Standard operation workspace. Follow task-specific guidelines.'}
                        </p>
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <LayoutList size={14} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              {tasks.filter(t => t.project?._id === proj._id).length} Active Tasks
                            </span>
                          </div>
                          <button 
                            onClick={() => { setSelectedProjectFilter(proj._id); setActiveTab('dashboard'); }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            View Board
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PROJECT BRIEF MODAL */}
      {showProjectBrief && selectedProjectData && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', borderRadius: '24px', position: 'relative' }}>
            <button onClick={() => setShowProjectBrief(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 className="fic-gradient-text" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>{selectedProjectData.projectName}</h2>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Instructions</label>
              <p style={{ marginTop: '0.5rem', lineHeight: '1.6', fontSize: '1rem' }}>{selectedProjectData.instructions || 'No special instructions.'}</p>
            </div>
            <button onClick={() => setShowProjectBrief(false)} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px' }}>Close Briefing</button>
          </div>
        </div>
      )}


      {/* CREATE ISSUE DRAWER */}
      {isTaskDrawerOpen && (
        <div className="jira-drawer-overlay" onClick={() => setIsTaskDrawerOpen(false)}>
          <div className="jira-drawer-content" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Create New Task</h2>
              <X size={24} onClick={() => setIsTaskDrawerOpen(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
            </div>
            <div style={{ padding: '2rem', flex: 1 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Employee self-assignment is disabled in the current configuration.
                Tasks are dispatched by the HR Management Hub.
                <br /><br />
                Please contact your manager if you need to be assigned to a new project or work stream.
              </p>
            </div>
            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsTaskDrawerOpen(false)} className="btn-primary">Acknowledge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
