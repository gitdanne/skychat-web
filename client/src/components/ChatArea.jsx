import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import PingIndicator from './PingIndicator';
import './ChatArea.css';

export default function ChatArea({
  room,
  messages,
  user,
  onSendMessage,
  onDeleteMessage,
  onClearRoom,
  onMenuClick,
}) {
  const [text, setText] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClear = () => {
    onClearRoom();
    setShowClearConfirm(false);
  };

  if (!room) {
    return (
      <div className="chat-area chat-area--empty">
        <div className="chat-area__placeholder">
          <div className="chat-area__placeholder-icon">💬</div>
          <h2>Welcome to SkyChat</h2>
          <p>Select a room to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      {/* Header */}
      <header className="chat-area__header glass">
        <button className="chat-area__menu" onClick={onMenuClick}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>

        <div className="chat-area__title">
          <h2>{room.name}</h2>
        </div>

        <div className="chat-area__actions">
          {user?.role === 'admin' && (
            <div className="chat-area__clear-wrap">
              {showClearConfirm ? (
                <div className="chat-area__confirm">
                  <span>Clear all?</span>
                  <button className="chat-area__confirm-yes" onClick={handleClear}>Yes</button>
                  <button className="chat-area__confirm-no" onClick={() => setShowClearConfirm(false)}>No</button>
                </div>
              ) : (
                <button
                  className="chat-area__clear-btn"
                  onClick={() => setShowClearConfirm(true)}
                  title="Clear Chat"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              )}
            </div>
          )}
          <PingIndicator />
        </div>
      </header>

      {/* Messages */}
      <div className="chat-area__messages">
        {messages.length === 0 && (
          <div className="chat-area__no-messages">
            <p>No messages yet. Say something! 👋</p>
          </div>
        )}
        {messages.map((msg) => (
          <Message
            key={msg.id}
            message={msg}
            isOwn={msg.userId === user?.id}
            onDelete={onDeleteMessage}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-area__input glass" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          id="message-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          autoComplete="off"
        />
        <button type="submit" className="chat-area__send" disabled={!text.trim()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
