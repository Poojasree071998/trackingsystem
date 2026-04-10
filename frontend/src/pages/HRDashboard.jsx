import React, { useState, useContext, useEffect } from 'react'; // SYNC: 2026-04-10-LOP-STABLE-PROD-V5
import { useNavigate } from 'react-router-dom'; // Deploy Marker: 2026-04-10-LOP-FORCE
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { 
  LogOut, PlusCircle, Briefcase, Users, FileBarChart, 
  Sun, Moon, Search, Filter, MessageSquare, Paperclip, X, CheckCircle, 
  Clock, AlertCircle, Activity, TrendingUp, UserCheck, UserMinus, 
  ChevronRight, ExternalLink, Mail, Award, Bell, List, Settings, Layout, Calendar, UserPlus, Send, Shield, ShieldAlert
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import LOPManager from '../components/LOPManager';
import { API_BASE_URL, UPLOADS_BASE_URL } from '../apiConfig';
import HRAttendance from '../components/HRAttendance';

const HRDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, overdue: 0 });
  
  // Advanced UI States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);

  // Team Management State
  const [memberSearch, setMemberSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({ name: '', email: '', designation: 'Specialist', department: 'Operations' });

  // Project Detail State
  const [selectedProjectData, setSelectedProjectData] = useState(null);
  const [showProjectDetailModal, setShowProjectDetailModal] = useState(false);

  // Create Task Form
  const [taskForm, setTaskForm] = useState({ 
    taskTitle: '', 
    taskDescription: '', 
    assignedToEmployee: '', 
    deadline: '', 
    priority: 'Medium',
    project: '',
    issueType: 'Task',
    taskDate: '',
    taskTime: '',
    notes: ''
  });

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationForm, setNotificationForm] = useState({ recipient: '', message: '' });
  const [notifTab, setNotifTab] = useState('inbox'); // 'inbox' or 'sent'

  const [hrSearchQuery, setHrSearchQuery] = useState('');
  const [hrPriorityFilter, setHrPriorityFilter] = useState('');

  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Interview Management State
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewForm, setInterviewForm] = useState({ 
    candidateName: '', 
    email: '', 
    position: '', 
    date: '', 
    time: '',
    assignedToEmployee: '' // The Interviewer
  });

  useEffect(() => {
    if (socket) {
      socket.on('newNotification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
        fetchData(); // Instant refresh on notification
      });

      socket.on('dataUpdated', (data) => {
        console.log("Real-time update received:", data);
        fetchData();
      });

      return () => {
        socket.off('newNotification');
        socket.off('dataUpdated');
      };
    }
  }, [socket, user]);

  const fetchData = async () => {
    try {
      const [tasksRes, employeesRes, statsRes, notifRes, projectsRes, leavesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/tasks?role=hr&userId=${user.id}`),
        axios.get(`${API_BASE_URL}/api/users?role=employee`), // Get all employees for assignment
        axios.get(`${API_BASE_URL}/api/tasks/stats?role=hr&userId=${user.id}`),
        axios.get(`${API_BASE_URL}/api/notifications?userId=${user.id}`),
        axios.get(`${API_BASE_URL}/api/projects`),
        axios.get(`${API_BASE_URL}/api/leaves`) 
      ]);
      setTasks(tasksRes.data);
      setEmployees(employeesRes.data);
      setStats(statsRes.data);
      setNotifications(notifRes.data);
      setProjects(projectsRes.data.filter(p => p.lead?._id === user.id || p.members?.some(m => m._id === user.id)));
      setUnreadCount(notifRes.data.filter(n => n.status === 'Unread').length);
      setPendingLeaveCount(leavesRes.data.filter(l => l.status === 'Pending').length);
    } catch (e) {
      console.error("Failed fetching HR data", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);


  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/tasks/assign`, { ...taskForm, assignedByHR: user.id });
      setTaskForm({ 
        taskTitle: '', 
        taskDescription: '', 
        assignedToEmployee: '', 
        deadline: '', 
        priority: 'Medium',
        project: '',
        issueType: 'Task',
        taskDate: '',
        taskTime: '',
        notes: ''
      });
      setShowCreateModal(false);
      fetchData(); // Refresh everything
    } catch (err) {
      alert('Error creating task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/users`, addMemberForm);
      setAddMemberForm({ name: '', email: '', designation: 'Specialist', department: 'Operations' });
      setShowAddMemberModal(false);
      fetchData(); // Refresh list to see new member
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding member');
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/notifications/custom`, { 
        sender: user.id, 
        ...notificationForm 
      });
      setNotificationForm({ recipient: '', message: '' });
      setShowNotificationModal(false);
      fetchData(); // Refresh the list if sender wants to see it
    } catch (err) {
      console.error('Notification error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.error || err.message;
      alert('Error sending notification: ' + errorMsg);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/api/notifications/${id}/read`);
      fetchData();
    } catch (err) {
      console.error("Notification custom error:", err);
      alert("Failed to mark notification as read.");
    }
  };

  // --- Drag and Drop Logic --- //
  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const onDragOver = (e) => { e.preventDefault(); };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      await axios.put(`${API_BASE_URL}/api/tasks/${taskId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error("Status update failed", err);
      fetchData();
    }
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'High': return <span className="badge badge-high"><span style={{width:'8px',height:'8px',background:'currentColor',borderRadius:'50%'}}></span> High</span>;
      case 'Medium': return <span className="badge badge-medium"><span style={{width:'8px',height:'8px',background:'currentColor',borderRadius:'50%'}}></span> Medium</span>;
      case 'Low': return <span className="badge badge-low"><span style={{width:'8px',height:'8px',background:'currentColor',borderRadius:'50%'}}></span> Low</span>;
      default: return priority;
    }
  };

  const renderColumn = (status, label, icon) => (
    <div className="glass-panel" style={{ 
      flex: 1, 
      minWidth: '280px', 
      background: 'var(--column-bg)', 
      borderRadius: '8px', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      border: '1px solid var(--card-border)'
    }}>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, background: 'var(--card-border)', padding: '2px 6px', borderRadius: '10px' }}>
            {tasks.filter(t => t.status === status).length}
          </span>
        </div>
      </div>
      
      <div 
        onDragOver={onDragOver} 
        onDrop={e => {
          const taskId = e.dataTransfer.getData('taskId');
          handleUpdateTaskStatus(taskId, status);
        }}
        style={{ padding: '10px', overflowY: 'auto', flex: 1 }}
      >
        {tasks.filter(t => t.status === status).map(task => (
          <div 
            key={task._id} 
            draggable 
            onDragStart={e => onDragStart(e, task._id)}
            className="kanban-card-premium"
            style={{ marginBottom: '8px', padding: '12px', background: 'var(--card-bg)', color: 'var(--text-color)' }}
            onClick={() => { setSelectedTaskDetails(task); setShowDetailsModal(true); }}
          >
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: '10px', lineHeight: '1.4' }}>{task.taskTitle}</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>
                    {task.project?.projectKey || 'FIC'}-{task._id.substring(18,24).toUpperCase()}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.priority === 'High' ? '#FF5630' : task.priority === 'Medium' ? '#FF8B00' : '#36B37E' }}></div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{task.priority}</span>
                  </div>
               </div>
               
               <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    width: 24, height: 24, borderRadius: '50%', 
                    background: 'var(--success)', color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: '10px', fontWeight: 800, border: '2px solid var(--bg-color)'
                  }}>
                    {task.assignedToEmployee?.name?.charAt(0) || '?'}
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="jira-layout">
      {/* FINAL SYSTEM SYNC - HR DASHBOARD */}
      <nav className="jira-top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <div className="nav-icon-container" style={{ background: 'var(--success)', color: 'white' }}>
             <Users size={18} />
           </div>
           <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>HR Management Hub</span>
           <div style={{ display: 'flex', gap: '1.2rem', marginLeft: '2rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              <span style={{ cursor: 'pointer', color: activeTab === 'dashboard' ? 'var(--primary)' : 'inherit' }} onClick={() => setActiveTab('dashboard')}>Summary</span>
              <span style={{ cursor: 'pointer', color: activeTab === 'employees' ? 'var(--primary)' : 'inherit' }} onClick={() => setActiveTab('employees')}>Team Directory</span>
              <button 
                onClick={() => setShowCreateModal(true)}
                style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                Assign Duty
              </button>
           </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
           <div style={{ position: 'relative', width: '250px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.7)' }} size={16} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                value={hrSearchQuery}
                onChange={(e) => setHrSearchQuery(e.target.value)}
                style={{ padding: '8px 12px 8px 36px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', width: '100%', fontSize: '0.9rem', color: 'white' }}
              />
           </div>
           
           <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white' }}>
              {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
           </button>
           
           <div style={{ position: 'relative' }} onClick={() => setActiveTab('notifications')}>
              <Bell size={20} style={{ cursor: 'pointer', color: 'white' }} />
              {unreadCount > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: 'white', borderRadius: '10px', fontSize: '10px', padding: '2px 5px', fontWeight: 800 }}>{unreadCount}</span>}
           </div>

           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                onClick={logout}
                title="Logout"
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', fontWeight: 'bold', overflow: 'hidden' }}>
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
        {/* JIRA SIDEBAR - HR */}
        <aside className="jira-sidebar">
          <div style={{ padding: '0 0.8rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Control Panel</div>
            <div className={`jira-sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><Activity size={18} /> HR Overview</div>
            <div className={`jira-sidebar-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}><List size={18} /> Task Control</div>
            <div className={`jira-sidebar-btn ${activeTab === 'board' ? 'active' : ''}`} onClick={() => setActiveTab('board')}><Layout size={18} /> Team Board</div>
            <div className={`jira-sidebar-btn ${activeTab === 'lop' ? 'active' : ''}`} onClick={() => setActiveTab('lop')} style={{ color: activeTab === 'lop' ? 'var(--primary)' : '#FF5630', fontWeight: 800 }}><ShieldAlert size={18} /> Manage Loss of Pay</div>
          </div>
          
          <div style={{ padding: '0 0.8rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Organization</div>
            <div className={`jira-sidebar-btn ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}><Users size={18} /> Team Units</div>
            <div className={`jira-sidebar-btn ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}><Briefcase size={18} /> Workspace</div>
            <div className={`jira-sidebar-btn ${activeTab === 'attendance' ? 'active' : ''}`} style={{ position: 'relative' }} onClick={() => setActiveTab('attendance')}>
              <Calendar size={18} /> Attendance Tracker
              {pendingLeaveCount > 0 && (
                <span style={{ 
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '18px', height: '18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800
                }}>
                  {pendingLeaveCount}
                </span>
              )}
            </div>
          </div>

          <div style={{ padding: '0 0.8rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Management</div>
            <div className={`jira-sidebar-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}><Bell size={18} /> Inbox</div>
            <div className="jira-sidebar-btn" onClick={() => setShowNotificationModal(true)} style={{ color: 'var(--primary)' }}><MessageSquare size={18} /> Send Alert</div>
            <div className="jira-sidebar-btn" onClick={() => setShowAddMemberModal(true)} style={{ color: 'var(--success)' }}><PlusCircle size={18} /> Add Operator</div>
          </div>
          
          <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                 Build: 2026-04-10-LOP-STABLE-FINAL
              </div>
             <div className="jira-sidebar-btn" onClick={handleLogout} style={{ color: 'var(--danger)', background: 'rgba(255, 86, 48, 0.05)' }}>
                <LogOut size={18} /> Logout
             </div>
          </div>
        </aside>

        {/* JIRA MAIN CONTENT - HR */}
        <main className="jira-main-content">
          <header style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              FIC <ChevronRight size={14} /> HR Control Hub <ChevronRight size={14} /> {activeTab.toUpperCase()}
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              {activeTab === 'dashboard' ? 'Operational Summary' : activeTab === 'list' ? 'Task Control Center' : activeTab === 'board' ? 'Enterprise Workflow' : activeTab === 'employees' ? 'Unit Directory' : activeTab === 'attendance' ? 'Attendance Monitor' : activeTab === 'lop' ? 'Loss of Pay Management' : 'Communications'}
            </h1>
          </header>

          {/* DASHBOARD SUMMARY */}
          {activeTab === 'dashboard' && (
            <div className="fade-in-up">
              {/* TOP: HR STATS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.2rem', marginBottom: '2.5rem' }}>
                <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: 44, height: 44, background: 'rgba(54, 179, 126, 0.1)', color: 'var(--success)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={24} />
                   </div>
                   <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{employees.length}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL EMPLOYEES</div>
                   </div>
                </div>
                <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: 44, height: 44, background: 'rgba(0, 82, 204, 0.1)', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserPlus size={24} />
                   </div>
                   <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{employees.filter(e => new Date(e.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>NEW JOINERS</div>
                   </div>
                </div>
                <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: 44, height: 44, background: 'rgba(255, 171, 0, 0.1)', color: 'var(--warning)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={24} />
                   </div>
                   <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{tasks.filter(t => t.status === 'Under Review').length}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>PENDING APPROVALS</div>
                   </div>
                </div>
                <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: 44, height: 44, background: 'rgba(111, 110, 245, 0.1)', color: '#6F6EF5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={24} />
                   </div>
                   <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.totalInterviews || 0}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>INTERVIEWS</div>
                   </div>
                </div>
                <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => setActiveTab('lop')}>
                   <div style={{ width: 44, height: 44, background: 'rgba(255, 86, 48, 0.1)', color: 'var(--danger)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldAlert size={24} />
                   </div>
                   <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.totalLopUsers || 0}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>LOP DEDUCTIONS</div>
                   </div>
                </div>
              </div>

              {/* MIDDLE: HR CHARTS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                 <div className="jira-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 800 }}>Department Distribution</h3>
                    <div style={{ height: '300px' }}>
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={[
                               { name: 'Engineering', value: employees.filter(e => e.department === 'Engineering').length || 5 },
                               { name: 'Operations', value: employees.filter(e => e.department === 'Operations').length || 3 },
                               { name: 'HR', value: 2 },
                               { name: 'Design', value: 4 }
                           ]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                              <Cell fill="#0052CC" />
                              <Cell fill="#36B37E" />
                              <Cell fill="#FF5630" />
                              <Cell fill="#6F6EF5" />
                           </Pie>
                           <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                           <Legend />
                         </PieChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="jira-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 800 }}>Employee Retention & Growth</h3>
                    <div style={{ height: '300px' }}>
                       <ResponsiveContainer width="100%" height="100%">
                          <ReBarChart data={[
                             { month: 'Jan', count: 12 },
                             { month: 'Feb', count: 15 },
                             { month: 'Mar', count: 18 },
                             { month: 'Apr', count: employees.length }
                          ]}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
                             <XAxis dataKey="month" axisLine={false} tickLine={false} />
                             <YAxis axisLine={false} tickLine={false} />
                             <Tooltip cursor={{ fill: 'var(--column-bg)' }} />
                             <Bar dataKey="count" fill="var(--success)" radius={[4, 4, 0, 0]} />
                          </ReBarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              {/* BOTTOM: HR ACTIVITY / NOTIFICATIONS / QUICK ACTIONS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                 <div className="jira-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.2rem', fontSize: '1rem', fontWeight: 800 }}>Recent HR Activity</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '12px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>New Employee Registered</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Yesterday, 4:30 PM</div>
                       </div>
                       <div style={{ borderLeft: '3px solid var(--success)', paddingLeft: '12px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Interview Scheduled: John Doe</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Today, 10:00 AM</div>
                       </div>
                       <div style={{ borderLeft: '3px solid var(--warning)', paddingLeft: '12px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Leave Request: Sarah Miller</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>2 days ago</div>
                       </div>
                    </div>
                 </div>

                 <div className="jira-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.2rem', fontSize: '1rem', fontWeight: 800 }}>Notifications</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       {notifications.slice(0, 3).map(n => (
                          <div key={n._id} style={{ display: 'flex', gap: '8px' }}>
                             <Bell size={14} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                             <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{n.message}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleTimeString()}</div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="jira-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.2rem', fontSize: '1rem', fontWeight: 800 }}>Quick Actions</h3>
                    <div style={{ display: 'grid', gap: '0.8rem' }}>
                       <button onClick={() => setActiveTab('team')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem' }}>
                          <UserPlus size={16} /> Add Employee
                       </button>
                       <button onClick={() => setShowInterviewModal(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem' }}>
                          <Calendar size={16} /> Schedule Interview
                       </button>
                       <button onClick={() => setShowNotificationModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem', color: 'white' }}>
                          <Send size={16} /> Send Notification
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* DASHBOARD SUMMARY ETC RENDERING CONTINUES... */}

          {/* ATTENDANCE SECTION */}
          {activeTab === 'attendance' && (
            <HRAttendance />
          )}

          {/* LIST VIEW */}
          {activeTab === 'list' && (
            <div className="fade-in-up">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', background: 'var(--column-bg)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                    <Filter size={16} style={{ marginRight: '8px', color: 'var(--text-muted)' }} />
                    <select 
                      value={hrPriorityFilter} 
                      onChange={e => setHrPriorityFilter(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', fontWeight: 600, outline: 'none' }}
                    >
                      <option value="">All Tiers</option>
                      <option value="High">🔴 High Priority</option>
                      <option value="Medium">🟡 Medium Tier</option>
                      <option value="Low">🟢 Low Priority</option>
                    </select>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', background: 'var(--column-bg)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                    <Briefcase size={16} style={{ marginRight: '8px', color: 'var(--text-muted)' }} />
                    <select 
                      value={selectedProjectFilter} 
                      onChange={e => setSelectedProjectFilter(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', fontWeight: 600, outline: 'none' }}
                    >
                      <option value="">All Workspaces</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
                    </select>
                 </div>

                 <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ marginLeft: 'auto', padding: '8px 16px' }}>Dispatch Duty 🚀</button>
              </div>

              <div className="jira-table-container">
                <table className="jira-table">
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>Identifier</th>
                      <th>Task Concept</th>
                      <th style={{ width: '150px' }}>Status</th>
                      <th style={{ width: '150px' }}>Assigned Unit</th>
                      <th style={{ width: '120px' }}>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.filter(t => (t.taskTitle||'').toLowerCase().includes(hrSearchQuery.toLowerCase()) && (hrPriorityFilter ? t.priority === hrPriorityFilter : true) && (selectedProjectFilter ? t.project?._id === selectedProjectFilter : true)).length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Found 0 records matching criteria.</td></tr>
                    ) : (
                      tasks.filter(t => (t.taskTitle||'').toLowerCase().includes(hrSearchQuery.toLowerCase()) && (hrPriorityFilter ? t.priority === hrPriorityFilter : true) && (selectedProjectFilter ? t.project?._id === selectedProjectFilter : true)).map(task => (
                        <tr key={task._id} onClick={() => { setSelectedTaskDetails(task); setShowDetailsModal(true); }}>
                          <td className="table-key" style={{ fontWeight: 700, color: 'var(--primary)' }}>{task.project?.projectKey || 'FIC'}-{task._id.substring(18,24).toUpperCase()}</td>
                          <td className="table-summary">{task.taskTitle}</td>
                          <td>
                             <span style={{ 
                               padding: '4px 10px', background: task.status === 'Completed' ? 'rgba(54, 179, 126, 0.1)' : 'rgba(var(--primary-rgb), 0.05)', 
                               color: task.status === 'Completed' ? '#36b37e' : 'var(--primary)', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800 
                             }}>
                               {task.status.toUpperCase()}
                             </span>
                          </td>
                          <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{task.assignedToEmployee?.name?.charAt(0)}</div>
                             {task.assignedToEmployee?.name || 'Unassigned'}
                          </td>
                          <td>{getPriorityBadge(task.priority)}</td>
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
            <div className="fade-in-up" style={{ display: 'flex', gap: '1.5rem', height: 'calc(100vh - 280px)', overflowX: 'auto', paddingBottom: '1rem' }}>
              {renderColumn('To Do', 'Draft / To Do', <List size={16}/>)}
              {renderColumn('In Progress', 'Active Operations', <TrendingUp size={16}/>)}
              {renderColumn('Under Review', 'Validation Pending', <AlertCircle size={16}/>)}
              {renderColumn('Completed', 'Successfully Executed', <CheckCircle size={16}/>)}
            </div>
          )}

          {/* LOSS OF PAY TAB */}
          {activeTab === 'lop' && (
            <div className="fade-in-up">
              <LOPManager />
            </div>
          )}

          {/* EMPLOYEES DIRECTORY */}
          {activeTab === 'employees' && (
            <div className="fade-in-up">
               <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                  <div className="glass-panel" style={{ flex: 1, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <Search size={18} color="var(--text-muted)" />
                     <input 
                      type="text" 
                      placeholder="Search units by name or competence..." 
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-color)', fontWeight: 600 }}
                     />
                  </div>
                  <button onClick={() => setShowAddMemberModal(true)} className="btn-primary" style={{ padding: '10px 20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                     <PlusCircle size={18} /> Invite Unit
                  </button>
               </div>

               <div className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
                 <table className="jira-table">
                   <thead>
                     <tr>
                        <th>Unit Identity</th>
                        <th>Deployment Role</th>
                        <th>Active Status</th>
                        <th>Current Workload</th>
                        <th></th>
                     </tr>
                   </thead>
                   <tbody>
                     {employees.filter(e => e.name.toLowerCase().includes(memberSearch.toLowerCase()) || e.email.toLowerCase().includes(memberSearch.toLowerCase())).map(emp => (
                       <tr key={emp._id} onClick={() => { setSelectedMember(emp); setShowMemberModal(true); }}>
                         <td style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, overflow: 'hidden' }}>
                              {emp.profileImage ? (
                                <img src={emp.profileImage.startsWith('http') ? emp.profileImage : `${UPLOADS_BASE_URL}/${emp.profileImage}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                emp.name.charAt(0)
                              )}
                            </div>
                            <div>
                               <div style={{ fontWeight: 800 }}>{emp.name}</div>
                               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                            </div>
                         </td>
                         <td>
                            <div style={{ fontWeight: 700 }}>{emp.designation || 'Specialist'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                         </td>
                         <td>
                            <span style={{ 
                              padding: '4px 10px', background: emp.status === 'On Leave' ? 'rgba(255, 86, 48, 0.1)' : 'rgba(54, 179, 126, 0.1)', 
                              color: emp.status === 'On Leave' ? 'var(--danger)' : 'var(--success)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 
                            }}>
                              {emp.status === 'On Leave' ? 'STAND DOWN' : 'ACTIVE DUTY'}
                            </span>
                         </td>
                         <td>
                            <div style={{ fontWeight: 700 }}>{tasks.filter(t => t.assignedToEmployee?._id === emp._id && t.status !== 'Completed').length} active</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total {tasks.filter(t => t.assignedToEmployee?._id === emp._id).length} assigned</div>
                         </td>
                         <td><ChevronRight size={18} color="var(--text-muted)" /></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="fade-in-up">
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {projects.map(proj => (
                    <div key={proj._id} onClick={() => { setSelectedProjectData(proj); setShowProjectDetailModal(true); }} className="jira-card" style={{ cursor: 'pointer', position: 'relative' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                          <span className="badge badge-medium">{proj.projectKey}</span>
                          <span className={`badge ${proj.status === 'Completed' ? 'badge-low' : 'badge-medium'}`}>{proj.status}</span>
                       </div>
                       <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '2rem' }}>{proj.projectName}</h3>
                       <div style={{ marginTop: 'auto' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>COMPLIANCE RATE</div>
                          <div style={{ height: 8, background: '#F4F5F7', borderRadius: '10px', overflow: 'hidden' }}>
                             <div style={{ width: `${proj.progress || 0}%`, height: '100%', background: 'var(--primary)' }}></div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="fade-in-up">
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--card-border)' }}>
                 <div onClick={() => setNotifTab('inbox')} style={{ paddingBottom: '12px', borderBottom: notifTab === 'inbox' ? '3px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: 800, color: notifTab === 'inbox' ? 'var(--primary)' : 'var(--text-muted)' }}>Incoming</div>
                 <div onClick={() => setNotifTab('sent')} style={{ paddingBottom: '12px', borderBottom: notifTab === 'sent' ? '3px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: 800, color: notifTab === 'sent' ? 'var(--primary)' : 'var(--text-muted)' }}>History</div>
              </div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {notifications.filter(n => notifTab === 'sent' ? n.sender?._id === user.id : n.recipient?._id === user.id).map(notif => (
                  <div key={notif._id} onClick={() => notifTab === 'inbox' && markAsRead(notif._id)} className="jira-card" style={{ display: 'flex', gap: '1.5rem', background: notif.status === 'Unread' && notifTab === 'inbox' ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--card-bg)' }}>
                    <div style={{ padding: '8px', background: 'rgba(54, 179, 126, 0.1)', color: 'var(--success)', borderRadius: '8px', height: 'fit-content' }}>
                       <Bell size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)' }}>{notif.type.toUpperCase()}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                       </div>
                       <p style={{ fontWeight: 600, fontSize: '1rem' }}>{notif.message}</p>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{notifTab === 'sent' ? `Dispatched to: ${notif.recipient?.name || 'Everyone'}` : `Source: ${notif.sender?.name || 'System Central'}`}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE TASK DRAWER (RIGHT SIDE) */}
      {showCreateModal && (
        <div className="jira-drawer-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="jira-drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Dispatch New Duty</h2>
              <X size={24} onClick={() => setShowCreateModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
            </div>
            <div className="drawer-content">
              <form onSubmit={handleCreateTask}>
                <div className="form-group">
                  <label className="form-label">Task Summary</label>
                  <input type="text" className="form-input" required value={taskForm.taskTitle} onChange={e => setTaskForm({...taskForm, taskTitle: e.target.value})} placeholder="Clear technical goal..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Functional Description</label>
                  <textarea className="form-textarea" required value={taskForm.taskDescription} onChange={e => setTaskForm({...taskForm, taskDescription: e.target.value})} placeholder="Steps, requirements, and objective..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <div className="form-group">
                      <label className="form-label">Assignee</label>
                      <select className="form-select" required value={taskForm.assignedToEmployee} onChange={e => setTaskForm({...taskForm, assignedToEmployee: e.target.value})}>
                         <option value="">Select Unit</option>
                         {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                      </select>
                   </div>
                   <div className="form-group">
                      <label className="form-label">Priority</label>
                      <select className="form-select" required value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                         <option value="High">🔴 High</option>
                         <option value="Medium">🟡 Medium</option>
                         <option value="Low">🟢 Low</option>
                      </select>
                   </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Operational Workspace</label>
                  <select className="form-select" required value={taskForm.project} onChange={e => setTaskForm({...taskForm, project: e.target.value})}>
                    <option value="">Choose Project</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.projectName} ({p.projectKey})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input type="date" className="form-input" required value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Internal Briefing Notes</label>
                  <textarea className="form-textarea" value={taskForm.notes} onChange={e => setTaskForm({...taskForm, notes: e.target.value})} placeholder="Administrative context..." />
                </div>
              </form>
            </div>
            <div className="drawer-footer">
               <button onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>Cancel</button>
               <button onClick={handleCreateTask} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>Initialize Task</button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION DRAWER (RIGHT SIDE) */}
      {showNotificationModal && (
        <div className="jira-drawer-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="jira-drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Pulse Broadcast</h2>
              <X size={24} onClick={() => setShowNotificationModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
            </div>
            <div className="drawer-content">
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Send real-time alerts to specific users or broadcast to the entire organization.</p>
              <form onSubmit={handleSendNotification}>
                <div className="form-group">
                   <label className="form-label">Target Audience</label>
                   <select className="form-select" required value={notificationForm.recipient} onChange={e => setNotificationForm({...notificationForm, recipient: e.target.value})}>
                     <option value="">Select Target</option>
                     <option value="all">🌐 ALL OPERATORS (GLOBAL)</option>
                     {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                   </select>
                </div>
                <div className="form-group">
                   <label className="form-label">Transmission Message</label>
                   <textarea className="form-textarea" required rows="6" value={notificationForm.message} onChange={e => setNotificationForm({...notificationForm, message: e.target.value})} placeholder="Urgent update or announcement..." />
                </div>
              </form>
            </div>
            <div className="drawer-footer">
               <button onClick={() => setShowNotificationModal(false)} className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>Discard</button>
               <button onClick={handleSendNotification} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>Emit Pulse 🔔</button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER DETAILS MODAL */}
      {showMemberModal && selectedMember && (
         <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
            <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '700px', padding: '3rem', borderRadius: '24px' }}>
               <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>
                  <div style={{ width: 100, height: 100, borderRadius: '20px', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800 }}>{selectedMember.name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                     <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{selectedMember.name}</h2>
                     <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>{selectedMember.email}</p>
                     <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                        <span className="badge badge-low">{selectedMember.designation}</span>
                        <span className="badge badge-medium">{selectedMember.department}</span>
                     </div>
                  </div>
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div className="jira-card" style={{ padding: '1.5rem' }}>
                     <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>ACTIVE DUTIES</div>
                     <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{tasks.filter(t => t.assignedToEmployee?._id === selectedMember._id && t.status !== 'Completed').length}</div>
                  </div>
                  <div className="jira-card" style={{ padding: '1.5rem' }}>
                     <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>SUCCESS RATE</div>
                     <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                        {Math.round((tasks.filter(t => t.assignedToEmployee?._id === selectedMember._id && t.status === 'Completed').length / (tasks.filter(t => t.assignedToEmployee?._id === selectedMember._id).length || 1)) * 100)}%
                     </div>
                  </div>
               </div>

               <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => { setShowMemberModal(false); setTaskForm({...taskForm, assignedToEmployee: selectedMember._id}); setShowCreateModal(true); }} className="btn-primary" style={{ flex: 1, padding: '12px' }}>Assign Duty</button>
                  <button onClick={() => setShowMemberModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Close Directory</button>
               </div>
            </div>
         </div>
      )}

      {/* TASK DETAILS MODAL */}
      {showDetailsModal && selectedTaskDetails && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
               <span className="badge badge-medium">{selectedTaskDetails.project?.projectKey || 'TASK'}-{selectedTaskDetails._id.substring(18,24).toUpperCase()}</span>
               <X size={24} onClick={() => setShowDetailsModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>{selectedTaskDetails.taskTitle}</h2>
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--column-bg)', borderRadius: '12px', fontSize: '0.95rem', lineHeight: '1.6', border: '1px solid var(--card-border)' }}>
               {selectedTaskDetails.taskDescription || 'No detailed briefing provided.'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
               <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>ASSIGNEE</label>
                  <p style={{ fontWeight: 700 }}>{selectedTaskDetails.assignedToEmployee?.name || 'Unassigned'}</p>
               </div>
               <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>STATUS</label>
                  <p style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedTaskDetails.status}</p>
               </div>
            </div>
            <button onClick={() => setShowDetailsModal(false)} className="btn-primary" style={{ width: '100%' }}>Dismiss</button>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showAddMemberModal && (
         <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
            <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', borderRadius: '24px' }}>
               <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Invite New Operator</h2>
               <form onSubmit={handleAddMember}>
                  <div className="form-group">
                     <label className="form-label">Full Name</label>
                     <input type="text" className="form-input" required value={addMemberForm.name} onChange={e => setAddMemberForm({...addMemberForm, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                     <label className="form-label">Email Address</label>
                     <input type="email" className="form-input" required value={addMemberForm.email} onChange={e => setAddMemberForm({...addMemberForm, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                     <label className="form-label">Designation</label>
                     <input type="text" className="form-input" required value={addMemberForm.designation} onChange={e => setAddMemberForm({...addMemberForm, designation: e.target.value})} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                     <button type="button" onClick={() => setShowAddMemberModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                     <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create Unit</button>
                  </div>
               </form>
            </div>
         </div>
      )}
      {/* SCHEDULE INTERVIEW MODAL */}
      {showInterviewModal && (
        <div className="modal-overlay" onClick={() => setShowInterviewModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', padding: '0', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
             
             {/* 1. FIXED HEADER */}
             <div style={{ 
               display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
               padding: '1.5rem 2rem', 
               background: 'var(--bg-color)', 
               borderBottom: '1px solid var(--card-border)',
               zIndex: 10
             }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Schedule Interview</h2>
                <X size={24} onClick={() => setShowInterviewModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
             </div>

             {/* 2. SCROLLING BODY */}
             <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Candidate Name</label>
                   <input 
                     type="text" 
                     style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)', outline: 'none' }}
                     value={interviewForm.candidateName}
                     onChange={(e) => setInterviewForm({ ...interviewForm, candidateName: e.target.value })}
                     placeholder="John Doe"
                   />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</label>
                   <input 
                     type="email" 
                     style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)', outline: 'none' }}
                     value={interviewForm.email}
                     onChange={(e) => setInterviewForm({ ...interviewForm, email: e.target.value })}
                     placeholder="john@example.com"
                   />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Position</label>
                   <input 
                     type="text" 
                     style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)', outline: 'none' }}
                     value={interviewForm.position}
                     onChange={(e) => setInterviewForm({ ...interviewForm, position: e.target.value })}
                     placeholder="Software Engineer"
                   />
                </div>
                
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                   <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</label>
                      <input 
                        type="date" 
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)', outline: 'none' }}
                        value={interviewForm.date}
                        onChange={(e) => setInterviewForm({ ...interviewForm, date: e.target.value })}
                      />
                   </div>
                   <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</label>
                      <input 
                        type="time" 
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)', outline: 'none' }}
                        value={interviewForm.time}
                        onChange={(e) => setInterviewForm({ ...interviewForm, time: e.target.value })}
                      />
                   </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assign Interviewer</label>
                   <select 
                     style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)', outline: 'none' }}
                     value={interviewForm.assignedToEmployee}
                     onChange={(e) => setInterviewForm({ ...interviewForm, assignedToEmployee: e.target.value })}
                   >
                     <option value="">Select an Evaluator...</option>
                     {employees.map(emp => (
                       <option key={emp._id} value={emp._id}>{emp.name} — {emp.department}</option>
                     ))}
                   </select>
                </div>
             </div>

             {/* 3. FIXED FOOTER */}
             <div style={{ 
               padding: '1.5rem 2rem', 
               borderTop: '1px solid var(--card-border)', 
               background: 'var(--bg-color)', 
               display: 'flex', gap: '1.5rem',
               zIndex: 10
             }}>
                <button onClick={() => setShowInterviewModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button 
                  disabled={!interviewForm.assignedToEmployee || !interviewForm.candidateName}
                  onClick={async () => {
                    try {
                      const payload = {
                        taskTitle: `Interview: ${interviewForm.candidateName} for ${interviewForm.position}`,
                        taskDescription: `Conduct interview for ${interviewForm.candidateName} (${interviewForm.email}).\nScheduled at: ${interviewForm.date} ${interviewForm.time}`,
                        assignedToEmployee: interviewForm.assignedToEmployee,
                        assignedByHR: user.id,
                        deadline: interviewForm.date,
                        issueType: 'Interview',
                        priority: 'High',
                        taskDate: interviewForm.date,
                        taskTime: interviewForm.time,
                        notes: `Position: ${interviewForm.position}`
                      };
                      await axios.post(`${API_BASE_URL}/api/tasks/assign`, payload);
                      alert(`Interview successfully assigned to ${employees.find(e => e._id === interviewForm.assignedToEmployee)?.name}!`);
                      setShowInterviewModal(false);
                      setInterviewForm({ candidateName: '', email: '', position: '', date: '', time: '', assignedToEmployee: '' });
                      fetchData();
                    } catch (err) {
                      alert("Error scheduling interview: " + (err.response?.data?.error || err.message));
                    }
                  }} className="btn-primary" style={{ flex: 1, color: 'white' }}>Schedule Now</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
