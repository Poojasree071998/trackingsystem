const getDevUrl = (port) => {
  const { hostname } = window.location;
  const devHostnames = ['localhost', '127.0.0.1', '::1'];
  if (devHostnames.includes(hostname)) {
    return `http://${hostname}:${port}`;
  }
  // Fallback for other local network IPs
  if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
     return `http://${hostname}:${port}`;
  }
  // Production fallback for Vercel/Render
  return 'https://trackingsystem-3mdl.onrender.com'; 
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  // Explicit production detection for Vercel/Render
  (import.meta.env.PROD || window.location.hostname.includes('vercel.app'))
    ? 'https://trackingsystem-3mdl.onrender.com' 
    : getDevUrl('5001')
);

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
  (import.meta.env.PROD || window.location.hostname.includes('vercel.app'))
    ? 'https://trackingsystem-3mdl.onrender.com' 
    : getDevUrl('5001')
);

if (!API_BASE_URL && window.location.hostname !== 'localhost') {
  console.warn('⚠️  VITE_API_BASE_URL is missing in production. API calls will fail.');
}

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  HEALTH: `${API_BASE_URL}/api/health`,
  TASKS: `${API_BASE_URL}/api/tasks`,
  USERS: `${API_BASE_URL}/api/users`,
  PROJECTS: `${API_BASE_URL}/api/projects`,
  NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
};
