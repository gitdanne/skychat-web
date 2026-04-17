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

      {/* Floating clouds */}
      <div className="clouds">
        <div className="cloud cloud--1">☁️</div>
        <div className="cloud cloud--2">☁️</div>
        <div className="cloud cloud--3">⛅</div>
        <div className="cloud cloud--4">☁️</div>
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
          <div className="auth-card__icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stopColor="#3a9fff" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <path d="M24 4C14 4 6 12 6 22c0 4 1.5 7.5 4 10.5L8 42l8-4c2.5 1 5.2 1.5 8 1.5 10 0 18-8 18-18S34 4 24 4z" fill="url(#skyGrad)" opacity="0.9"/>
              <circle cx="16" cy="22" r="2.5" fill="white" opacity="0.9"/>
              <circle cx="24" cy="22" r="2.5" fill="white" opacity="0.9"/>
              <circle cx="32" cy="22" r="2.5" fill="white" opacity="0.9"/>
            </svg>
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
