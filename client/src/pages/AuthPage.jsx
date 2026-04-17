import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="sky-bg">
        <div className="sky-bg__aurora" />
      </div>

      {/* Passing blurred clouds */}
      <div className="clouds-bg">
        <div className="blur-cloud blur-cloud--1"></div>
        <div className="blur-cloud blur-cloud--2"></div>
        <div className="blur-cloud blur-cloud--3"></div>
        <div className="blur-cloud blur-cloud--4"></div>
        <div className="blur-cloud blur-cloud--5"></div>
      </div>

      {/* Stars */}
      <div className="stars">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '--duration': `${2 + Math.random() * 4}s`,
              '--delay': `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="auth-card glass">
        <div className="auth-card__logo">
          <div className="auth-card__icon-container">
            <div className="cloud-3d">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`cloud-layer cloud-layer--${i + 1}`} viewBox="0 0 100 100" width="60" height="60" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id={`cloudGrad${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#b8dbff" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M75,60 C85,60 90,52 90,44 C90,36 84,30 76,30 C74,20 65,15 55,15 C45,15 37,22 34,30 C24,30 15,36 15,46 C15,56 24,60 33,60 L75,60 Z" 
                    fill={`url(#cloudGrad${i})`} 
                  />
                </svg>
              ))}
            </div>
          </div>
          <h1 className="auth-card__title">SkyChat</h1>
          <p className="auth-card__subtitle">Connect through the clouds</p>
        </div>

        {/* Toggle */}
        <div className="auth-toggle">
          <button
            className={`auth-toggle__btn ${mode === 'login' ? 'auth-toggle__btn--active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Login
          </button>
          <button
            className={`auth-toggle__btn ${mode === 'register' ? 'auth-toggle__btn--active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__group">
            <label htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          {mode === 'register' && (
            <div className="auth-form__group">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          )}

          <div className="auth-form__group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className="auth-form__error">{error}</div>}

          <button
            type="submit"
            className="auth-form__submit"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" />
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="auth-card__footer">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className="auth-card__link"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
