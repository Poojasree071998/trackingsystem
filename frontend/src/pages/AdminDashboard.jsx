import React, { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LogOut, Users, FileText, Activity, LayoutDashboard, Briefcase, BarChart2, TrendingUp, TrendingDown, Sun, Moon, Search, PlusCircle, Plus, X, Layout, List, Settings, ChevronLeft, Bell, ChevronRight, UserPlus, Filter, LayoutList, Calendar, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_BASE_URL } from '../apiConfig';
import LOPManager from '../components/LOPManager';

import { useSocket } from '../context/SocketContext';
import AdminAttendance from '../components/AdminAttendance';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, overdue: 0 });
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);

  // Jira Drawer State
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [taskDrawerForm, setTaskDrawerForm] = useState({
    project: '', issueType: 'Task', status: 'To Do', taskTitle: '', taskDescription: '', assignedToEmployee: '', priority: 'Medium', deadline: ''
  });

  // Project Workspace State
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [projectTab, setProjectTab] = useState('board'); // board, issues, team, settings
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUserForProject, setSelectedUserForProject] = useState('');

  // Project Creation State (Individual Primitives for Absolute Reliability)
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectKey, setNewProjectKey] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectLead, setNewProjectLead] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('newNotification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
        fetchData(); 
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
    try {
      const [statsRes, tasksRes, notifRes, usersRes, projectsRes, leavesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/tasks/stats?role=admin&userId=${user.id}`),
        axios.get(`${API_BASE_URL}/api/tasks?role=admin&userId=${user.id}`),
        axios.get(`${API_BASE_URL}/api/notifications?userId=${user.id}`),
        axios.get(`${API_BASE_URL}/api/users`),
        axios.get(`${API_BASE_URL}/api/projects`),
        axios.get(`${API_BASE_URL}/api/leaves`)
      ]);
      setStats(statsRes.data);
      setTasks(tasksRes.data);
      setNotifications(notifRes.data);
      setAllUsers(usersRes.data);
      setProjects(projectsRes.data);
      setUnreadCount(notifRes.data.filter(n => n.status === 'Unread').length);
      setPendingLeaveCount(leavesRes.data.filter(l => l.status === 'Pending').length);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      if (!API_BASE_URL && window.location.hostname !== 'localhost') {
        throw new Error('Project deployment is missing API configuration.');
      }
      
      const payload = {
        projectName: newProjectName,
        projectKey: newProjectKey,
        description: newProjectDescription,
        lead: newProjectLead,
        deadline: newProjectDeadline,
        projectType: 'Software Project',
        priority: 'Medium'
      };

      await axios.post(`${API_BASE_URL}/api/projects`, payload);
      
      // Reset individual states
      setNewProjectName('');
      setNewProjectKey('');
      setNewProjectDescription('');
      setNewProjectLead('');
      setNewProjectDeadline('');
      
      setShowCreateProjectModal(false);
      fetchData();
    } catch (err) {
      console.error("Create Project Failed:", err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Error creating project';
      alert(`Deployment Error: ${msg}`);
    }
  };

  const handleCreateTaskDrawer = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...taskDrawerForm, assignedByHR: user.id };
      await axios.post(`${API_BASE_URL}/api/tasks/assign`, payload);
      setTaskDrawerForm({ project: '', issueType: 'Task', status: 'To Do', taskTitle: '', taskDescription: '', assignedToEmployee: '', priority: 'Medium', deadline: '' });
      setIsTaskDrawerOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating task');
    }
  };

  const handleSelectProject = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/projects/${id}`);
      setProjectData(res.data);
      setSelectedProject(id);
      setActiveTab('project-workspace');
    } catch (err) {
      console.error("Failed to fetch project details", err);
    }
  };


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'High': return <span className="badge badge-high"><span style={{width:'8px',height:'8px',background:'currentColor',borderRadius:'50%'}}></span> High</span>;
      case 'Medium': return <span className="badge badge-medium"><span style={{width:'8px',height:'8px',background:'currentColor',borderRadius:'50%'}}></span> Medium</span>;
      case 'Low': return <span className="badge badge-low"><span style={{width:'8px',height:'8px',background:'currentColor',borderRadius:'50%'}}></span> Low</span>;
      default: return priority;
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/api/notifications/${id}/read`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserForProject) return;
    try {
      await axios.put(`${API_BASE_URL}/api/projects/${selectedProject}/members`, {
        action: 'add',
        userId: selectedUserForProject
      });
      setShowAddMemberModal(false);
      setSelectedUserForProject('');
      // Refresh project data
      handleSelectProject(selectedProject); 
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding member');
    }
  };

  const renderProjectWorkspace = () => {
    if (!projectData) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Initialising Workspace...</div>;

    const renderBoard = () => (
      <div style={{ display: 'flex', gap: '1.5rem', minHeight: '60vh', overflowX: 'auto', paddingBottom: '1rem' }}>
        {['To Do', 'In Progress', 'Done'].map(column => (
          <div key={column} style={{ flex: 1, minWidth: '280px', background: 'var(--column-bg)', borderRadius: '4px', display: 'flex', flexDirection: 'column', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '4px 8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{column}</span>
              <span style={{ background: 'var(--card-border)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                {projectData.tasks?.filter(t => t.status === column).length || 0}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {projectData.tasks?.filter(t => t.status === column).map(task => (
                <div key={task._id} className="kanban-card-premium" style={{ background: 'var(--card-bg)', borderBottom: `3px solid ${task.priority === 'High' ? 'var(--danger)' : 'var(--success)'}` }}>
                   <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem' }}>{task.taskTitle}</div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="table-key" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{projectData.projectKey}-{task._id.substring(18,24).toUpperCase()}</div>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{task.assignedToEmployee?.name?.charAt(0)}</div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );

    const renderIssues = () => (
      <div className="jira-table-container">
        <table className="jira-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Key</th>
              <th>Summary</th>
              <th style={{ width: '150px' }}>Assignee</th>
              <th style={{ width: '120px' }}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {(projectData.tasks || []).map(task => (
              <tr key={task._id}>
                <td className="table-key" style={{ fontWeight: 700, color: 'var(--primary)' }}>{projectData.projectKey}-{task._id.substring(18,24).toUpperCase()}</td>
                <td className="table-summary">{task.taskTitle}</td>
                <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{task.assignedToEmployee?.name?.charAt(0)}</div>
                   {task.assignedToEmployee?.name || 'Unassigned'}
                </td>
                <td>{getPriorityBadge(task.priority)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    const renderTeam = () => (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Workspace Personnel</h2>
          <button onClick={() => setShowAddMemberModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
            <Plus size={18} /> Add Unit
          </button>
        </div>
        <div className="jira-table-container">
           <table className="jira-table">
              <thead>
                 <tr>
                    <th>Identity</th>
                    <th>Role</th>
                    <th>Department</th>
                 </tr>
              </thead>
              <tbody>
                 <tr style={{ background: 'rgba(var(--primary-rgb), 0.05)' }}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{projectData.lead?.name?.charAt(0)}</div>
                       <div style={{ fontWeight: 800 }}>{projectData.lead?.name} (Lead)</div>
                    </td>
                    <td><span className="badge badge-high">COMMANDER</span></td>
                    <td>{projectData.lead?.department || 'Central Command'}</td>
                 </tr>
                 {projectData.members?.map(m => (
                    <tr key={m._id}>
                       <td style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--column-bg)', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{m.name.charAt(0)}</div>
                          <div style={{ fontWeight: 800 }}>{m.name}</div>
                       </td>
                       <td><span className="badge badge-medium">{m.role.toUpperCase()}</span></td>
                       <td>{m.department}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    );

    return (
      <div className="fade-in-up">
        <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
             <div style={{ width: 40, height: 40, background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>{projectData.projectKey}</div>
             <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{projectData.projectName}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Active Portfolio Workspace</div>
             </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['board', 'issues', 'team'].map(tab => (
              <span key={tab} className={`tab-item ${projectTab === tab ? 'active' : ''}`} style={{ cursor: 'pointer', paddingBottom: '8px', borderBottom: projectTab === tab ? '3px solid var(--primary)' : 'none', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', color: projectTab === tab ? 'var(--primary)' : 'var(--text-muted)' }} onClick={() => setProjectTab(tab)}>
                {tab}
              </span>
            ))}
          </div>
        </header>

        {projectTab === 'board' && renderBoard()}
        {projectTab === 'issues' && renderIssues()}
        {projectTab === 'team' && renderTeam()}
      </div>
    );
  };

  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminPriorityFilter, setAdminPriorityFilter] = useState('');
  const [adminIssueTypeFilter, setAdminIssueTypeFilter] = useState('');

  return (
    <div className="jira-layout">
      {/* JIRA TOP NAV - Admin */}
      <nav className="jira-top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <div className="nav-icon-container" style={{ background: 'var(--primary)', color: 'white' }}>
             <LayoutDashboard size={18} />
           </div>
           <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>Admin Console</span>
           <div style={{ display: 'flex', gap: '1.2rem', marginLeft: '2rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              <span style={{ cursor: 'pointer', color: activeTab === 'dashboard' ? 'var(--primary)' : 'inherit' }} onClick={() => setActiveTab('dashboard')}>Summary</span>
              <span style={{ cursor: 'pointer', color: activeTab === 'projects' ? 'var(--primary)' : 'inherit' }} onClick={() => setActiveTab('projects')}>Projects</span>
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
                placeholder="Search everything..." 
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
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
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                {user?.name?.charAt(0)}
              </div>
           </div>
        </div>
      </nav>

      <div className="jira-body-container">
        {/* JIRA SIDEBAR - Admin */}
        <aside className="jira-sidebar">
          <div style={{ padding: '0 0.8rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Infrastructure</div>
            <div className={`jira-sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><Activity size={18} /> Global Health</div>
            <div className={`jira-sidebar-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}><List size={18} /> Master Backlog</div>
            <div className={`jira-sidebar-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}><BarChart2 size={18} /> Strategic Reports</div>
          </div>
          
          <div style={{ padding: '0 0.8rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Governance</div>
            <div className={`jira-sidebar-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><Users size={18} /> Identity Manager</div>
            <div className={`jira-sidebar-btn ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}><Briefcase size={18} /> Portfolio Map</div>
            <div className={`jira-sidebar-btn ${activeTab === 'attendance' ? 'active' : ''}`} style={{ position: 'relative' }} onClick={() => setActiveTab('attendance')}>
              <Calendar size={18} /> Attendance Hub
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
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Alerts</div>
            <div className={`jira-sidebar-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}><Bell size={18} /> System Audio</div>
            <div className="jira-sidebar-btn" onClick={() => setShowCreateProjectModal(true)} style={{ color: 'var(--primary)' }}><Plus size={18} /> New Portfolio</div>
          </div>
          
          <div style={{ marginTop: 'auto', padding: '1rem' }}>
             <div className="jira-sidebar-btn" onClick={handleLogout} style={{ color: 'var(--danger)', background: 'rgba(255, 86, 48, 0.05)' }}>
                <LogOut size={18} /> Logout
             </div>
          </div>
        </aside>

        {/* JIRA MAIN CONTENT - Admin */}
        <main className="jira-main-content">
          <header style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              FIC <ChevronRight size={14} /> Governance <ChevronRight size={14} /> {activeTab.toUpperCase()}
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              {activeTab === 'dashboard' ? 'Executive Dashboard' : activeTab === 'list' ? 'Global Archive' : activeTab === 'projects' ? 'Active Workspaces' : activeTab === 'users' ? 'Directory' : activeTab === 'attendance' ? 'Attendance Overview' : activeTab === 'lop' ? 'Loss of Pay Control' : 'Analytics'}
            </h1>
          </header>

          {/* DASHBOARD SUMMARY */}
          {activeTab === 'dashboard' && (
            <div className="fade-in-up">
              {/* TOP: STATS CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
                <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem' }}>
                   <div style={{ width: 40, height: 40, background: 'rgba(54, 179, 126, 0.1)', color: 'var(--success)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} />
                   </div>
                   <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats.totalGlobalUsers || allUsers.length}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL USERS</div>
                   </div>
                </div>
                <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem' }}>
                   <div style={{ width: 40, height: 40, background: 'rgba(0, 82, 204, 0.1)', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Briefcase size={20} />
                   </div>
                   <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats.totalGlobalProjects || projects.length}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL PROJECTS</div>
                   </div>
                </div>
                <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem' }}>
                   <div style={{ width: 40, height: 40, background: 'rgba(255, 171, 0, 0.1)', color: 'var(--warning)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LayoutList size={20} />
                   </div>
                   <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats.totalGlobalTasks || tasks.length}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL TASKS</div>
                   </div>
                </div>
                 <div 
                  className="jira-card" 
                  onClick={() => { setAdminIssueTypeFilter('Interview'); setActiveTab('list'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', cursor: 'pointer', transition: 'all 0.2s', border: adminIssueTypeFilter === 'Interview' ? '2px solid var(--primary)' : '1px solid var(--card-border)' }}
                 >
                    <div style={{ width: 40, height: 40, background: 'rgba(111, 110, 245, 0.1)', color: '#6F6EF5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Calendar size={20} />
                    </div>
                    <div>
                       <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats.totalInterviews || 0}</div>
                       <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>INTERVIEWS</div>
                    </div>
                 </div>
                <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem' }}>
                   <div style={{ width: 40, height: 40, background: 'rgba(255, 86, 48, 0.1)', color: 'var(--danger)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={20} />
                   </div>
                   <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats.overdue || 0}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>SYSTEM ISSUES</div>
                   </div>
                </div>
              </div>

              {/* MIDDLE: CHARTS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                 <div className="jira-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 800 }}>Team Performance Oversight</h3>
                    <div style={{ height: '300px' }}>
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={[
                            { name: 'Admin', count: allUsers.filter(u => u.role === 'admin').length },
                            { name: 'HR', count: allUsers.filter(u => u.role === 'hr').length },
                            { name: 'Employees', count: allUsers.filter(u => u.role === 'employee').length }
                         ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="var(--text-muted)" />
                            <YAxis axisLine={false} tickLine={false} stroke="var(--text-muted)" />
                            <Tooltip cursor={{ fill: 'var(--column-bg)' }} contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-color)' }} />
                            <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                         </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="jira-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 800 }}>Portfolio Success Analytics</h3>
                    <div style={{ height: '300px' }}>
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={[
                               { name: 'Done', value: stats.completed || 0 },
                               { name: 'In Progress', value: stats.pending || 0 },
                               { name: 'Overdue', value: stats.overdue || 0 }
                            ]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                               <Cell fill="var(--success)" />
                               <Cell fill="var(--primary)" />
                               <Cell fill="var(--danger)" />
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Legend />
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              {/* BOTTOM: ACTIVITY / NOTIFICATIONS / QUICK ACTIONS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                 {/* RECENT ACTIVITY */}
                  <div className="jira-card" style={{ padding: '1.5rem' }}>
                     <h3 style={{ marginBottom: '1.2rem', fontSize: '1rem', fontWeight: 800 }}>Recent Activity</h3>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {tasks.slice(0, 5).map(task => (
                           <div key={task._id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: task.issueType === 'Interview' ? 'rgba(111, 110, 245, 0.1)' : 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: task.issueType === 'Interview' ? '#6F6EF5' : 'var(--primary)' }}>
                                 {task.issueType === 'Interview' ? <Calendar size={16} /> : <FileText size={16} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                 <div style={{ fontSize: '0.85rem', fontWeight: 700, color: task.issueType === 'Interview' ? '#6F6EF5' : 'inherit' }}>{task.taskTitle}</div>
                                 <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {task.issueType === 'Interview' ? `Scheduled for ${task.taskDate} ${task.taskTime}` : `Status updated to ${task.status}`}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                 {/* NOTIFICATIONS */}
                 <div className="jira-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.2rem', fontSize: '1rem', fontWeight: 800 }}>Notifications</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       {notifications.slice(0, 4).map(notif => (
                          <div key={notif._id} style={{ display: 'flex', gap: '10px' }}>
                             <Bell size={16} style={{ color: notif.status === 'Unread' ? 'var(--primary)' : 'var(--text-muted)', marginTop: '4px' }} />
                             <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: notif.status === 'Unread' ? 'var(--text-color)' : 'var(--text-muted)' }}>{notif.message}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleTimeString()}</div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* QUICK ACTIONS */}
                 <div className="jira-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.2rem', fontSize: '1rem', fontWeight: 800 }}>Quick Actions</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                        <button onClick={() => setActiveTab('users')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem' }}>
                           <UserPlus size={16} /> Add User
                        </button>
                        <button onClick={() => setShowCreateProjectModal(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem' }}>
                           <PlusCircle size={16} /> Create Project
                        </button>
                        <button onClick={() => setIsTaskDrawerOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem', color: 'white' }}>
                           <PlusCircle size={16} /> Create Task
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
                 <div style={{ display: 'flex', alignItems: 'center', background: 'var(--column-bg)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                    <Filter size={16} style={{ marginRight: '8px', color: 'var(--text-muted)' }} />
                    <select 
                      value={adminPriorityFilter} 
                      onChange={e => setAdminPriorityFilter(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', fontWeight: 600, outline: 'none' }}
                    >
                      <option value="">Priority</option>
                      <option value="High">🔴 High</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Low">🟢 Low</option>
                    </select>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', background: 'var(--column-bg)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                    <Calendar size={16} style={{ marginRight: '8px', color: 'var(--text-muted)' }} />
                    <select 
                      value={adminIssueTypeFilter} 
                      onChange={e => setAdminIssueTypeFilter(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', fontWeight: 600, outline: 'none' }}
                    >
                      <option value="">Issue Type</option>
                      <option value="Task">Task</option>
                      <option value="Bug">Bug</option>
                      <option value="Story">Story</option>
                      <option value="Interview">Interview</option>
                    </select>
                 </div>
              </div>

              <div className="jira-table-container">
                <table className="jira-table">
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>Key</th>
                      <th>Work Summary</th>
                      <th style={{ width: '150px' }}>Current State</th>
                      <th style={{ width: '150px' }}>Assignee</th>
                      <th style={{ width: '120px' }}>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.filter(t => 
                      (t.taskTitle||'').toLowerCase().includes(adminSearchQuery.toLowerCase()) && 
                      (adminPriorityFilter ? t.priority === adminPriorityFilter : true) &&
                      (adminIssueTypeFilter ? t.issueType === adminIssueTypeFilter : true)
                    ).length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>0 artifacts found.</td></tr>
                    ) : (
                      tasks.filter(t => 
                        (t.taskTitle||'').toLowerCase().includes(adminSearchQuery.toLowerCase()) && 
                        (adminPriorityFilter ? t.priority === adminPriorityFilter : true) &&
                        (adminIssueTypeFilter ? t.issueType === adminIssueTypeFilter : true)
                      ).map(task => (
                        <tr key={task._id} style={{ borderLeft: task.issueType === 'Interview' ? '3px solid #6F6EF5' : 'none' }}>
                          <td className="table-key" style={{ fontWeight: 700, color: task.issueType === 'Interview' ? '#6F6EF5' : 'var(--primary)' }}>
                            {task.issueType === 'Interview' ? 'HIRING' : task.project?.projectKey || 'FIC'}-{task._id.substring(18,24).toUpperCase()}
                          </td>
                          <td className="table-summary">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               {task.issueType === 'Interview' && <Calendar size={14} style={{ color: '#6F6EF5' }} />}
                               {task.taskTitle}
                            </div>
                          </td>
                          <td>
                             <span style={{ 
                               padding: '4px 10px', 
                               background: task.status === 'Completed' ? 'rgba(54, 179, 126, 0.1)' : (task.issueType === 'Interview' ? 'rgba(111, 110, 245, 0.05)' : 'rgba(var(--primary-rgb), 0.05)'), 
                               color: task.status === 'Completed' ? '#36b37e' : (task.issueType === 'Interview' ? '#6F6EF5' : 'var(--primary)'), 
                               borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800 
                             }}>
                               {task.status.toUpperCase()}
                             </span>
                          </td>
                          <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{task.assignedToEmployee?.name?.charAt(0)}</div>
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

          {/* PROJECT MAP */}
          {activeTab === 'projects' && (
            <div className="fade-in-up">
               <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                  <button onClick={() => setShowCreateProjectModal(true)} className="btn-primary" style={{ padding: '10px 20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                     <Plus size={18} /> New Portfolio Workspace
                  </button>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {projects.map(proj => (
                    <div key={proj._id} onClick={() => handleSelectProject(proj._id)} className="jira-card" style={{ cursor: 'pointer' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                          <span className="badge badge-medium">{proj.projectKey}</span>
                          <span className="badge badge-low">{proj.status}</span>
                       </div>
                       <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '2rem' }}>{proj.projectName}</h3>
                       <div style={{ marginTop: 'auto' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                             <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>PROJECT PROGRESS</span>
                             <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{proj.progress}%</span>
                          </div>
                          <div style={{ height: 6, background: 'var(--card-border)', borderRadius: '10px', overflow: 'hidden' }}>
                             <div style={{ width: `${proj.progress}%`, height: '100%', background: 'var(--primary)' }}></div>
                          </div>
                       </div>
                       <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{proj.lead?.name?.charAt(0)}</div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Lead: {proj.lead?.name}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* USERS / PROJECTS ETC RENDERING CONTINUES... */}
          
          {/* ATTENDANCE SECTION */}
          {activeTab === 'attendance' && (
            <AdminAttendance />
          )}

          {/* USER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="fade-in-up">
               <div className="jira-table-container">
                 <table className="jira-table">
                   <thead>
                     <tr>
                        <th>Identity</th>
                        <th>Role</th>
                        <th>Communication</th>
                        <th>Deployment</th>
                     </tr>
                   </thead>
                   <tbody>
                     {allUsers.map(u => (
                       <tr key={u._id}>
                         <td style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '8px', background: u.role === 'admin' ? 'var(--primary)' : u.role === 'hr' ? 'var(--success)' : 'var(--column-bg)', color: u.role === 'employee' ? 'var(--text-color)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{u.name.charAt(0)}</div>
                            <div style={{ fontWeight: 800 }}>{u.name}</div>
                         </td>
                         <td>
                            <span className="badge badge-medium" style={{ background: u.role === 'admin' ? 'var(--danger)' : 'rgba(var(--primary-rgb),0.05)', color: u.role === 'admin' ? 'white' : 'var(--text-color)' }}>{u.role.toUpperCase()}</span>
                         </td>
                         <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{u.email}</td>
                         <td>{u.designation || 'Specialist'} ({u.department || 'Central Operations'})</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* ANALYTICS / REPORTS */}
          {activeTab === 'reports' && (
             <div className="fade-in-up">
                <div className="jira-card" style={{ padding: '4rem', textAlign: 'center' }}>
                   <BarChart2 size={64} style={{ color: 'var(--primary)', opacity: 0.2, marginBottom: '2rem' }} />
                   <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Under Intelligence Review</h2>
                   <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Strategic data pipelines are currently being aggregated for Q4 reporting.</p>
                </div>
             </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="fade-in-up">
               <div style={{ display: 'grid', gap: '1rem' }}>
                  {notifications.map(notif => (
                    <div key={notif._id} onClick={() => markAsRead(notif._id)} className="jira-card" style={{ display: 'flex', gap: '1.5rem', background: notif.status === 'Unread' ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--card-bg)' }}>
                      <div style={{ padding: '8px', background: 'rgba(0, 82, 204, 0.1)', color: 'var(--primary)', borderRadius: '8px', height: 'fit-content' }}>
                        <Bell size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>{notif.type.toUpperCase()}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontWeight: 600, fontSize: '1rem' }}>{notif.message}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* LOP MANAGEMENT */}
          {activeTab === 'lop' && <LOPManager />}

          {/* PROJECT WORKSPACE VIEW */}
          {activeTab === 'project-workspace' && renderProjectWorkspace()}
        </main>
      </div>

      {/* CREATE TASK DRAWER (RIGHT SIDE) */}
      {isTaskDrawerOpen && createPortal(
        <div className="jira-drawer-overlay portal-fix" onClick={() => setIsTaskDrawerOpen(false)}>
          <div className="jira-drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Initialize System Issue</h2>
              <X size={24} onClick={() => setIsTaskDrawerOpen(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
            </div>
            <div className="drawer-content">
              <form id="drawerTaskFormAdmin" onSubmit={handleCreateTaskDrawer} style={{ pointerEvents: 'auto', position: 'relative', zIndex: 2147483647 }}>
                <div className="form-group">
                   <label className="form-label">Portfolio Space</label>
                   <select className="form-select focus-debug" required value={taskDrawerForm.project} onChange={e => setTaskDrawerForm({...taskDrawerForm, project: e.target.value})}>
                      <option value="">Global Backlog</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.projectName} ({p.projectKey})</option>)}
                   </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <div className="form-group">
                      <label className="form-label">Issue Type</label>
                      <select className="form-select focus-debug" required value={taskDrawerForm.issueType} onChange={e => setTaskDrawerForm({...taskDrawerForm, issueType: e.target.value})}>
                        <option value="Task">Task</option>
                        <option value="Bug">Bug</option>
                        <option value="Story">Story</option>
                      </select>
                   </div>
                   <div className="form-group">
                      <label className="form-label">Initial Status</label>
                      <select className="form-select focus-debug" value={taskDrawerForm.status} onChange={e => setTaskDrawerForm({...taskDrawerForm, status: e.target.value})}>
                         <option value="To Do">TO DO</option>
                         <option value="In Progress">IN PROGRESS</option>
                         <option value="Done">DONE</option>
                      </select>
                   </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Work Summary</label>
                  <input type="text" className="form-input focus-debug" required value={taskDrawerForm.taskTitle} onChange={e => setTaskDrawerForm({...taskDrawerForm, taskTitle: e.target.value})} placeholder="Clear objective..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Functional Description</label>
                  <textarea className="form-textarea focus-debug" value={taskDrawerForm.taskDescription} onChange={e => setTaskDrawerForm({...taskDrawerForm, taskDescription: e.target.value})} rows="6" placeholder="Context, details, and requirements..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <div className="form-group">
                      <label className="form-label">Assignee</label>
                      <select className="form-select focus-debug" required value={taskDrawerForm.assignedToEmployee} onChange={e => setTaskDrawerForm({...taskDrawerForm, assignedToEmployee: e.target.value})}>
                         <option value="">Choose Unit</option>
                         {allUsers.filter(u => u.role !== 'admin').map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                      </select>
                   </div>
                   <div className="form-group">
                      <label className="form-label">Priority</label>
                      <select className="form-select focus-debug" value={taskDrawerForm.priority} onChange={e => setTaskDrawerForm({...taskDrawerForm, priority: e.target.value})}>
                        <option value="High">🔴 High</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="Low">🟢 Low</option>
                      </select>
                   </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Maturity Date</label>
                  <input type="date" className="form-input focus-debug" required value={taskDrawerForm.deadline} onChange={e => setTaskDrawerForm({...taskDrawerForm, deadline: e.target.value})} />
                </div>
              </form>
            </div>
            <div className="drawer-footer">
               <button onClick={() => setIsTaskDrawerOpen(false)} className="btn-secondary" style={{ padding: '10px 20px' }}>Cancel</button>
               <button type="submit" form="drawerTaskFormAdmin" className="btn-primary" style={{ padding: '10px 24px' }}>Commit Artifact</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CREATE PROJECT DRAWER (RIGHT SIDE) */}
      {showCreateProjectModal && createPortal(
        <div className="jira-drawer-overlay portal-fix" onClick={() => setShowCreateProjectModal(false)}>
          <div className="jira-drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Setup Portfolio Workspace</h2>
              <X size={24} onClick={() => setShowCreateProjectModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
            </div>
            <div className="drawer-content">
              <form id="projectCreateFormAdmin" onSubmit={handleCreateProject} style={{ pointerEvents: 'auto', position: 'relative', zIndex: 2147483647 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                   <div className="form-group">
                      <label className="form-label">Portfolio Name</label>
                      <input 
                        type="text" 
                        className="form-input focus-debug" 
                        required 
                        autoFocus
                        onMouseDown={(e) => e.currentTarget.focus()}
                        value={newProjectName} onChange={e => setNewProjectName(e.target.value)} 
                        placeholder="e.g. Apollo Mission" 
                      />
                   </div>
                   <div className="form-group">
                      <label className="form-label">Identifier</label>
                      <input 
                        type="text" 
                        className="form-input focus-debug" 
                        required 
                        onMouseDown={(e) => e.currentTarget.focus()}
                        value={newProjectKey} onChange={e => setNewProjectKey(e.target.value.toUpperCase())} 
                        placeholder="APO" 
                      />
                   </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Strategic Objective</label>
                  <textarea 
                    className="form-textarea focus-debug" 
                    required 
                    rows="4" 
                    onMouseDown={(e) => e.currentTarget.focus()}
                    value={newProjectDescription} onChange={e => setNewProjectDescription(e.target.value)} 
                    placeholder="Project scope and goals..." 
                  />
                </div>
                <div className="form-group">
                   <label className="form-label">Appointed Lead</label>
                   <select className="form-select focus-debug" required value={newProjectLead} onChange={e => setNewProjectLead(e.target.value)}>
                      <option value="">Assign Commander</option>
                      {allUsers.filter(u => u.role === 'hr' || u.role === 'admin').map(u => <option key={u._id} value={u._id}>{u.name} ({u.role.toUpperCase()})</option>)}
                   </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Operational Deadline</label>
                  <input type="date" className="form-input focus-debug" required value={newProjectDeadline} onChange={e => setNewProjectDeadline(e.target.value)} />
                </div>
              </form>
            </div>
            <div className="drawer-footer">
               <button onClick={() => setShowCreateProjectModal(false)} className="btn-secondary" style={{ padding: '10px 20px' }}>Cancel</button>
               <button type="submit" form="projectCreateFormAdmin" className="btn-primary" style={{ padding: '10px 24px' }}>Launch Workspace</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ADD MEMBER MODAL */}
      {showAddMemberModal && createPortal(
        <div className="modal-overlay portal-fix" onClick={() => setShowAddMemberModal(false)}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 800 }}>Add Unit to Project</h2>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 800 }}>Search Identity</label>
              <select className="form-select focus-debug" value={selectedUserForProject} onChange={e => setSelectedUserForProject(e.target.value)}>
                <option value="">Select individual...</option>
                {allUsers.filter(u => u.role !== 'admin' && !projectData?.members?.some(m => m._id === u._id) && projectData?.lead?._id !== u._id).map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role.toUpperCase()})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
              <button onClick={() => setShowAddMemberModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Discard</button>
              <button onClick={handleAddMember} className="btn-primary" style={{ flex: 1, padding: '12px' }}>Confirm Access</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminDashboard;
