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
  return 'https://trackingsystem1-black.vercel.app'; 
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  // Foolproof detection: Use origin for any domain OTHER than localhost
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '::1')
    ? getDevUrl('5001')
    : window.location.origin
);
export const UPLOADS_BASE_URL = `${API_BASE_URL}/uploads`;

console.log('📡 FIC API Strategy:', (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '::1') ? 'LOCAL' : 'PRODUCTION');
console.log('🔗 Target Base URL:', API_BASE_URL);
console.log('📦 DEPLOY VERSION:', '1.2.5-STABLE-FINAL');
window.APP_VERSION = '1.2.5-STABLE-FINAL';

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '::1')
    ? getDevUrl('5001')
    : 'https://trackingsystem1-black.vercel.app'
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
