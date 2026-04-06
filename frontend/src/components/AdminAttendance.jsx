import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../apiConfig';
import { Search, Filter, Calendar, Users, CheckCircle, XCircle, Clock, Check, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminAttendance = () => {
  const { user } = useContext(AuthContext);
  const [attendance, setAttendance] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchAttendance();
    fetchPendingLeaves();
  }, []);

  const fetchPendingLeaves = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/leaves`);
      const pending = res.data.filter(l => l.status === 'Pending');
      setPendingLeaves(pending);
      setPendingLeaveCount(pending.length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE_URL}/api/leaves/${id}/status`, {
        status,
        approvedBy: user.id
      });
      fetchPendingLeaves();
      fetchAttendance(); // Refresh metrics
    } catch (err) {
      console.error("Leave update error:", err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/attendance`);
      setAttendance(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    leave: attendance.filter(a => a.status === 'Leave').length,
  };

  const chartData = [
    { name: 'Present', value: stats.present, color: '#36B37E' },
    { name: 'Absent', value: stats.absent, color: '#FF5630' },
    { name: 'Leave', value: stats.leave, color: '#FFAB00' },
  ].filter(d => d.value > 0);

  const filteredData = attendance.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) &&
    (filterStatus ? a.status === filterStatus : true)
  );

  return (
    <div className="fade-in-up">
      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.2rem', marginBottom: '2.5rem' }}>
        <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1.2rem' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(0, 82, 204, 0.1)', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.total}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>RECORDS</div>
          </div>
        </div>
        <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1.2rem' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(54, 179, 126, 0.1)', color: 'var(--success)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.present}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>PRESENT</div>
          </div>
        </div>
        <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1.2rem' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255, 86, 48, 0.1)', color: 'var(--danger)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.absent}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>ABSENT</div>
          </div>
        </div>
        <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1.2rem' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255, 171, 0, 0.1)', color: 'var(--warning)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.leave}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>ON LEAVE</div>
          </div>
        </div>
        <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1.2rem', background: pendingLeaveCount > 0 ? 'rgba(0, 82, 204, 0.05)' : 'var(--card-bg)' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(0, 82, 204, 0.1)', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: pendingLeaveCount > 0 ? 'var(--primary)' : 'inherit' }}>{pendingLeaveCount}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>PENDING</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* ATTENDANCE TABLE */}
        <div className="jira-card" style={{ padding: '0' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Enterprise Attendance Log</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Employee name..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: '8px 12px 8px 32px', borderRadius: '4px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '0.85rem' }} 
                />
              </div>
              <select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '0.85rem' }}
              >
                <option value="">All Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </select>
            </div>
          </div>
          <div className="jira-table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="jira-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No records found.</td></tr>
                ) : (
                  filteredData.map(record => (
                    <tr key={record._id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{record.name.charAt(0)}</div>
                        <div style={{ fontWeight: 700 }}>{record.name}</div>
                      </td>
                      <td><span className="badge badge-medium">{record.role.toUpperCase()}</span></td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 800,
                          background: record.status === 'Present' ? 'rgba(54, 179, 126, 0.1)' : record.status === 'Absent' ? 'rgba(255, 86, 48, 0.1)' : 'rgba(255, 171, 0, 0.1)',
                          color: record.status === 'Present' ? 'var(--success)' : record.status === 'Absent' ? 'var(--danger)' : 'var(--warning)'
                        }}>
                          {record.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{record.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: ANALYTICS & PENDING */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* PENDING APPROVALS LIST */}
          <div className="jira-card" style={{ padding: '1.5rem', borderLeft: pendingLeaves.length > 0 ? '4px solid var(--primary)' : '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Approvals</h3>
              <span className={`badge ${pendingLeaves.length > 0 ? 'badge-high' : 'badge-low'}`}>{pendingLeaves.length} NEW</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {pendingLeaves.length === 0 ? (
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Zero active requests</div>
               ) : (
                 pendingLeaves.map(leave => (
                   <div key={leave._id} style={{ padding: '12px', background: 'rgba(var(--primary-rgb), 0.03)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{leave.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{leave.leaveType} • {leave.startDate} to {leave.endDate}</div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button 
                          onClick={() => handleLeaveStatus(leave._id, 'Approved')}
                          className="btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Check size={10} /> Approve
                        </button>
                        <button 
                          onClick={() => handleLeaveStatus(leave._id, 'Rejected')}
                          className="btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 86, 48, 0.1)', color: 'var(--danger)' }}
                        >
                          <X size={10} /> Reject
                        </button>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>

          {/* ANALYTICS CHART */}
          <div className="jira-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 800, fontSize: '1.1rem' }}>Engagement Mix</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData} 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>ATTENDANCE RATE</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--card-border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${stats.total > 0 ? (stats.present / stats.total) * 100 : 0}%`, height: '100%', background: 'var(--success)' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default AdminAttendance;
