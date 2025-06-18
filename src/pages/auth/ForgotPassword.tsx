import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './SignIn.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <Palette size={32} />
              <span>CreativePort</span>
            </Link>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'var(--success-100)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--success-700)'
              }}>
                <Mail size={32} />
              </div>
            </div>
            
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">
              We've sent a password reset link to {email}
            </p>
          </div>

          <div className="auth-footer">
            <p>
              Didn't receive the email? <button 
                onClick={() => setSent(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-600)',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Try again
              </button>
            </p>
            
            <Link to="/auth/signin" className="back-to-home">
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <Palette size={32} />
            <span>CreativePort</span>
          </Link>
          
          <h1 className="auth-title">Forgot your password?</h1>
          <p className="auth-subtitle">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="form-input"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remember your password? <Link to="/auth/signin">Sign in</Link>
          </p>
          
          <Link to="/" className="back-to-home">
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;