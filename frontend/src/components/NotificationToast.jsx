import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

const NotificationToast = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 9999,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 184, 217, 0.2)',
          borderRadius: '20px',
          padding: '1.5rem',
          width: '380px',
          boxShadow: '0 20px 50px rgba(0, 184, 217, 0.15)',
          display: 'flex',
          gap: '1.2rem',
          alignItems: 'center'
        }}
      >
        <div style={{
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, #00b8d9 0%, #008da6 100%)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 8px 16px rgba(0, 184, 217, 0.3)',
          flexShrink: 0
        }}>
          <Bell size={24} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00b8d9', textTransform: 'uppercase', letterSpacing: '1px' }}>{notification.type} Alert</span>
            <button 
              onClick={onClose} 
              style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '50%', display: 'flex' }}
            >
              <X size={14}/>
            </button>
          </div>
          <p style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 700, lineHeight: '1.4' }}>{notification.message}</p>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
            Sender: <span style={{ fontWeight: 600, color: '#00b8d9' }}>{notification.sender?.name || 'System'}</span>
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationToast;
