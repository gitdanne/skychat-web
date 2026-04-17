import React from 'react';
import './Message.css';

export default function Message({ message, isOwn, onDelete }) {
  const { id, username, text, createdAt, deleted, system, userId } = message;

  if (system) {
    return (
      <div className="msg msg--system">
        <span className="msg__system-text">{text}</span>
      </div>
    );
  }

  const time = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`msg ${isOwn ? 'msg--own' : 'msg--other'} ${deleted ? 'msg--deleted' : ''}`}>
      {!isOwn && (
        <div className="msg__avatar">
          {username?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="msg__body">
        <div className="msg__meta">
          {!isOwn && <span className="msg__author">{username}</span>}
          <span className="msg__time">{time}</span>
          {isOwn && !deleted && (
            <button
              className="msg__delete"
              onClick={() => onDelete(id)}
              title="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}
        </div>
        <div className="msg__bubble">
          <p className="msg__text">{text}</p>
        </div>
      </div>
    </div>
  );
}
