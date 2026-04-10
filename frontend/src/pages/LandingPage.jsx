import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_ENDPOINTS } from '../apiConfig';
import { Slack, Github, Figma, Framer, Trello, Gitlab, CheckCircle, Info, Loader2, Mail, Lock, User as UserIcon, X, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeFaq, setActiveFaq] = useState(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalTab, setModalTab] = useState('login'); // 'login' or 'signup'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '', role: 'employee' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', role: 'employee', designation: '', department: '' });
  const [demoForm, setDemoForm] = useState({ name: '', email: '', company: '', size: '1-10' });
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [systemStatus, setSystemStatus] = useState({ backend: 'checking', database: 'checking' });

  // Poll for system health
  useEffect(() => {
    let interval;
    if (showAuthModal) {
      const checkHealth = async () => {
        try {
        const res = await axios.get(API_ENDPOINTS.HEALTH);
          setSystemStatus({ 
            backend: 'online', 
            database: res.data.dbReady ? 'connected' : 'disconnected' 
          });
        } catch (err) {
          setSystemStatus({ backend: 'offline', database: 'unknown' });
        }
      };
      
      checkHealth();
      interval = setInterval(checkHealth, 10000); // Check every 10s
    }
    return () => clearInterval(interval);
  }, [showAuthModal]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await axios.post(API_ENDPOINTS.LOGIN, loginForm);
      
      // Ensure we have a valid user object before proceeding
      if (res.data && res.data.user && res.data.token) {
        login(res.data.token, res.data.user);
        setIsLoading(false);
        setShowSuccess(true);
        setTimeout(() => {
          setShowAuthModal(false);
          setShowSuccess(false);
          navigate(`/${res.data.user.role}-dashboard`);
        }, 1500);
      } else {
        throw new Error('Invalid server response structure');
      }
    } catch (err) {
      setIsLoading(false);
      const isLocal = window.location.hostname === 'localhost';
      const apiUrl = API_ENDPOINTS.LOGIN.replace('/api/auth/login', '');
      
      if (err.response) {
        // The server responded with a status code that falls out of the range of 2xx
        setError(err.response.data.message || 'Authentication failed. Please verify your credentials and try again.');
      } else if (err.request) {
        // The request was made but no response was received
        setError(`Server unreachable at ${apiUrl}. Please ensure the backend service is active. ${isLocal ? '(Run npm start on port 5001)' : ''}`);
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('Request setup failed. Please check your connection.');
      }
      // Explicitly reset success state to ensure no accidental redirect
      setShowSuccess(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Direct signup to /api/users (using current backend logic)
      const res = await axios.post(API_ENDPOINTS.USERS, signupForm);
      setIsLoading(false);
      setModalTab('login');
      setError('Registration successful! Please log in with your new account.');
    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    }
  };

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    setDemoSubmitted(true);
    setTimeout(() => {
      setShowDemoModal(false);
      setDemoSubmitted(false);
      setDemoForm({ name: '', email: '', company: '', size: '1-10' });
    }, 2000);
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="bg-mesh" style={{ minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Premium Navbar */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.2rem 10%', 
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        zIndex: 1000,
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontWeight: '900',
            fontSize: '1.4rem',
            boxShadow: '0 8px 16px rgba(0, 82, 204, 0.2)'
          }}>F</div>
          <h1 className="text-gradient" style={{ fontWeight: '800', fontSize: '1.8rem', letterSpacing: '-1px' }}>FORGE INDIA CONNECT</h1>
        </div>
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
          <a href="#features" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.95rem' }}>Features</a>
          <a href="#pricing" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.95rem' }}>Pricing</a>
          <button 
             onClick={() => { setModalTab('login'); setShowAuthModal(true); }}
             style={{ 
               background: 'none', border: 'none', 
               color: 'rgba(23, 43, 77, 0.4)', // Dimmed color as requested
               fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer',
               padding: 0
             }}
          >
             Sign In
          </button>
          <button 
             className="btn-primary"
             onClick={() => { setModalTab('signup'); setShowAuthModal(true); }}
          >
             Start Free Trial
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        padding: '6rem 10% 4rem 10%', 
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="fade-in-up">
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            backgroundColor: 'rgba(0, 82, 204, 0.08)', 
            color: 'var(--primary)', 
            padding: '8px 20px', 
            borderRadius: '100px', 
            fontSize: '0.9rem', 
            fontWeight: '700', 
            marginBottom: '2rem'
          }}>
            <span style={{ fontSize: '1.2rem' }}>✨</span> New: Automated LOP Tracking Integration
          </div>
          <h2 className="text-gradient" style={{ 
            fontSize: '5rem', 
            fontWeight: '900', 
            marginBottom: '1.5rem', 
            lineHeight: '1.05',
            maxWidth: '1000px',
            margin: '0 auto 2rem auto'
          }}>
            Project tracking, <br /> reimagined for elite teams.
          </h2>
          <p className="text-subtle" style={{ 
            maxWidth: '800px', 
            margin: '0 auto 3.5rem auto',
          }}>
            The all-in-one workspace for high-velocity teams to assign tasks, track real-time progress, and automate performance reporting with surgical precision.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '6rem' }}>
            <button 
               className="btn-primary" 
               style={{ padding: '18px 48px', fontSize: '1.1rem' }}
               onClick={() => { setModalTab('signup'); setShowAuthModal(true); }}
            >
               Start Free Trial
            </button>
            <button className="btn-secondary" style={{ padding: '18px 48px', fontSize: '1.1rem' }} onClick={() => setShowDemoModal(true)}>Book a Demo</button>
          </div>
        </div>

        {/* Hero Mockup */}
        <div className="fade-in-up float" style={{ 
          maxWidth: '1300px', 
          margin: '0 auto', 
          perspective: '2000px',
          padding: '0 20px'
        }}>
          <img 
            src="/assets/hero_dashboard.png" 
            alt="FORGE INDIA CONNECT Premium Dashboard" 
            style={{ 
              width: '100%', 
              borderRadius: '24px', 
              boxShadow: '0 50px 100px -20px rgba(9, 30, 66, 0.25), 0 30px 60px -30px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.7)',
              background: 'white'
            }}
          />
        </div>
      </section>

      {/* Trust Section */}
      <section style={{ padding: '8rem 10%', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4rem', fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Trusted by innovative teams worldwide</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6rem', opacity: '0.6', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-color)', fontWeight: 800, fontSize: '1.5rem', fontStyle: 'italic', letterSpacing: '-1px' }}>
            <Slack size={32} /> Slack
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-color)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-1px' }}>
            <Github size={32} /> GitHub
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-color)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-1px' }}>
            <Figma size={32} /> Figma
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-color)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-1px' }}>
            <Framer size={32} /> Framer
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-color)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-1px' }}>
            <Trello size={32} /> Trello
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section id="features" style={{ padding: '10rem 10%', background: '#fafbfc' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8rem', alignItems: 'center', marginBottom: '12rem' }}>
          <div className="fade-in-up">
            <h3 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '2rem', lineHeight: '1.1' }}>Collaborate without the friction.</h3>
            <p style={{ fontSize: '1.3rem', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '2.5rem' }}>
              Bring everyone onto the same page. From HR assignments to Developer execution, FORGE INDIA CONNECT provides the metabolic visibility you need to eliminate bottlenecks.
            </p>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {[
                { title: 'Real-time updates', desc: 'Sync state across all dashboards instantly.' },
                { title: 'Interactive Kanban', desc: 'Drag-and-drop workflow with deep customization.' },
                { title: 'Role-based Access', desc: 'Granular permissions for Admin, HR, and Devs.' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>✓</div>
                  <div>
                    <h5 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '4px' }}>{item.title}</h5>
                    <p style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="fade-in-up premium-card" style={{ padding: '0', overflow: 'hidden', border: 'none', background: 'transparent' }}>
            <img 
              src="/assets/collaboration_mockup.png" 
              alt="Team Collaboration" 
              style={{ width: '100%', borderRadius: '20px', boxShadow: '0 30px 60px rgba(0,0,0,0.1)' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8rem', alignItems: 'center' }}>
          <div className="fade-in-up premium-card" style={{ padding: '0', overflow: 'hidden', border: 'none', background: 'transparent', order: 2 }}>
            {/* Using hero_dashboard again for variety or you could generate another */}
            <img 
              src="/assets/hero_dashboard.png" 
              alt="Analytics Dashboard" 
              style={{ width: '100%', borderRadius: '20px', boxShadow: '0 30px 60px rgba(0,0,0,0.1)' }}
            />
          </div>
          <div className="fade-in-up" style={{ order: 1 }}>
            <h3 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '2rem', lineHeight: '1.1' }}>Data-driven oversight.</h3>
            <p style={{ fontSize: '1.3rem', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '3rem' }}>
              Don't just track tasks; track performance. Our automated analytics engine generates LOP reports and productivity insights with a single click.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ padding: '2.5rem', borderTop: '4px solid var(--secondary)', background: 'white', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }}>
                <h5 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>99.9%</h5>
                <p style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Accuracy in reporting</p>
              </div>
              <div style={{ padding: '2.5rem', borderTop: '4px solid var(--primary)', background: 'white', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }}>
                <h5 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>2.5x</h5>
                <p style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Velocity increase</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '10rem 10%', textAlign: 'center' }}>
        <h3 className="text-gradient" style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Plans built for every team.</h3>
        <p className="text-subtle" style={{ marginBottom: '5rem' }}>Start small, scale to enterprise. No hidden fees.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="pricing-card">
            <h4 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Starter</h4>
            <div style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem' }}>$0<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span></div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>For individuals and small side projects.</p>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '3rem', display: 'grid', gap: '1rem' }}>
              <li>✓ Up to 3 users</li>
              <li>✓ Basic Kanban boards</li>
              <li>✓ Email support</li>
              <li>✓ 1GB Storage</li>
            </ul>
            <button className="btn-secondary" style={{ width: '100%' }}>Choose Starter</button>
          </div>

          <div className="pricing-card featured">
            <div className="pricing-badge">MOST POPULAR</div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Professional</h4>
            <div style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem' }}>$19<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span></div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Complete toolkit for growing teams.</p>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '3rem', display: 'grid', gap: '1rem' }}>
              <li>✓ Unlimited users</li>
              <li>✓ Advanced Analytics</li>
              <li>✓ Automated LOP Tracking</li>
              <li>✓ Priority Support</li>
              <li>✓ 100GB Storage</li>
            </ul>
            <button className="btn-primary" style={{ width: '100%' }}>Get Professional</button>
          </div>

          <div className="pricing-card">
            <h4 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Enterprise</h4>
            <div style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem' }}>Custom</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Advanced security and dedicated support.</p>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '3rem', display: 'grid', gap: '1rem' }}>
              <li>✓ Everything in Pro</li>
              <li>✓ Custom Integrations</li>
              <li>✓ Dedicated Manager</li>
              <li>✓ 99.9% SLA</li>
              <li>✓ Unlimited Storage</li>
            </ul>
            <button className="btn-secondary" style={{ width: '100%' }}>Contact Sales</button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '10rem 10%', background: '#fafbfc' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '4rem', textAlign: 'center' }}>Frequently Asked Questions</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {[
              { q: 'How does the LOP tracking work?', a: 'FORGE INDIA CONNECT automatically calculates Loss of Pay based on task completion deadlines and attendance logs synced from your HR portal.' },
              { q: 'Can I import data from Jira?', a: 'Yes! We support a one-click migration from Jira, Trello, and Asana to get you started immediately.' },
              { q: 'Is my data secure?', a: 'We use enterprise-grade AES-256 encryption for all data at rest and TLS 1.3 for data in transit.' },
              { q: 'Do you offer a free trial?', a: 'Yes, we offer a 14-day full-featured trial for our Professional plan with no credit card required.' }
            ].map((faq, i) => (
              <div key={i} className={`faq-item ${activeFaq === i ? 'active' : ''}`} onClick={() => toggleFaq(i)}>
                <div className="faq-question">
                  {faq.q}
                  <span className="faq-icon">▼</span>
                </div>
                <div className="faq-answer">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '10rem 10%', textAlign: 'center' }}>
        <div className="premium-card" style={{ 
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', 
          color: 'white', 
          padding: '8rem 4rem',
          borderRadius: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ fontSize: '4.5rem', fontWeight: '900', marginBottom: '2rem', lineHeight: '1' }}>Ready to ship faster?</h3>
            <p style={{ fontSize: '1.5rem', marginBottom: '4rem', opacity: '0.9', maxWidth: '700px', margin: '0 auto 4rem auto' }}>
              Join 10,000+ high-performance teams who have already streamlined their workflow with FORGE INDIA CONNECT.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
              <button 
                 onClick={() => { setModalTab('signup'); setShowAuthModal(true); }}
                 style={{ backgroundColor: 'white', color: 'var(--primary)', border: 'none', padding: '20px 50px', borderRadius: '12px', fontWeight: '800', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
              >
                 Start Free Trial Now
              </button>
            </div>
          </div>
          {/* Decorative elements */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(60px)' }}></div>
          <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,184,217,0.1)', filter: 'blur(60px)' }}></div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer style={{ padding: '8rem 10% 4rem 10%', borderTop: '1px solid var(--card-border)', backgroundColor: 'white' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '6rem', marginBottom: '6rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
              <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px' }}></div>
              <h4 style={{ fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.5px' }}>FORGE INDIA CONNECT</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.1rem', maxWidth: '350px' }}>
              The modern workspace for high-performing teams to track, collaborate, and win.
            </p>
          </div>
          <div>
            <h5 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '2rem' }}>Product</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              <span>Features</span>
              <span>Integrations</span>
              <span>Enterprise</span>
              <span>Solutions</span>
            </div>
          </div>
          <div>
            <h5 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '2rem' }}>Resources</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              <span>Documentation</span>
              <span>API Reference</span>
              <span>Blog</span>
              <span>Community</span>
            </div>
          </div>
          <div>
            <h5 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '2rem' }}>Company</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              <span>About Us</span>
              <span>Careers</span>
              <span>Privacy Policy</span>
              <span>Terms</span>
            </div>
          </div>
        </div>
        <div style={{ pt: '4rem', borderTop: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '3rem' }}>
          <span>© 2026 FORGE INDIA CONNECT Inc. Built for winners.</span>
          <div style={{ display: 'flex', gap: '3rem' }}>
            <span>Twitter</span>
            <span>LinkedIn</span>
            <span>GitHub</span>
          </div>
        </div>
      </footer>

      {/* Demo Modal Overlay */}
      {showDemoModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)'
        }} onClick={() => setShowDemoModal(false)}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            {demoSubmitted ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e3fcef', color: '#006644', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#172b4d' }}>Request Received</h3>
                <p style={{ color: '#5e6c84', fontSize: '1rem', lineHeight: 1.5 }}>Thank you! One of our product specialists will reach out to schedule your personalized demo shortly.</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #dfe1e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#172b4d', margin: 0 }}>Book a personalized demo</h3>
                  <button onClick={() => setShowDemoModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#5e6c84' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                <div style={{ padding: '32px' }}>
                  <p style={{ color: '#5e6c84', marginBottom: '24px', fontSize: '1rem' }}>See how FORGE INDIA CONNECT can transform your team's tracking workflow.</p>
                  <form onSubmit={handleDemoSubmit} style={{ display: 'grid', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#172b4d', fontSize: '0.9rem' }}>Work Email <span style={{color: 'red'}}>*</span></label>
                      <input type="email" required placeholder="name@company.com" value={demoForm.email} onChange={e => setDemoForm({...demoForm, email: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '4px', border: '2px solid #dfe1e6', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s', ':focus': { borderColor: '#0052cc' } }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#172b4d', fontSize: '0.9rem' }}>First Name <span style={{color: 'red'}}>*</span></label>
                        <input type="text" required placeholder="John" value={demoForm.name} onChange={e => setDemoForm({...demoForm, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '4px', border: '2px solid #dfe1e6', outline: 'none', fontSize: '1rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#172b4d', fontSize: '0.9rem' }}>Company Name <span style={{color: 'red'}}>*</span></label>
                        <input type="text" required placeholder="Acme Corp" value={demoForm.company} onChange={e => setDemoForm({...demoForm, company: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '4px', border: '2px solid #dfe1e6', outline: 'none', fontSize: '1rem' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#172b4d', fontSize: '0.9rem' }}>Company Size</label>
                      <select value={demoForm.size} onChange={e => setDemoForm({...demoForm, size: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '4px', border: '2px solid #dfe1e6', outline: 'none', fontSize: '1rem', backgroundColor: 'white' }}>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px', padding: '16px', fontSize: '1.1rem', background: '#0052cc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      Request Demo
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#6b778c', marginTop: '8px' }}>By submitting, you agree to our Terms of Service & Privacy Policy.</p>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)'
        }} onClick={() => setShowAuthModal(false)}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '100%', maxWidth: '480px', 
            boxShadow: '0 40px 100px rgba(0,0,0,0.3)', overflow: 'hidden', position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }} onClick={e => e.stopPropagation()}>
            
            {showSuccess ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center' }} className="fade-in">
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(54, 179, 126, 0.1)', color: '#36B37E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto' }}>
                  <CheckCircle size={48} />
                </div>
                <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Success!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Your session is ready. Redirecting...</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '32px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '28px', height: '28px', background: 'var(--primary)', borderRadius: '6px' }}></div>
                     <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#172B4D' }}>FIC Hub</span>
                  </div>
                  <button onClick={() => setShowAuthModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: '#5e6c84', borderRadius: '50%' }}>
                    <X size={24} />
                  </button>
                </div>


                <div style={{ padding: '32px 40px 48px' }}>
                  <div style={{ display: 'flex', background: '#F4F5F7', padding: '4px', borderRadius: '12px', marginBottom: '2.5rem' }}>
                    <button 
                      onClick={() => { setModalTab('login'); setError(''); }}
                      style={{ 
                        flex: 1, padding: '12px', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                        transition: '0.3s all', background: modalTab === 'login' ? 'white' : 'transparent', color: modalTab === 'login' ? 'var(--primary)' : 'var(--text-muted)',
                        boxShadow: modalTab === 'login' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => { setModalTab('signup'); setError(''); }}
                      style={{ 
                        flex: 1, padding: '12px', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                        transition: '0.3s all', background: modalTab === 'signup' ? 'white' : 'transparent', color: modalTab === 'signup' ? 'var(--primary)' : 'var(--text-muted)',
                        boxShadow: modalTab === 'signup' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      Free Trial
                    </button>
                  </div>

                  {error && (
                    <div style={{ 
                      background: error.includes('successful') ? '#E3FCEF' : '#FFEBE6', 
                      color: error.includes('successful') ? '#006644' : '#BF2600', 
                      padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '20px', 
                      display: 'flex', gap: '10px', alignItems: 'center', border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                      <Info size={18} />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={modalTab === 'login' ? handleLogin : handleSignup} style={{ display: 'grid', gap: '20px' }}>
                    {modalTab === 'signup' && (
                      <div style={{ position: 'relative' }}>
                        <UserIcon size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: '#A5ADBA' }} />
                        <input 
                          type="text" required placeholder="Full Name" 
                          value={signupForm.name} onChange={e => setSignupForm({...signupForm, name: e.target.value})}
                          style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '8px', border: '2px solid #DFE1E6', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s' }} 
                        />
                      </div>
                    )}
                    
                    <div style={{ position: 'relative' }}>
                      <Mail size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: '#A5ADBA' }} />
                      <input 
                        type="email" required placeholder="name@company.com" 
                        value={modalTab === 'login' ? loginForm.email : signupForm.email} 
                        onChange={e => modalTab === 'login' ? setLoginForm({...loginForm, email: e.target.value}) : setSignupForm({...signupForm, email: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '8px', border: '2px solid #DFE1E6', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s' }} 
                      />
                    </div>

                    <div style={{ position: 'relative' }}>
                      <Lock size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: '#A5ADBA' }} />
                      <input 
                        type="password" required placeholder="Password" 
                        value={modalTab === 'login' ? loginForm.password : signupForm.password} 
                        onChange={e => modalTab === 'login' ? setLoginForm({...loginForm, password: e.target.value}) : setSignupForm({...signupForm, password: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '8px', border: '2px solid #DFE1E6', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s' }} 
                      />
                    </div>

                    {modalTab === 'signup' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <select 
                            className="form-input" 
                            required
                            value={signupForm.designation} 
                            onChange={e => setSignupForm({...signupForm, designation: e.target.value})}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '2px solid #DFE1E6', outline: 'none', fontSize: '0.95rem' }}
                          >
                            <option value="">Select Designation</option>
                            <option value="Specialist">Specialist</option>
                            <option value="Associate Analyst">Associate Analyst</option>
                            <option value="Senior Analyst">Senior Analyst</option>
                            <option value="Team Lead">Team Lead</option>
                            <option value="Project Manager">Project Manager</option>
                            <option value="Quality Specialist">Quality Specialist</option>
                            <option value="Central Operations">Central Operations</option>
                          </select>
                         <input 
                            placeholder="Department" 
                            value={signupForm.department} onChange={e => setSignupForm({...signupForm, department: e.target.value})}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '2px solid #DFE1E6', outline: 'none', fontSize: '0.95rem' }} 
                         />
                      </div>
                    )}

                    {modalTab === 'login' && (
                       <select 
                          value={loginForm.role}
                          onChange={e => setLoginForm({...loginForm, role: e.target.value})}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '2px solid #DFE1E6', outline: 'none', fontSize: '1rem', backgroundColor: '#F4F5F7' }}
                       >
                          <option value="employee">Team Member Access</option>
                          <option value="hr">HR Management Access</option>
                          <option value="admin">Administrator Access</option>
                       </select>
                    )}

                    <button 
                      type="submit" 
                      className={isLoading ? "btn-secondary" : "btn-primary"} 
                      disabled={isLoading}
                      style={{ width: '100%', marginTop: '12px', padding: '16px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', border: 'none' }}
                    >
                      {isLoading ? <Loader2 size={20} className="spin-animation" /> : null}
                      {modalTab === 'login' ? (isLoading ? 'Authenticating...' : 'Sign In') : (isLoading ? 'Creating Workspace...' : 'Launch Free Trial')}
                    </button>
                    
                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#6b778c', marginTop: '12px' }}>
                       {modalTab === 'login' ? "Can't access your account? Review credentials." : "By joining, you agree to our automated tracking policy."}
                    </p>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* BUILD SYNC MARKER */}
      <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '10px', color: 'rgba(0,0,0,0.2)', pointerEvents: 'none', zIndex: 9999 }}>
        DEPLOY: 2026-04-10-V10-DUAL-REPO-SYNC-SUCCESS
      </div>
    </div>
  );
};

export default LandingPage;
