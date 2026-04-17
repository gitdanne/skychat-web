import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import './ChatPage.css';

export default function ChatPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const socket = useSocket();

  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  }, [token]);

  // Fetch messages for current room
  const fetchMessages = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/rooms/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [token]);

  // Load rooms on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Navigate to default room if none selected
  useEffect(() => {
    if (!roomId && rooms.length > 0) {
      navigate('/chat/general', { replace: true });
    }
  }, [roomId, rooms, navigate]);

  // Find current room object
  useEffect(() => {
    if (roomId && rooms.length > 0) {
      const room = rooms.find((r) => r.id === roomId);
      setCurrentRoom(room || null);
    }
  }, [roomId, rooms]);

  // Join room via socket + fetch messages when roomId changes
  useEffect(() => {
    if (!roomId || !socket) return;

    socket.emit('joinRoom', roomId);
    fetchMessages(roomId);
  }, [roomId, socket, fetchMessages]);

  // Listen for realtime events
  useEffect(() => {
    if (!socket) return;

    const onReceiveMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, text: 'Message deleted', deleted: true } : m
        )
      );
    };

    const onRoomCleared = (clearedRoomId) => {
      if (clearedRoomId === roomId) {
        setMessages([]);
      }
    };

    socket.on('receiveMessage', onReceiveMessage);
    socket.on('messageDeleted', onMessageDeleted);
    socket.on('roomCleared', onRoomCleared);

    return () => {
      socket.off('receiveMessage', onReceiveMessage);
      socket.off('messageDeleted', onMessageDeleted);
      socket.off('roomCleared', onRoomCleared);
    };
  }, [socket, roomId]);

  const handleSendMessage = (payload) => {
    if (!socket || !roomId) return;
    socket.emit('sendMessage', { roomId, ...payload });
  };

  const handleDeleteMessage = (messageId) => {
    if (!socket || !roomId) return;
    socket.emit('deleteMessage', { messageId, roomId });
  };

  const handleClearRoom = () => {
    if (!socket || !roomId) return;
    socket.emit('clearRoom', roomId);
  };

  const handleRoomCreated = (newRoom) => {
    setRooms((prev) => [...prev, newRoom]);
    navigate(`/chat/${newRoom.id}`);
    setSidebarOpen(false);
  };

  const handleSelectRoom = (id) => {
    navigate(`/chat/${id}`);
    setSidebarOpen(false);
  };

  const handleLogoClick = () => {
    fetchRooms();
    if (roomId) fetchMessages(roomId);
  };

  return (
    <div className="chat-page">
      <div className="sky-bg"><div className="sky-bg__aurora" /></div>

      <Sidebar
        rooms={rooms}
        currentRoomId={roomId}
        onSelectRoom={handleSelectRoom}
        onRoomCreated={handleRoomCreated}
        onLogoClick={handleLogoClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        token={token}
        user={user}
        onLogout={logout}
      />

      <ChatArea
        room={currentRoom}
        messages={messages}
        user={user}
        onSendMessage={handleSendMessage}
        onDeleteMessage={handleDeleteMessage}
        onClearRoom={handleClearRoom}
        onMenuClick={() => setSidebarOpen(true)}
      />
    </div>
  );
}
