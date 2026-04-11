// ─── Backend URL Configuration ────────────────────────────────────────────────
// LOCAL:      Express runs on port 5001
// PRODUCTION: Express is hosted on Render → set VITE_API_BASE_URL in Vercel env vars
//             OR update RENDER_BACKEND_URL below with your actual Render URL.
// ──────────────────────────────────────────────────────────────────────────────
const RENDER_BACKEND_URL = 'https://trackingsystem-3mdl.onrender.com';

const isLocal = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.startsWith('172.');

// DEFINITIVE FIX: Unconditionally use Render URL in production
export const API_BASE_URL = isLocal 
  ? `http://${window.location.hostname}:5001` 
  : RENDER_BACKEND_URL;

export const UPLOADS_BASE_URL = `${API_BASE_URL}/uploads`;

console.log('📡 FIC API Strategy:', isLocal ? 'LOCAL' : 'PRODUCTION (DIRECT)');
console.log('🔗 Target Base URL:', API_BASE_URL);
console.log('📦 DEPLOY VERSION:', '1.3.1-DEFINITIVE');
window.APP_VERSION = '1.3.1-DEFINITIVE';

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
  isLocal ? `http://${window.location.hostname}:5001` : RENDER_BACKEND_URL
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
