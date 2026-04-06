import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../apiConfig';
import { Search, Filter, Calendar, ClipboardList, CheckCircle, XCircle, Clock, Bell, Check, X } from 'lucide-react';

const HRAttendance = () => {
  const { user } = useContext(AuthContext);
  const [attendance, setAttendance] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchAttendance();
    fetchPendingLeaves();
  }, []);

  const fetchPendingLeaves = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/leaves`);
      // Show only pending on the side list
      setPendingLeaves(res.data.filter(l => l.status === 'Pending'));
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
      fetchAttendance(); // Refresh table as it might have new 'Leave' records
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
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    leave: attendance.filter(a => a.status === 'Leave').length,
  };

  const filteredData = attendance.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) &&
    (filterStatus ? a.status === filterStatus : true)
  );

  return (
    <div className="fade-in-up">
      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ width: 44, height: 44, background: 'rgba(54, 179, 126, 0.1)', color: 'var(--success)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.present}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>PRESENT TODAY</div>
          </div>
        </div>
        <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ width: 44, height: 44, background: 'rgba(255, 86, 48, 0.1)', color: 'var(--danger)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.absent}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>ABSENT RECORDS</div>
          </div>
        </div>
        <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ width: 44, height: 44, background: 'rgba(255, 171, 0, 0.1)', color: 'var(--warning)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.leave}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>ON LEAVE</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* LEFT: HR ACTIONS & REQUESTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="jira-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.2rem', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hiring & Scheduling</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
               <div style={{ padding: '12px', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={18} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Final Interviews Today</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>4 candidates scheduled</div>
                  </div>
               </div>
               <div style={{ padding: '12px', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bell size={18} style={{ color: 'var(--warning)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Pending Onboarding</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2 candidates ready</div>
                  </div>
               </div>
            </div>
          </div>

          <div className="jira-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employee Requests</h3>
              {pendingLeaves.length > 0 ? (
                <span className="badge badge-high" style={{ animation: 'pulse 2s infinite' }}>NEEDS ACTION</span>
              ) : (
                <span className="badge badge-medium">UP TO DATE</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {pendingLeaves.length === 0 ? (
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No pending requests</div>
               ) : (
                 pendingLeaves.map(leave => (
                   <div key={leave._id} style={{ padding: '12px', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{leave.name} — {leave.leaveType}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Requested: {leave.startDate} to {leave.endDate}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>Reason: {leave.reason}</div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button 
                          onClick={() => handleLeaveStatus(leave._id, 'Approved')}
                          className="btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button 
                          onClick={() => handleLeaveStatus(leave._id, 'Rejected')}
                          className="btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 86, 48, 0.1)', color: 'var(--danger)' }}
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

        {/* RIGHT: ATTENDANCE DETAILED LOG */}
        <div className="jira-card" style={{ padding: '0' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>HR Attendance Summary</h3>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search staff..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '8px', border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-color)', fontSize: '0.9rem', minWidth: '150px' }} 
              />
            </div>
          </div>
          <div className="jira-table-container">
            <table className="jira-table">
              <thead>
                <tr>
                  <th>Identity</th>
                  <th style={{ width: '150px' }}>Current State</th>
                  <th style={{ width: '150px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(record => (
                  <tr key={record._id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{record.name.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{record.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{record.role.toUpperCase()}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 800,
                        background: record.status === 'Present' ? 'rgba(54, 179, 126, 0.15)' : 'rgba(255, 86, 48, 0.15)',
                        color: record.status === 'Present' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {record.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{record.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRAttendance;
