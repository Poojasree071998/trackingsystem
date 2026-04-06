import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, XCircle, Clock, User, FileText, Send, Shield } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const LOPManager = () => {
  const { user } = useContext(AuthContext);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [lopRecords, setLopRecords] = useState([]);
  const [activeView, setActiveView] = useState('overdue'); // 'overdue' | 'history'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overdueRes, lopRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/lop/overdue-tasks`),
        axios.get(`${API_BASE_URL}/api/lop`)
      ]);
      setOverdueTasks(overdueRes.data);
      setLopRecords(lopRes.data);
    } catch (err) {
      console.error('Failed to fetch LOP data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleWarning = async (taskId, warningType) => {
    setActionLoading(`${taskId}-${warningType}`);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/lop/warning`, {
        taskId,
        senderId: user.id,
        warningType
      });
      showToast(res.data.message);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send warning', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApplyLOP = async (taskId) => {
    if (!window.confirm('Apply LOP for this employee? This will notify them and mark the task as Overdue.')) return;
    setActionLoading(`${taskId}-apply`);
    try {
      await axios.post(`${API_BASE_URL}/api/lop/apply`, {
        taskId,
        senderId: user.id,
        reason: 'Task not completed within deadline. No proper update provided.'
      });
      showToast('LOP Applied. Employee has been notified.');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to apply LOP', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWaiveLOP = async (lopId) => {
    if (!window.confirm('Waive this LOP record? The employee will be notified.')) return;
    setActionLoading(`${lopId}-waive`);
    try {
      await axios.put(`${API_BASE_URL}/api/lop/${lopId}/waive`, { senderId: user.id });
      showToast('LOP Waived. Employee has been notified.');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to waive LOP', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDeadline = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((now - d) / (1000 * 60 * 60 * 24));
    return {
      formatted: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      overdueDays: diffDays
    };
  };

  const getWarningBadge = (task) => {
    const lop = task.lopRecord;
    if (!lop) return null;
    if (lop.lopStatus === 'Applied') return <span style={{ background: 'rgba(255,86,48,0.15)', color: '#FF5630', padding: '3px 10px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>LOP APPLIED</span>;
    if (lop.lopStatus === 'Waived') return <span style={{ background: 'rgba(54,179,126,0.15)', color: '#36b37e', padding: '3px 10px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>WAIVED</span>;
    if (lop.warningsSent === 2) return <span style={{ background: 'rgba(255,196,0,0.15)', color: '#FF8B00', padding: '3px 10px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>FINAL WARNING SENT</span>;
    if (lop.warningsSent === 1) return <span style={{ background: 'rgba(var(--primary-rgb),0.1)', color: 'var(--primary)', padding: '3px 10px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>1ST WARNING SENT</span>;
    return null;
  };

  return (
    <div className="fade-in-up">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: toast.type === 'error' ? '#FF5630' : '#36b37e',
          color: 'white', padding: '12px 20px', borderRadius: '8px',
          fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>LOP Management</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
          Monitor overdue tasks and manage Loss of Pay actions
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { label: 'OVERDUE TASKS', value: overdueTasks.length, icon: <Clock size={20} />, color: '#FF8B00', bg: 'rgba(255,139,0,0.1)' },
          { label: 'LOP APPLIED', value: lopRecords.filter(l => l.lopStatus === 'Applied').length, icon: <XCircle size={20} />, color: '#FF5630', bg: 'rgba(255,86,48,0.1)' },
          { label: 'WARNINGS SENT', value: lopRecords.filter(l => l.lopStatus === 'Pending').length, icon: <AlertTriangle size={20} />, color: '#FFAB00', bg: 'rgba(255,171,0,0.1)' },
          { label: 'WAIVED', value: lopRecords.filter(l => l.lopStatus === 'Waived').length, icon: <CheckCircle size={20} />, color: '#36b37e', bg: 'rgba(54,179,126,0.1)' }
        ].map(card => (
          <div key={card.label} className="jira-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, background: card.bg, color: card.color, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '2px' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Toggle */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
        {[['overdue', 'Overdue Tasks'], ['history', 'LOP History']].map(([key, label]) => (
          <span key={key} onClick={() => setActiveView(key)} style={{
            cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
            color: activeView === key ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeView === key ? '3px solid var(--primary)' : 'none',
            paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {label}
          </span>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
      ) : activeView === 'overdue' ? (
        /* OVERDUE TASKS TABLE */
        overdueTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ fontWeight: 700 }}>All tasks are on track! No overdue tasks.</p>
          </div>
        ) : (
          <div className="jira-table-container">
            <table className="jira-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Task</th>
                  <th>Deadline</th>
                  <th>Days Overdue</th>
                  <th>Status</th>
                  <th>Warning</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {overdueTasks.map(task => {
                  const { formatted, overdueDays } = formatDeadline(task.deadline);
                  const lopRecord = task.lopRecord;
                  const isApplied = lopRecord?.lopStatus === 'Applied';
                  const warningsSent = lopRecord?.warningsSent || 0;

                  return (
                    <tr key={task._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                            {task.assignedToEmployee?.name?.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{task.assignedToEmployee?.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{task.assignedToEmployee?.department || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{task.taskTitle}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.project?.projectKey || 'FIC'}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#FF5630' }}>{formatted}</td>
                      <td>
                        <span style={{ background: 'rgba(255,86,48,0.12)', color: '#FF5630', padding: '3px 10px', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem' }}>
                          {overdueDays}d
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: task.status === 'Completed' ? 'rgba(54,179,126,0.1)' : 'rgba(255,86,48,0.1)',
                          color: task.status === 'Completed' ? '#36b37e' : '#FF5630',
                          padding: '3px 10px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800
                        }}>
                          {task.status.toUpperCase()}
                        </span>
                      </td>
                      <td>{getWarningBadge(task)}</td>
                      <td>
                        {isApplied ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>LOP Applied</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {warningsSent < 1 && (
                              <button
                                onClick={() => handleWarning(task._id, 'first')}
                                disabled={actionLoading === `${task._id}-first`}
                                style={{
                                  background: 'rgba(var(--primary-rgb),0.1)', color: 'var(--primary)',
                                  border: '1px solid var(--primary)', borderRadius: '6px',
                                  padding: '5px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                <Send size={12} /> Warn 1
                              </button>
                            )}
                            {warningsSent >= 1 && warningsSent < 2 && (
                              <button
                                onClick={() => handleWarning(task._id, 'final')}
                                disabled={actionLoading === `${task._id}-final`}
                                style={{
                                  background: 'rgba(255,171,0,0.1)', color: '#FF8B00',
                                  border: '1px solid #FF8B00', borderRadius: '6px',
                                  padding: '5px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                <AlertTriangle size={12} /> Final Warn
                              </button>
                            )}
                            {warningsSent >= 2 && (
                              <button
                                onClick={() => handleApplyLOP(task._id)}
                                disabled={actionLoading === `${task._id}-apply`}
                                style={{
                                  background: '#FF5630', color: 'white',
                                  border: 'none', borderRadius: '6px',
                                  padding: '5px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                <Shield size={12} /> Apply LOP
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* LOP HISTORY TABLE */
        lopRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ fontWeight: 700 }}>No LOP records found.</p>
          </div>
        ) : (
          <div className="jira-table-container">
            <table className="jira-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Task</th>
                  <th>Reason</th>
                  <th>Days Delayed</th>
                  <th>Status</th>
                  <th>Date Applied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lopRecords.map(record => (
                  <tr key={record._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                          {record.employeeId?.name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{record.employeeId?.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{record.employeeId?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{record.taskId?.taskTitle || 'N/A'}</td>
                    <td>
                      <div style={{ maxWidth: '200px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {record.reason}
                      </div>
                    </td>
                    <td>
                      <span style={{ background: 'rgba(255,86,48,0.12)', color: '#FF5630', padding: '3px 10px', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem' }}>
                        {record.delayDays}d
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800,
                        background: record.lopStatus === 'Applied' ? 'rgba(255,86,48,0.12)' : record.lopStatus === 'Waived' ? 'rgba(54,179,126,0.12)' : 'rgba(255,171,0,0.12)',
                        color: record.lopStatus === 'Applied' ? '#FF5630' : record.lopStatus === 'Waived' ? '#36b37e' : '#FF8B00'
                      }}>
                        {record.lopStatus.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(record.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      {record.lopStatus === 'Applied' ? (
                        <button
                          onClick={() => handleWaiveLOP(record._id)}
                          disabled={actionLoading === `${record._id}-waive`}
                          style={{
                            background: 'rgba(54,179,126,0.1)', color: '#36b37e',
                            border: '1px solid #36b37e', borderRadius: '6px',
                            padding: '5px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <CheckCircle size={12} /> Waive
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default LOPManager;
