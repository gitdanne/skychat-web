import React, { useRef } from 'react';
import './Message.css';

export default function Message({ message, isOwn, onDelete, onReply, onReplyClick }) {
  const { id, username, text, createdAt, deleted, system, type, fileUrl, replyTo } = message;
  const swipeRef = useRef(null);
  const touchStartX = useRef(0);

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

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!swipeRef.current) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartX.current;
    if (deltaX < 0 && deltaX > -80 && onReply) {
      swipeRef.current.style.transform = `translateX(${deltaX}px)`;
    }
  };

  const handleTouchEnd = (e) => {
    if (!swipeRef.current) return;
    const currentX = e.changedTouches[0].clientX;
    const deltaX = currentX - touchStartX.current;
    
    swipeRef.current.style.transform = 'translateX(0px)';
    
    // Threshold to trigger reply
    if (deltaX < -50 && onReply) {
      onReply(message);
    }
  };

  const renderMedia = () => {
    if (type === 'image' && fileUrl) {
      return <img className="msg__image" src={fileUrl} alt="attachment" onClick={() => window.open(fileUrl, '_blank')} />;
    }
    if (type === 'audio' && fileUrl) {
      return <audio className="msg__audio" src={fileUrl} controls />;
    }
    return null;
  };

  return (
    <div 
      className={`msg ${isOwn ? 'msg--own' : 'msg--other'} ${deleted ? 'msg--deleted' : ''}`}
      id={`msg-${id}`}
    >
      {!isOwn && (
        <div className="msg__avatar">
          {username?.charAt(0).toUpperCase()}
        </div>
      )}
      <div 
        className="msg__swipe-wrapper" 
        ref={swipeRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="msg__body">
          <div className="msg__meta">
            {!isOwn && <span className="msg__author">{username}</span>}
            <span className="msg__time">{time}</span>
            {isOwn && !deleted && (
              <button className="msg__delete" onClick={() => onDelete(id)} title="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            )}
            {!deleted && onReply && (
              <button className="msg__reply-btn" onClick={() => onReply(message)} title="Reply">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 17 4 12 9 7" />
                  <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                </svg>
              </button>
            )}
          </div>
          <div className="msg__bubble">
            {replyTo && (
              <div className="msg__reply-block" onClick={() => onReplyClick?.(replyTo.id)}>
                <span className="msg__reply-author">↩ {replyTo.username}</span>
                <span className="msg__reply-text">
                  {replyTo.type === 'image' ? '🖼️ Image' : replyTo.type === 'audio' ? '🎤 Voice message' : replyTo.text}
                </span>
              </div>
            )}
            {renderMedia()}
            {text && <p className="msg__text">{text}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
