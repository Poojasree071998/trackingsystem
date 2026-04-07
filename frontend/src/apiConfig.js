export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5001' : '');
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5001' : '');

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
