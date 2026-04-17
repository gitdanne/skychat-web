import React, { useState } from 'react';
import './Modal.css';

export default function PasswordModal({ room, token, onSuccess, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/rooms/${room.id}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Wrong password');

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3>🔒 {room.name}</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <p className="modal__desc">This room is password-protected. Enter the password to join.</p>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="modal__field">
            <label htmlFor="join-password">Password</label>
            <input
              id="join-password"
              type="password"
              placeholder="Enter room password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && <div className="modal__error">{error}</div>}

          <div className="modal__actions">
            <button type="button" className="modal__cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal__submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Join Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
