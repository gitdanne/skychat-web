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

let currentUser = null;

// Login logic
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = usernameInput.value.trim();
    if (name) {
        currentUser = name;
        socket.emit('login', name);
        loginContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
    }
});

// Message sending
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (text) {
        socket.emit('send_message', { text });
        messageInput.value = '';
    }
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
    const isSelf = data.user.username === currentUser;
    const div = document.createElement('div');
    div.className = `message ${isSelf ? 'sent' : 'received'}`;
    
    div.innerHTML = `
        <div class="msg-header">
            <span>${isSelf ? 'You' : data.user.username}</span>
            <span class="msg-time">${data.time}</span>
        </div>
        <div class="msg-body">${data.text}</div>
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

// Handle enter key in messages
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event('submit'));
    }
});
