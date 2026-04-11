import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("🏁 Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          color: '#333',
          fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 800 }}>Component Deployment Failure</h1>
          <p style={{ maxWidth: '600px', marginBottom: '2rem', color: '#666' }}>
            A critical runtime error occurred in the UI. We've captured the diagnostics below.
          </p>
          
          <div style={{
            width: '100%',
            maxWidth: '800px',
            backgroundColor: '#000',
            color: '#0f0',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'left',
            overflowX: 'auto',
            fontSize: '0.9rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: '#aaa' }}>View Diagnostic Stack</summary>
              <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', color: '#aaa' }}>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          </div>

          <button 
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 32px',
              backgroundColor: '#0052cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,82,204,0.3)'
            }}
          >
            Restart Application Bridge
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
