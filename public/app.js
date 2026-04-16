const socket = io();

const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesDisplay = document.getElementById('chat-messages');
const onlineCount = document.getElementById('online-count');
const userList = document.getElementById('user-list');
const userListPanel = document.getElementById('user-list-panel');
const showUsersBtn = document.getElementById('show-users-btn');
const closeUsersBtn = document.getElementById('close-users-btn');
const imgBtn = document.getElementById('img-btn');
const imageInput = document.getElementById('image-input');
const micBtn = document.getElementById('mic-btn');
const recordingStatus = document.getElementById('recording-status');
const recordingTimer = document.getElementById('recording-timer');
const audioPreview = document.getElementById('audio-preview');
const previewPlayer = document.getElementById('preview-player');
const deletePreview = document.getElementById('delete-preview');
const roomBrowser = document.getElementById('room-browser');
const roomList = document.getElementById('room-list');
const chatMessages = document.getElementById('chat-messages');
const chatFooter = document.getElementById('chat-footer');
const backToRoomsBtn = document.getElementById('back-to-rooms');
const headerTitle = document.getElementById('header-title');
const newRoomInput = document.getElementById('new-room-name');
const createRoomBtn = document.getElementById('create-room-btn');

let currentUser = null;
let currentRoom = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingStartTime = 0;
let pendingAudioData = null;

// Login logic
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = usernameInput.value.trim();
    if (name) {
        currentUser = name;
        console.log('Logging in as:', name);
        socket.emit('login', name);
        
        // Switch UI
        loginContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        roomBrowser.classList.remove('hidden');
        chatMessages.classList.add('hidden');
        chatFooter.classList.add('hidden');
        backToRoomsBtn.classList.add('hidden');
        headerTitle.textContent = 'SkyChat';
        
        // Hide chat-specific header tools on room browser
        onlineCount.classList.add('hidden');
        statusDot.classList.add('hidden');
        showUsersBtn.classList.add('hidden');
        
        // Explicitly request rooms just in case login emit was too fast
        socket.emit('get_rooms');
    }
});

// Message sending
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!currentRoom) return;

    const tempId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    if (pendingAudioData || text) {
        const pendingData = {
            id: tempId,
            user: { username: currentUser, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser}` },
            text: text,
            audio: pendingAudioData,
            room: currentRoom,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isPending: true
        };
        
        appendMessage(pendingData);
        
        const currentAudio = pendingAudioData;
        clearPreview();

        const timeout = setTimeout(() => {
            markMessageError(tempId);
        }, 15000);

        socket.emit('send_message', { id: tempId, text, audio: currentAudio, room: currentRoom }, (response) => {
            clearTimeout(timeout);
            if (response && response.status === 'ok') {
                markMessageSuccess(tempId);
            } else {
                markMessageError(tempId);
            }
        });
    }
    
    if (text) {
        messageInput.value = '';
        autoResize(messageInput);
    }
});

function markMessageSuccess(id) {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) {
        el.classList.remove('pending');
    }
}

function markMessageError(id) {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) {
        el.classList.remove('pending');
        el.classList.add('sent-error');
        const body = el.querySelector('.msg-header');
        if (body) body.innerHTML += ' <span class="error-text" style="background:none; margin:0; padding:0; display:inline">⚠️ Failed</span>';
    }
}

// Room logic
createRoomBtn.addEventListener('click', () => {
    const name = newRoomInput.value.trim();
    if (name) {
        socket.emit('create_room', name);
        newRoomInput.value = '';
    }
});

backToRoomsBtn.addEventListener('click', () => {
    currentRoom = null;
    roomBrowser.classList.remove('hidden');
    chatMessages.classList.add('hidden');
    chatFooter.classList.add('hidden');
    backToRoomsBtn.classList.add('hidden');
    headerTitle.textContent = 'SkyChat';
    
    // Hide chat tools when returning to list
    onlineCount.classList.add('hidden');
    statusDot.classList.add('hidden');
    showUsersBtn.classList.add('hidden');
});

socket.on('room_list', (rooms) => {
    console.log('Received room list:', rooms);
    renderRoomList(rooms);
});

socket.on('room_joined', (room) => {
    console.log('Joined room:', room.name);
    currentRoom = room.name;
    headerTitle.textContent = room.name;
    roomBrowser.classList.add('hidden');
    chatMessages.classList.remove('hidden');
    chatFooter.classList.remove('hidden');
    backToRoomsBtn.classList.remove('hidden');
    
    // Show chat tools when in a room
    onlineCount.classList.remove('hidden');
    statusDot.classList.remove('hidden');
    showUsersBtn.classList.remove('hidden');
    
    chatMessages.innerHTML = ''; // Clear messages from previous room
    scrollToBottom();
});

function renderRoomList(rooms) {
    console.log('Rendering room list, count:', rooms.length);
    if (!roomList) {
        console.error('roomList element not found!');
        return;
    }
    roomList.innerHTML = '';
    rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';
        card.innerHTML = `
            <h3>${room.name}</h3>
            <p>Created by: ${room.createdBy}</p>
            <div class="room-stats">
                <span class="member-badge">${room.members} members</span>
                <button class="join-btn-small">Join</button>
            </div>
        `;
        card.onclick = () => {
            console.log('Joining room:', room.name);
            socket.emit('join_room', room.name);
        };
        roomList.appendChild(card);
    });
}

// Image handling
imgBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('Image is too large (max 5MB)');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            socket.emit('send_message', { 
                text: '', 
                image: event.target.result 
            });
            imageInput.value = '';
        };
        reader.readAsDataURL(file);
    }
});

// Auto-resize textarea
messageInput.addEventListener('input', () => {
    autoResize(messageInput);
});

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight) + 'px';
}

// Voice Recording Logic
micBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        startRecording();
    } else {
        stopRecording();
    }
});

deletePreview.addEventListener('click', () => {
    clearPreview();
});

function clearPreview() {
    pendingAudioData = null;
    audioPreview.classList.add('hidden');
    previewPlayer.src = '';
    // Restore layout if needed
    messageInput.style.display = 'block';
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Use a more standard mime type
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                         ? 'audio/webm;codecs=opus' 
                         : 'audio/webm';
                         
        mediaRecorder = new MediaRecorder(stream, { mimeType });
        audioChunks = [];
        clearPreview();

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            if (audioChunks.length === 0) {
                console.error("No audio data captured.");
                stopRecording();
                return;
            }
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            console.log(`Recording stopped. Blob size: ${Math.round(audioBlob.size / 1024)} KB, type: ${mimeType}`);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                pendingAudioData = e.target.result;
                previewPlayer.src = pendingAudioData;
                audioPreview.classList.remove('hidden');
            };
            reader.readAsDataURL(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        recordingStartTime = Date.now();
        recordingStatus.classList.remove('hidden');
        micBtn.classList.add('recording');
        micBtn.innerHTML = `<svg viewBox="0 0 24 24" class="icon"><path d="M6 6h12v12H6z"></path></svg>`; // Stop icon
        
        recordingInterval = setInterval(updateTimer, 100);
    } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Could not access microphone.");
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        clearInterval(recordingInterval);
        recordingStatus.classList.add('hidden');
        micBtn.classList.remove('recording');
        micBtn.innerHTML = `<svg viewBox="0 0 24 24" class="icon"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"></path></svg>`; // Mic icon
    }
}

function updateTimer() {
    const elapsed = Date.now() - recordingStartTime;
    const seconds = Math.floor(elapsed / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    recordingTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Socket Connection Status
const statusDot = document.getElementById('status-dot');

socket.on('connect', () => {
    statusDot.className = 'status-dot online';
    statusDot.title = 'Connected';
    sendBtn.disabled = false;
});

socket.on('disconnect', () => {
    statusDot.className = 'status-dot offline';
    statusDot.title = 'Disconnected - reconnecting...';
    sendBtn.disabled = true;
});

socket.on('reconnect_attempt', () => {
    statusDot.className = 'status-dot connecting';
});

// Receiving messages
socket.on('receive_message', (data) => {
    appendMessage(data);
});

// System messages
socket.on('system_message', (data) => {
    const div = document.createElement('div');
    div.className = 'system-msg';
    div.textContent = data.text;
    messagesDisplay.appendChild(div);
    scrollToBottom();
});

// Update online count and list
socket.on('user_list', (users) => {
    onlineCount.textContent = `${users.length} Online`;
    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.className = 'user-item';
        li.innerHTML = `
            <img src="${user.avatar}" class="avatar">
            <span>${user.username}</span>
        `;
        userList.innerHTML += li.outerHTML;
    });
});

// Helper functions
function appendMessage(data) {
    // Only show messages for the current room
    if (data.room && data.room !== currentRoom) return;

    // Prevent duplicates
    const existing = document.querySelector(`[data-id="${data.id}"]`);
    if (existing && !data.isPending) {
        existing.classList.remove('pending');
        return;
    }

    const isSelf = data.user.username === currentUser;
    const div = document.createElement('div');
    div.className = `message ${isSelf ? 'sent' : 'received'} ${data.isPending ? 'pending' : ''}`;
    div.setAttribute('data-id', data.id);
    
    let content = '';
    if (data.text) {
        content += `<div class="msg-body">${data.text}</div>`;
    }
    if (data.image) {
        content += `<img src="${data.image}" class="msg-img" onclick="window.open('${data.image}', '_blank')">`;
    }
    if (data.audio) {
        content += `
            <div class="audio-container">
                <audio controls src="${data.audio}" class="msg-audio" preload="metadata" 
                    onerror="this.parentElement.innerHTML='<span class=\'error-text\'>⚠️ Audio playback error</span>'">
                </audio>
            </div>
        `;
    }

    div.innerHTML = `
        <div class="msg-header">
            <span>${isSelf ? 'You' : data.user.username}</span>
            <span class="msg-time">${data.time}</span>
        </div>
        ${content}
    `;
    
    messagesDisplay.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
}

// UI Toggles
showUsersBtn.addEventListener('click', () => {
    userListPanel.classList.toggle('hidden');
});

closeUsersBtn.addEventListener('click', () => {
    userListPanel.classList.add('hidden');
});

// Handle keyboard in textarea
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event('submit'));
    }
});
