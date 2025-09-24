# Chatkuy

Modern minimalist web chat application with user authentication and per-account functionality.

## Features

- 🔐 **User Authentication** - Secure login and registration system
- 💬 **Real-time Chat** - Modern chat interface with message history
- 👤 **Per-Account System** - Individual user accounts with personalized experience
- 🎨 **Minimalist Design** - Clean, modern UI with responsive design
- 📱 **Mobile Friendly** - Optimized for all device sizes
- 💾 **Local Storage** - Data persistence using browser local storage

## Demo Account

For quick testing, use these credentials:
- **Username:** demo
- **Password:** demo123

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/WicakMEN/Chatkuy.git
   cd Chatkuy
   ```

2. Start the development server:
   ```bash
   npm start
   ```
   or
   ```bash
   python3 -m http.server 8000
   ```

3. Open your browser and navigate to `http://localhost:8000`

## Usage

### Registration
1. Click on "Sign up" link on the login page
2. Fill in your username, email, and password
3. Click "Sign Up" to create your account

### Login
1. Enter your username and password
2. Click "Sign In" to access the chat

### Chatting
1. Type your message in the input field
2. Press Enter or click "Send" to send your message
3. View chat history in the messages area
4. Use the logout button to sign out

## Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript** - No frameworks, pure JavaScript
- **Local Storage** - Client-side data persistence
- **Responsive Design** - Mobile-first approach

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## File Structure

```
Chatkuy/
├── index.html      # Main HTML file
├── styles.css      # CSS styling
├── script.js       # JavaScript functionality
├── package.json    # Project configuration
├── .gitignore      # Git ignore rules
└── README.md       # Documentation
```

## Features in Detail

### Authentication System
- Username and password validation
- Email format validation
- Secure password hashing
- Session management

### Chat Features
- Real-time message display
- Message timestamps
- User avatars (initials)
- Message history persistence
- Auto-scroll to new messages
- Responsive message bubbles

### UI/UX Features
- Modern minimalist design
- Smooth animations and transitions
- Mobile-responsive layout
- Accessible form controls
- Loading states and error handling

## Development

### Adding New Features
The application is built with a modular JavaScript class structure. To add new features:

1. Extend the `ChatApp` class in `script.js`
2. Add corresponding HTML elements in `index.html`
3. Style new elements in `styles.css`

### Data Management
Data is stored in browser's localStorage:
- `chatkuy_users` - User accounts
- `chatkuy_messages` - Chat messages
- `chatkuy_current_user` - Current session

### Clearing Data
Use the browser console command:
```javascript
clearChatData()
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Author

WicakMEN

---

**Chatkuy** - Where conversations come alive! ✨