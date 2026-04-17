import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import './ChatArea.css';

export default function ChatArea({
  room,
  messages,
  user,
  onSendMessage,
  onDeleteMessage,
  onClearRoom,
  onMenuClick,
  token
}) {
  const [text, setText] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Media states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim() && !isRecording) return;
    
    // Check if we are still recording, prevent sending text until done
    if (isRecording) {
      stopRecording();
      return;
    }

    onSendMessage({
      text: text.trim(),
      type: 'text',
      replyTo: replyingTo?.id || null,
    });
    
    setText('');
    setReplyingTo(null);
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

  // ── Media Uploads ──────────────────────────────────────────────
  const uploadFile = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { ...authHeader },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.url;
    } catch (err) {
      console.error(err);
      alert('Failed to upload file.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileInputRef.current.value = ''; // Reset

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const url = await uploadFile(file);
    if (url) {
      onSendMessage({
        text: '',
        type: 'image',
        fileUrl: url,
        replyTo: replyingTo?.id || null,
      });
      setReplyingTo(null);
    }
  };

  // ── Voice Recording ────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop()); // Release mic

        const url = await uploadFile(audioBlob);
        if (url) {
          onSendMessage({
            text: '',
            type: 'audio',
            fileUrl: url,
            replyTo: replyingTo?.id || null,
          });
          setReplyingTo(null);
        }
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      let time = 0;
      timerRef.current = setInterval(() => {
        time += 1;
        setRecordingTime(time);
      }, 1000);

    } catch (err) {
      console.error(err);
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
      setRecordingTime(0);
      audioChunksRef.current = [];
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleReplyClick = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('msg--highlighted');
      setTimeout(() => el.classList.remove('msg--highlighted'), 1000);
    }
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
                <button className="chat-area__clear-btn" onClick={() => setShowClearConfirm(true)} title="Clear Chat">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="chat-area__messages">
        {messages.map((msg) => (
          <Message
            key={msg.id}
            message={msg}
            isOwn={msg.userId === user?.id}
            onDelete={onDeleteMessage}
            onReply={setReplyingTo}
            onReplyClick={handleReplyClick}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-area__input-wrapper">
        {replyingTo && (
          <div className="chat-area__reply-preview glass">
            <div className="chat-area__reply-content">
              <strong>Replying to {replyingTo.username}</strong>
              <p>{replyingTo.type === 'image' ? '🖼️ Image' : replyingTo.type === 'audio' ? '🎤 Voice message' : replyingTo.text}</p>
            </div>
            <button type="button" onClick={() => setReplyingTo(null)} className="chat-area__reply-cancel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        <form className="chat-area__input glass" onSubmit={handleSubmit}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden-file-input"
          />
          
          <button type="button" className="chat-area__attach" onClick={() => fileInputRef.current?.click()} disabled={uploading || isRecording}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>

          {isRecording ? (
            <div className="chat-area__recording">
              <span className="recording-pulse"></span>
              <span className="recording-time">{formatTime(recordingTime)}</span>
              <button type="button" onClick={cancelRecording} className="recording-cancel">Cancel</button>
            </div>
          ) : (
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              autoComplete="off"
              disabled={uploading}
            />
          )}

          {(!text.trim() && !isRecording && !uploading) ? (
             <button type="button" className="chat-area__mic" onClick={startRecording}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                 <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
               </svg>
             </button>
          ) : (
            <button type="submit" className="chat-area__send" disabled={uploading}>
              {isRecording ? (
                // Send icon for recording
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              ) : uploading ? (
                <span className="spinner-small" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
