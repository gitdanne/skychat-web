import React, { useState, useMemo, useEffect } from 'react';
import CreateRoomModal from './CreateRoomModal';
import PasswordModal from './PasswordModal';
import './Sidebar.css';

const ROOM_ICONS = {
  general: '💬',
  'tech-talk': '💻',
  music: '🎵',
};

export default function Sidebar({
  rooms,
  currentRoomId,
  onSelectRoom,
  onRoomCreated,
  onLogoClick,
  isOpen,
  onClose,
  token,
  user,
  onLogout,
}) {
  const [search, setSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [passwordRoom, setPasswordRoom] = useState(null);

  const globalRooms = useMemo(
    () => rooms.filter((r) => r.isGlobal),
    [rooms]
  );

  const customRooms = useMemo(
    () =>
      rooms
        .filter((r) => !r.isGlobal && !r.id.startsWith('dm_'))
        .filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [rooms, search]
  );
  
  const dmRooms = useMemo(
    () => rooms.filter((r) => r.id.startsWith('dm_')),
    [rooms]
  );

  useEffect(() => {
    if (!userSearch.trim()) {
      setSearchedUsers([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(userSearch)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchedUsers(data.users || []);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [userSearch, token]);

  const handleRoomClick = (room) => {
    if (room.hasPassword && room.id !== currentRoomId) {
      setPasswordRoom(room);
    } else {
      onSelectRoom(room.id);
    }
  };

  const handleUserClick = (targetUser) => {
    const ids = [user.id, targetUser.id].sort();
    const dmRoomId = `dm_${ids[0]}_${ids[1]}`;
    onSelectRoom(dmRoomId);
    setUserSearch('');
  };

  const handlePasswordSuccess = () => {
    if (passwordRoom) {
      onSelectRoom(passwordRoom.id);
      setPasswordRoom(null);
    }
  };

  return (
    <>
      <aside className={`sidebar glass ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Header */}
        <div className="sidebar__header">
          <button className="sidebar__logo" onClick={onLogoClick}>
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <defs>
                <linearGradient id="sidebarGrad" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stopColor="#3a9fff" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <path d="M24 4C14 4 6 12 6 22c0 4 1.5 7.5 4 10.5L8 42l8-4c2.5 1 5.2 1.5 8 1.5 10 0 18-8 18-18S34 4 24 4z" fill="url(#sidebarGrad)" opacity="0.9"/>
              <circle cx="16" cy="22" r="2" fill="white" opacity="0.9"/>
              <circle cx="24" cy="22" r="2" fill="white" opacity="0.9"/>
              <circle cx="32" cy="22" r="2" fill="white" opacity="0.9"/>
            </svg>
            <span className="sidebar__brand">SkyChat</span>
          </button>
          <button className="sidebar__close" onClick={onClose}>✕</button>
        </div>

        {/* Global Rooms */}
        <div className="sidebar__section">
          <h3 className="sidebar__label">Global Rooms</h3>
          <ul className="sidebar__rooms">
            {globalRooms.map((room) => (
              <li key={room.id}>
                <button
                  className={`sidebar__room ${room.id === currentRoomId ? 'sidebar__room--active' : ''}`}
                  onClick={() => handleRoomClick(room)}
                >
                  <span className="sidebar__room-icon">
                    {ROOM_ICONS[room.id] || '💬'}
                  </span>
                  <span className="sidebar__room-name">{room.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Search Layout */}
        <div className="sidebar__search-layout">
          <div className="sidebar__search">
            <svg className="sidebar__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sidebar__search-input"
            />
          </div>
          
          <div className="sidebar__search">
            <svg className="sidebar__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="sidebar__search-input"
            />
          </div>
        </div>

        <div className="sidebar__scrollable">
          {searchedUsers.length > 0 && (
            <div className="sidebar__section">
              <h3 className="sidebar__label">Users Found</h3>
              <ul className="sidebar__rooms">
                {searchedUsers.map((u) => (
                  <li key={u.id}>
                    <button className="sidebar__room" onClick={() => handleUserClick(u)}>
                      <span className="sidebar__room-icon">👤</span>
                      <span className="sidebar__room-name">{u.username}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dmRooms.length > 0 && !userSearch && (
            <div className="sidebar__section">
              <h3 className="sidebar__label">Direct Messages</h3>
              <ul className="sidebar__rooms">
                {dmRooms.map((room) => (
                  <li key={room.id}>
                    <button
                      className={`sidebar__room ${room.id === currentRoomId ? 'sidebar__room--active' : ''}`}
                      onClick={() => handleRoomClick(room)}
                    >
                      <span className="sidebar__room-icon">💬</span>
                      <span className="sidebar__room-name">DM Channel</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Custom Rooms */}
          {!userSearch && (
            <div className="sidebar__section sidebar__section--scroll">
              <div className="sidebar__section-header">
                <h3 className="sidebar__label">Custom Rooms</h3>
                <button
                  className="sidebar__add-btn"
                  onClick={() => setShowCreate(true)}
                  title="Create room"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
              <ul className="sidebar__rooms">
                {customRooms.length === 0 && (
                  <li className="sidebar__empty">
                    {search ? 'No rooms found' : 'No custom rooms yet'}
                  </li>
                )}
                {customRooms.map((room) => (
                  <li key={room.id}>
                    <button
                      className={`sidebar__room ${room.id === currentRoomId ? 'sidebar__room--active' : ''}`}
                      onClick={() => handleRoomClick(room)}
                    >
                      <span className="sidebar__room-icon">
                        {room.hasPassword ? '🔒' : '#'}
                      </span>
                      <span className="sidebar__room-name">{room.name}</span>
                      <span className="sidebar__room-meta">by {room.createdBy}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* User info */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__username">{user?.username}</span>
              <span className="sidebar__role">{user?.role}</span>
            </div>
            <button className="sidebar__logout" onClick={onLogout} title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar__overlay" onClick={onClose} />}

      {/* Modals */}
      {showCreate && (
        <CreateRoomModal
          token={token}
          onCreated={(room) => { onRoomCreated(room); setShowCreate(false); }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {passwordRoom && (
        <PasswordModal
          room={passwordRoom}
          token={token}
          onSuccess={handlePasswordSuccess}
          onClose={() => setPasswordRoom(null)}
        />
      )}
    </>
  );
}
