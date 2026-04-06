import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser._id && !parsedUser.id) parsedUser.id = parsedUser._id;
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    const userDataWithId = { ...userData, id: userData._id || userData.id };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userDataWithId));
    setUser(userDataWithId);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
