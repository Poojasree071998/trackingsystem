import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import NotificationToast from '../components/NotificationToast';
import { SOCKET_URL } from '../apiConfig';


const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [activeNotification, setActiveNotification] = useState(null);

  useEffect(() => {
    if (user) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('✅ Connected to socket server:', SOCKET_URL);
        newSocket.emit('register', user.id);
        console.log('📡 Sent register event for userId:', user.id);
      });

      newSocket.on('newNotification', (notif) => {
        setActiveNotification(notif);
        // Clear after 6 seconds
        setTimeout(() => setActiveNotification(null), 6000);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
      {activeNotification && (
        <NotificationToast 
          notification={activeNotification} 
          onClose={() => setActiveNotification(null)} 
        />
      )}
    </SocketContext.Provider>
  );
};

