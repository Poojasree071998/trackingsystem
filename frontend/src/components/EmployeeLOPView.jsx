import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const EmployeeLOPView = ({ userId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchLOP = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/lop/employee/${userId}`);
        setRecords(res.data);
      } catch (err) {
        console.error('Failed to fetch LOP records', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLOP();
  }, [userId]);

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading LOP records...</div>;

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>My LOP Status</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
          Loss of Pay records associated with your account
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { label: 'TOTAL INCIDENTS', value: records.length, icon: <FileText size={20} />, color: 'var(--primary)', bg: 'rgba(var(--primary-rgb),0.1)' },
          { label: 'LOP APPLIED', value: records.filter(r => r.lopStatus === 'Applied').length, icon: <XCircle size={20} />, color: '#FF5630', bg: 'rgba(255,86,48,0.1)' },
          { label: 'WAIVED', value: records.filter(r => r.lopStatus === 'Waived').length, icon: <CheckCircle size={20} />, color: '#36b37e', bg: 'rgba(54,179,126,0.1)' },
        ].map(card => (
          <div key={card.label} className="jira-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, background: card.bg, color: card.color, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{card.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {records.length === 0 ? (
        <div className="jira-card" style={{ padding: '4rem', textAlign: 'center' }}>
          <CheckCircle size={48} style={{ color: '#36b37e', opacity: 0.5, marginBottom: '1rem' }} />
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No LOP Records</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You have no Loss of Pay incidents on record. Keep up the good work!</p>
        </div>
      ) : (
        <div className="jira-table-container">
          <table className="jira-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Reason</th>
                <th>Days Delayed</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record._id}>
                  <td style={{ fontWeight: 700 }}>{record.taskId?.taskTitle || 'N/A'}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '250px' }}>{record.reason}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Policy Notice */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,86,48,0.05)', border: '1px solid rgba(255,86,48,0.2)', borderRadius: '8px', borderLeft: '4px solid #FF5630' }}>
        <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem', color: '#FF5630' }}>COMPANY POLICY</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          "Due to incomplete task and lack of update, Loss of Pay (LOP) has been applied as per company policy." Please ensure all assigned tasks are completed before the deadline and status is updated promptly to avoid LOP action.
        </p>
      </div>
    </div>
  );
};

export default EmployeeLOPView;
