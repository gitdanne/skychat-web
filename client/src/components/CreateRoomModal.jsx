import React, { useState } from 'react';
import './Modal.css';

export default function CreateRoomModal({ token, onCreated, onClose }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), password: password || null }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room');

      onCreated(data.room);
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
          <h3>Create Room</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="modal__field">
            <label htmlFor="room-name">Room Name</label>
            <input
              id="room-name"
              type="text"
              placeholder="Enter room name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={30}
              autoFocus
            />
          </div>

          <div className="modal__field">
            <label htmlFor="room-password">Password (optional)</label>
            <input
              id="room-password"
              type="password"
              placeholder="Leave empty for public room"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="modal__error">{error}</div>}

          <div className="modal__actions">
            <button type="button" className="modal__cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal__submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
