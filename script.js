// Chatkuy - Modern Minimalist Chat App
class ChatApp {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('chatkuy_users')) || {};
        this.messages = JSON.parse(localStorage.getItem('chatkuy_messages')) || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Auth form switching
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Form submissions
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Chat functionality
        document.getElementById('messageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Enter key for message input
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    checkAuthState() {
        const savedUser = localStorage.getItem('chatkuy_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showChatScreen();
        } else {
            this.showLoginScreen();
        }
    }

    showLoginForm() {
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('registerForm').classList.remove('active');
        this.clearMessages();
    }

    showRegisterForm() {
        document.getElementById('registerForm').classList.add('active');
        document.getElementById('loginForm').classList.remove('active');
        this.clearMessages();
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('chatScreen').classList.remove('active');
    }

    showChatScreen() {
        document.getElementById('chatScreen').classList.add('active');
        document.getElementById('loginScreen').classList.remove('active');
        this.updateUserInfo();
        this.loadMessages();
        this.focusMessageInput();
    }

    handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        // Validation
        if (!username || !email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        if (username.length < 3) {
            this.showError('Username must be at least 3 characters long');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Check if username already exists
        if (this.users[username]) {
            this.showError('Username already exists');
            return;
        }

        // Create new user
        const newUser = {
            username,
            email,
            password: this.hashPassword(password),
            joinedAt: new Date().toISOString(),
            avatar: username.charAt(0).toUpperCase()
        };

        this.users[username] = newUser;
        localStorage.setItem('chatkuy_users', JSON.stringify(this.users));

        this.showSuccess('Account created successfully! Please sign in.');
        this.showLoginForm();
        
        // Clear form
        document.getElementById('registerFormElement').reset();
    }

    handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        const user = this.users[username];
        if (!user || user.password !== this.hashPassword(password)) {
            this.showError('Invalid username or password');
            return;
        }

        // Login successful
        this.currentUser = {
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            joinedAt: user.joinedAt
        };

        localStorage.setItem('chatkuy_current_user', JSON.stringify(this.currentUser));
        
        // Clear form
        document.getElementById('loginFormElement').reset();
        
        this.showChatScreen();
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('chatkuy_current_user');
        this.showLoginScreen();
        this.clearMessages();
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const messageText = messageInput.value.trim();

        if (!messageText || !this.currentUser) return;

        const message = {
            id: Date.now(),
            username: this.currentUser.username,
            avatar: this.currentUser.avatar,
            text: messageText,
            timestamp: new Date().toISOString(),
            isOwn: true
        };

        this.messages.push(message);
        localStorage.setItem('chatkuy_messages', JSON.stringify(this.messages));

        this.displayMessage(message);
        messageInput.value = '';
        this.scrollToBottom();

        // Simulate response from other users (for demo purposes)
        setTimeout(() => {
            this.simulateResponse(messageText);
        }, 1000 + Math.random() * 2000);
    }

    simulateResponse(originalMessage) {
        const responses = [
            "That's interesting! Tell me more.",
            "I agree with you on that.",
            "Thanks for sharing!",
            "What do you think about it?",
            "That makes sense.",
            "I have a different perspective on this.",
            "Good point!",
            "Let me think about that.",
            "Absolutely!",
            "I'm not sure I understand."
        ];

        const botUsers = [
            { username: 'ChatBot', avatar: 'B' },
            { username: 'Alice', avatar: 'A' },
            { username: 'Bob', avatar: 'B' },
            { username: 'Charlie', avatar: 'C' }
        ];

        const randomBot = botUsers[Math.floor(Math.random() * botUsers.length)];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        const responseMessage = {
            id: Date.now(),
            username: randomBot.username,
            avatar: randomBot.avatar,
            text: randomResponse,
            timestamp: new Date().toISOString(),
            isOwn: false
        };

        this.messages.push(responseMessage);
        localStorage.setItem('chatkuy_messages', JSON.stringify(this.messages));

        this.displayMessage(responseMessage);
        this.scrollToBottom();
    }

    loadMessages() {
        const messagesList = document.getElementById('messagesList');
        messagesList.innerHTML = '';

        // Show last 50 messages
        const recentMessages = this.messages.slice(-50);
        
        recentMessages.forEach(message => {
            this.displayMessage(message, false);
        });

        this.scrollToBottom();
    }

    displayMessage(message, animate = true) {
        const messagesList = document.getElementById('messagesList');
        const messageElement = document.createElement('div');
        
        const isOwnMessage = message.username === this.currentUser.username;
        messageElement.className = `message ${isOwnMessage ? 'own' : ''}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageElement.innerHTML = `
            <div class="message-avatar">${message.avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username">${message.username}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${this.escapeHtml(message.text)}</div>
            </div>
        `;

        if (animate) {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(20px)';
        }

        messagesList.appendChild(messageElement);

        if (animate) {
            requestAnimationFrame(() => {
                messageElement.style.transition = 'opacity 0.3s, transform 0.3s';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            });
        }
    }

    updateUserInfo() {
        const userInfo = document.getElementById('userInfo');
        if (this.currentUser) {
            userInfo.textContent = `Welcome, ${this.currentUser.username}`;
        }
    }

    focusMessageInput() {
        setTimeout(() => {
            document.getElementById('messageInput').focus();
        }, 100);
    }

    scrollToBottom() {
        const messagesContainer = document.querySelector('.messages-container');
        requestAnimationFrame(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    }

    // Utility functions
    hashPassword(password) {
        // Simple hash function for demo purposes
        // In production, use proper hashing like bcrypt
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        this.clearMessages();

        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;

        const activeForm = document.querySelector('.form-container.active');
        if (activeForm) {
            activeForm.insertBefore(messageDiv, activeForm.firstChild);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    clearMessages() {
        const errorMessages = document.querySelectorAll('.error-message, .success-message');
        errorMessages.forEach(msg => msg.remove());
    }

    // Initialize demo data
    initializeDemoData() {
        if (Object.keys(this.users).length === 0) {
            // Add demo users
            const demoUsers = {
                'demo': {
                    username: 'demo',
                    email: 'demo@chatkuy.com',
                    password: this.hashPassword('demo123'),
                    joinedAt: new Date().toISOString(),
                    avatar: 'D'
                },
                'alice': {
                    username: 'alice',
                    email: 'alice@example.com',
                    password: this.hashPassword('alice123'),
                    joinedAt: new Date().toISOString(),
                    avatar: 'A'
                }
            };

            this.users = demoUsers;
            localStorage.setItem('chatkuy_users', JSON.stringify(this.users));
        }

        if (this.messages.length === 0) {
            // Add welcome message
            const welcomeMessage = {
                id: Date.now(),
                username: 'ChatBot',
                avatar: 'C',
                text: 'Welcome to Chatkuy! This is a modern minimalist chat application. Start chatting!',
                timestamp: new Date().toISOString(),
                isOwn: false
            };

            this.messages = [welcomeMessage];
            localStorage.setItem('chatkuy_messages', JSON.stringify(this.messages));
        }
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChatApp();
    
    // Initialize demo data for first-time users
    app.initializeDemoData();
    
    // Add some helpful info to console
    console.log('🚀 Chatkuy initialized!');
    console.log('Demo account: username="demo", password="demo123"');
});

// Add some global utility functions
window.clearChatData = function() {
    if (confirm('Are you sure you want to clear all chat data? This cannot be undone.')) {
        localStorage.removeItem('chatkuy_users');
        localStorage.removeItem('chatkuy_messages');
        localStorage.removeItem('chatkuy_current_user');
        location.reload();
    }
};

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatApp;
}