import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../apiConfig';
import { Search, Calendar, ClipboardList, CheckCircle, XCircle, Clock, AlertCircle, X, Send } from 'lucide-react';

const EmployeeAttendance = () => {
  const { user } = useContext(AuthContext);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, leave: 0 });

  const [myLeaves, setMyLeaves] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '', leaveType: 'Casual' });

  useEffect(() => {
    if (user?.id) {
       fetchMyAttendance();
       fetchMyLeaves();
    }
  }, [user]);

  const fetchMyLeaves = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/leaves/me/${user.id}`);
      setMyLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyAttendance = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/attendance/me/${user.id}`);
      setAttendance(res.data);
      
      const p = res.data.filter(a => a.status === 'Present').length;
      const a = res.data.filter(a => a.status === 'Absent').length;
      const l = res.data.filter(a => a.status === 'Leave').length;
      setStats({ present: p, absent: a, leave: l });
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/leaves/apply`, { ...leaveForm, userId: user.id, name: user.name });
      setShowLeaveModal(false);
      setLeaveForm({ startDate: '', endDate: '', reason: '', leaveType: 'Casual' });
      fetchMyLeaves();
      alert('Leave request submitted successfully!');
    } catch (err) {
      alert('Error applying for leave');
    }
  };

  const handleMarkAttendance = async () => {
    try {
      const date = new Date().toISOString().split('T')[0];
      const res = await axios.post(`${API_BASE_URL}/api/attendance/mark`, {
        userId: user.id,
        name: user.name,
        role: user.role,
        status: 'Present',
        date: date
      });
      alert('✅ Today\'s Attendance marked successfully!');
      fetchMyAttendance();
    } catch (err) {
      console.error("Mark attendance error:", err);
      alert('❌ Failed to mark attendance: ' + (err.response?.data?.error || err.message));
    }
  };

  const isAlreadyMarked = attendance.some(a => a.date === new Date().toISOString().split('T')[0]);
  const isOnLeaveToday = attendance.some(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'Leave');

  return (
    <>
      <div className="fade-in-up" style={{ padding: '0 5px' }}>
        {/* SECTION 1: TOP PERFORMANCE SUMMARY (Full Width) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', borderLeft: '4px solid var(--primary)', padding: '1.5rem' }}>
            <div style={{ width: 48, height: 48, background: 'rgba(0, 82, 204, 0.1)', color: 'var(--primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={28} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.present}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>PRESENT DAYS</div>
            </div>
          </div>
          <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', borderLeft: '4px solid var(--danger)', padding: '1.5rem' }}>
            <div style={{ width: 48, height: 48, background: 'rgba(255, 86, 48, 0.1)', color: 'var(--danger)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={28} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.absent}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>ABSENCES</div>
            </div>
          </div>
          <div className="jira-card" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', borderLeft: '4px solid var(--warning)', padding: '1.5rem' }}>
            <div style={{ width: 48, height: 48, background: 'rgba(255, 171, 0, 0.1)', color: 'var(--warning)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={28} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.leave} / 25</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>LEAVE TAKEN</div>
            </div>
          </div>
        </div>

        {/* SECTION 2: DAILY ACTION HUB (Full Width Call-to-Action) */}
        {!isAlreadyMarked && !isOnLeaveToday && (
          <div className="jira-card fade-in-up" style={{ 
            padding: '2rem', 
            marginBottom: '2.5rem', 
            background: 'linear-gradient(90deg, var(--card-bg) 0%, rgba(var(--primary-rgb), 0.05) 100%)',
            border: '1px solid var(--primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '16px'
          }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-color)', marginBottom: '4px' }}>Good Morning, {user.name}!</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>You haven't marked your attendance for today yet. Make sure to clock in before 09:30 AM.</p>
            </div>
            <button 
              onClick={handleMarkAttendance} 
              className="btn-primary" 
              style={{ padding: '16px 36px', fontSize: '1.1rem', fontWeight: 800, borderRadius: '10px', boxShadow: '0 8px 16px rgba(var(--primary-rgb), 0.3)' }}
            >
              <CheckCircle size={20} style={{ marginRight: '10px' }} /> Confirm My Presence
            </button>
          </div>
        )}

        {/* SECTION 3: DETAIL GRID (Two Columns) */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem' }}>
          
          {/* LEFT COLUMN: ACTIVITY FEED */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* MAIN ATTENDANCE TABLE */}
            <div className="jira-card" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '2rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Verified Attendance Log</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {(isAlreadyMarked || isOnLeaveToday) && (
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', 
                        background: isOnLeaveToday ? 'rgba(255, 171, 0, 0.1)' : 'rgba(54, 179, 126, 0.1)', 
                        color: isOnLeaveToday ? 'var(--warning)' : 'var(--success)',
                        padding: '8px 16px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 800
                      }}>
                        {isOnLeaveToday ? <Clock size={16} /> : <CheckCircle size={16} />}
                        {isOnLeaveToday ? 'ON LEAVE' : 'MARKED FOR TODAY'}
                      </div>
                  )}
                  <Search size={18} style={{ color: 'var(--text-muted)', marginLeft: '1rem' }} />
                </div>
              </div>
              <div className="jira-table-container">
                <table className="jira-table">
                  <thead>
                    <tr>
                      <th>Date / Timestamp</th>
                      <th>Status</th>
                      <th>Log Identifier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No attendance records found securely.</td></tr>
                    ) : (
                      attendance.map(record => (
                        <tr key={record._id}>
                          <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>{record.date}</td>
                          <td>
                            <span style={{ 
                              padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900,
                              background: record.status === 'Present' ? 'rgba(54, 179, 126, 0.1)' : 'rgba(255, 86, 48, 0.1)',
                              color: record.status === 'Present' ? 'var(--success)' : 'var(--danger)'
                            }}>
                              {record.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{record.checkInTime || 'AUTO-SYSTEM-CLK'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="jira-card" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '2rem', borderBottom: '1px solid var(--card-border)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Leave Request History</h3>
              </div>
              <div className="jira-table-container">
                <table className="jira-table">
                  <thead>
                    <tr>
                      <th>Duration</th>
                      <th>Type</th>
                      <th style={{ width: '120px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLeaves.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No leave records on file.</td></tr>
                    ) : (
                      myLeaves.map(leave => (
                        <tr key={leave._id}>
                          <td style={{ fontWeight: 700, fontSize: '0.9rem' }}>{leave.startDate} to {leave.endDate}</td>
                          <td><span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{leave.leaveType.toUpperCase()}</span></td>
                          <td>
                            <span style={{ 
                              padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900,
                              background: leave.status === 'Approved' ? 'rgba(54, 179, 126, 0.1)' : leave.status === 'Rejected' ? 'rgba(255, 86, 48, 0.1)' : 'rgba(255, 171, 0, 0.1)',
                              color: leave.status === 'Approved' ? 'var(--success)' : leave.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)'
                            }}>
                              {leave.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: POLICY & QUICK ACCESS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* ACTION: APPLY FOR LEAVE */}
            <div className="jira-card" style={{ padding: '2rem', background: 'var(--primary)', color: 'white', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
              <Calendar size={64} style={{ position: 'absolute', right: '-15px', bottom: '-15px', color: 'rgba(255,255,255,0.1)' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>Plan an Absence</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: '1.6', marginBottom: '2rem' }}>
                Ensure business continuity by filing your leave requests in advance for HR confirmation.
              </p>
              <button 
                onClick={() => setShowLeaveModal(true)} 
                className="btn-primary" 
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'white', color: 'var(--primary)', fontWeight: 900, fontSize: '1rem' }}
              >
                Submit Leave Request
              </button>
            </div>

            {/* POLICY: ATTENDANCE GUIDELINES */}
            <div className="jira-card" style={{ padding: '2rem', borderRadius: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', color: 'var(--warning)' }}>
                <AlertCircle size={24} />
                <h3 style={{ fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Operations Policy</h3>
              </div>
              <div style={{ fontSize: '0.9rem', lineHeight: '1.8', color: 'var(--text-color)', display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 900 }}>•</span>
                  <span>Morning check-in required before <strong>09:30 AM</strong> to prevent auto-absence.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 900 }}>•</span>
                  <span>Security compliance requires <strong>8 hours</strong> of verified activity per shift.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 900 }}>•</span>
                  <span>Formal leave notifications must be processed <strong>48 hours</strong> prior to effective date.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LEAVE REQUEST MODAL (Outside animation to fix position:fixed centering) */}
      {showLeaveModal && (
        <div className="modal-overlay" style={{ pointerEvents: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', borderRadius: '24px', position: 'relative' }}>
             <button 
                onClick={() => setShowLeaveModal(false)} 
                className="close-hover"
                style={{ 
                  position: 'absolute', top: '1.5rem', right: '1.5rem', 
                  background: 'rgba(0,0,0,0.05)', border: 'none', color: 'var(--text-color)', 
                  cursor: 'pointer', padding: '8px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s'
                }}>
               <X size={20} />
             </button>
             <h2 className="fic-gradient-text" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Apply for Leave</h2>
             <form onSubmit={handleApplyLeave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                   <div>
                      <label style={{ fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem' }}>Start Date</label>
                      <input 
                        type="date" 
                        required
                        value={leaveForm.startDate}
                        onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          borderRadius: '10px', 
                          border: '2px solid var(--card-border)', 
                          background: 'var(--bg-color)', 
                          color: 'var(--text-color)', 
                          marginTop: '8px',
                          outline: 'none',
                          fontSize: '0.95rem'
                        }}
                      />
                   </div>
                   <div>
                      <label style={{ fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem' }}>End Date</label>
                      <input 
                        type="date" 
                        required
                        value={leaveForm.endDate}
                        onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          borderRadius: '10px', 
                          border: '2px solid var(--card-border)', 
                          background: 'var(--bg-color)', 
                          color: 'var(--text-color)', 
                          marginTop: '8px',
                          outline: 'none',
                          fontSize: '0.95rem'
                        }}
                      />
                   </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                   <label style={{ fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem' }}>Leave Type</label>
                   <select 
                     value={leaveForm.leaveType}
                     onChange={e => setLeaveForm({...leaveForm, leaveType: e.target.value})}
                     style={{ 
                       width: '100%', 
                       padding: '12px', 
                       borderRadius: '10px', 
                       border: '2px solid var(--card-border)', 
                       background: 'var(--bg-color)', 
                       color: 'var(--text-color)', 
                       marginTop: '8px',
                       outline: 'none',
                       fontSize: '0.95rem'
                     }}
                   >
                      <option value="Casual">Casual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Earned">Earned Leave</option>
                      <option value="Other">Other</option>
                   </select>
                </div>
                <div style={{ marginBottom: '2rem' }}>
                   <label style={{ fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem' }}>Reason for Leave</label>
                   <textarea 
                     required
                     rows="3"
                     value={leaveForm.reason}
                     onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
                     style={{ 
                       width: '100%', 
                       padding: '12px', 
                       borderRadius: '10px', 
                       border: '2px solid var(--card-border)', 
                       background: 'var(--bg-color)', 
                       color: 'var(--text-color)', 
                       marginTop: '8px', 
                       outline: 'none',
                       fontSize: '0.95rem',
                       resize: 'none' 
                     }}
                   />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowLeaveModal(false)} 
                    className="btn-secondary" 
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                     <Send size={18} /> Submit Leave Request
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeAttendance;
