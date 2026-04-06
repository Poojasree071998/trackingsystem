import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, CheckCircle, X, ChevronRight, Loader2, Info } from 'lucide-react';
import mascotImg from '../assets/login_success_mascot.png';
import { API_ENDPOINTS } from '../apiConfig';

const SuccessModal = ({ onConfirm, userRole }) => (
  <div className="modal-overlay" style={{ animation: 'fadeIn 0.4s ease' }}>
    <div className="glass-panel fade-in-up" style={{ 
      width: '100%', 
      maxWidth: '440px', 
      padding: '3rem', 
      borderRadius: '24px', 
      textAlign: 'center',
      border: '1px solid var(--card-border)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        width: '80px', 
        height: '80px', 
        background: 'rgba(54, 179, 126, 0.1)', 
        color: '#36B37E', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        margin: '0 auto 1.5rem' 
      }}>
        <CheckCircle size={40} />
      </div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem' }}>Success!</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: '1.5' }}>
        Identity verified as <strong>{userRole.toUpperCase()}</strong>. Initializing your secure workspace session...
      </p>
      <button 
        onClick={onConfirm}
        className="btn-primary"
        style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
      >
        Enter {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
      </button>
    </div>
  </div>
);

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { login, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSwitchAccount = (e) => {
    e.preventDefault();
    logout();
  };

  // Redirect if logged in OR clear if legacy session
  useEffect(() => {
    if (user) {
      if (!user.createdAt) {
        console.warn("Legacy session detected. Clearing storage.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        navigate(`/${user.role}-dashboard`);
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Managed delay for professional "FIC-style" authentication transition
    setTimeout(async () => {
      try {
        const res = await axios.post(API_ENDPOINTS.LOGIN, {
          email, password, role
        });
        
        login(res.data.token, res.data.user);
        setIsLoading(false);
        setShowSuccess(true);
      } catch (err) {
        setIsLoading(false);
        if(err.response) {
           setError(err.response.data.message || 'We couldn\'t find an account matching those credentials.');
        } else {
           setError('Network interruption. Please verify the backend service status.');
        }
      }
    }, 600);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#FFFFFF',
      color: '#172B4D',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Header / Logo */}
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            background: '#0052CC', 
            borderRadius: '4px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '1.5rem',
            boxShadow: '0 4px 10px rgba(0, 82, 204, 0.3)'
          }}>F</div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#172B4D', letterSpacing: '-0.5px' }}>FIC Hub</span>
        </div>
      </div>

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 20px 100px' }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '400px', 
          background: 'white',
          padding: '32px 40px',
          borderRadius: '3px',
          boxShadow: '0 10px 40px rgba(9, 30, 66, 0.08)',
          border: '1px solid #DFE1E6'
        }} className="fade-in-up">
          
          {user ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                You are currently logged in as <strong>{user.name}</strong> ({user.role.toUpperCase()}).
              </p>
              <button 
                onClick={() => navigate(`/${user.role}-dashboard`)}
                className="btn-primary"
                style={{ width: '100%', marginBottom: '12px' }}
              >
                Go to My Dashboard
              </button>
              <a 
                href="#" 
                onClick={handleSwitchAccount}
                style={{ color: '#0052CC', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
              >
                Log out & switch account
              </a>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#42526E', marginBottom: '24px', textAlign: 'center' }}>
                Sign In to continue
              </h1>
          
              {error && (
                <div style={{ 
                  background: '#FFEBE6', 
                  color: '#BF2600', 
                  padding: '12px 16px', 
                  borderRadius: '3px', 
                  fontSize: '0.85rem', 
                  marginBottom: '20px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  border: '1px solid rgba(191, 38, 0, 0.2)'
                }}>
                  <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '20px' }}>
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      borderRadius: '3px', 
                      border: '2px solid #DFE1E6',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#172B4D',
                      background: '#F4F5F7',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="admin">Administrator Access</option>
                    <option value="hr">HR Management Access</option>
                    <option value="employee">Team Member Access</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <input 
                    type="email" 
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      borderRadius: '3px', 
                      border: '2px solid #DFE1E6',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4C9AFF'}
                    onBlur={(e) => e.target.style.borderColor = '#DFE1E6'}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        borderRadius: '3px', 
                        border: '2px solid #DFE1E6',
                        fontSize: '0.95rem',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#4C9AFF'}
                      onBlur={(e) => e.target.style.borderColor = '#DFE1E6'}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ 
                        position: 'absolute', 
                        right: '10px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        border: 'none',
                        background: 'none',
                        color: '#6B778C',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: isLoading ? '#EBECF0' : '#0052CC', 
                    color: isLoading ? '#A5ADBA' : 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: isLoading ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => !isLoading && (e.target.style.background = '#0065FF')}
                  onMouseOut={(e) => !isLoading && (e.target.style.background = '#0052CC')}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="spin-animation" />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </>
          )}


          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.85rem', color: '#6B778C' }}>
            <div style={{ marginBottom: '12px' }}>
              <a href="#" style={{ color: '#0052CC', textDecoration: 'none' }}>Can't log in?</a>
              <span style={{ margin: '0 8px' }}>•</span>
              <a href="#" style={{ color: '#0052CC', textDecoration: 'none' }}>Request Access</a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Links */}
      <footer style={{ padding: '20px', textAlign: 'center' }}>
         <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.75rem', color: '#6B778C', fontWeight: 600 }}>
            <span>Privacy Policy</span>
            <span>User Agreement</span>
         </div>
         <div style={{ marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#A5ADBA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Forge India Connect</span>
         </div>
      </footer>

      {showSuccess && user && (
        <SuccessModal 
          userRole={user.role}
          onConfirm={() => navigate(`/${user.role}-dashboard`)} 
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
};

export default LoginPage;

