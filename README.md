# Secure File Management System

A full-stack React + Node.js application with comprehensive security features for personal file and text management.

## 🔒 Security Features

### Backend Security
- **JWT Authentication** with secure token handling
- **Rate Limiting** to prevent abuse (15 min windows)
- **Input Validation** using express-validator
- **XSS Protection** with data sanitization
- **CORS Configuration** with specific origin control
- **Helmet.js** for security headers
- **File Type Validation** with whitelist approach
- **Path Traversal Protection** for file operations
- **Password Hashing** with bcryptjs
- **HTTP Parameter Pollution** prevention
- **Compression** for performance
- **Cookie Security** with httpOnly and secure flags

### Frontend Security
- **CSP Headers** in HTML meta tags
- **Axios Interceptors** for automatic token handling
- **Input Sanitization** on client side
- **Secure Token Storage** with automatic cleanup
- **Protected Routes** with authentication checks

## 🚀 Features

### File Management
- **Secure Upload** with drag & drop support
- **File Type Restrictions** for security
- **Download Protection** with path validation
- **File Sharing** with expiring links (24h)
- **File Deletion** with confirmation
- **File Size Limits** (50MB per file, 5 files max)

### Notepad
- **Create/Edit Notes** with real-time saving
- **Note Management** with list view
- **Persistent Storage** until explicitly deleted
- **File Size Tracking** for notes
- **Last Modified Timestamps**

### User Interface
- **Responsive Design** for all devices
- **Modern UI** with Tailwind CSS
- **Loading States** and error handling
- **Toast Notifications** for user feedback
- **Tab-based Navigation**

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd secure-file-manager
   \`\`\`

2. **Install all dependencies**
   \`\`\`bash
   npm run install-all
   \`\`\`

3. **Environment Configuration**
   Create `server/.env` file:
   \`\`\`env
   NODE_ENV=development
   PORT=5000
   CLIENT_URL=http://localhost:3000
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-at-least-32-characters-long
   JWT_EXPIRES_IN=24h
   \`\`\`

4. **Start Development Servers**
   \`\`\`bash
   npm run dev
   \`\`\`
   This starts both backend (port 5000) and frontend (port 3000)

5. **Production Build**
   \`\`\`bash
   npm run build
   npm start
   \`\`\`

## 🔐 Default Credentials



## 📁 Project Structure

\`\`\`
secure-file-manager/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── index.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── middleware/         # Security & auth middleware
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── uploads/           # File storage
│   ├── notes/             # Notes storage
│   └── index.js
└── package.json           # Root package.json
\`\`\`

## 🛡️ Security Considerations

### Production Deployment
1. **Change JWT Secret** to a strong, random string
2. **Enable HTTPS** and set secure cookie flags
3. **Configure CORS** for your production domain
4. **Set up Rate Limiting** with Redis for distributed systems
5. **Use Environment Variables** for all sensitive data
6. **Regular Security Updates** for dependencies
7. **File Storage** consider cloud storage for scalability
8. **Database Integration** for user management and metadata
9. **Backup Strategy** for uploaded files and notes
10. **Monitoring & Logging** for security events

### File Security
- Files are stored with UUID prefixes to prevent enumeration
- Path traversal attacks are prevented with path validation
- File types are restricted to safe formats
- File size limits prevent DoS attacks
- Share links expire automatically after 24 hours

### Authentication Security
- JWT tokens expire after 24 hours
- Passwords are hashed with bcrypt (12 rounds)
- Rate limiting prevents brute force attacks
- Secure cookies with httpOnly flag
- Automatic token cleanup on logout

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user

### File Management
- `POST /api/files/upload` - Upload files
- `GET /api/files` - List all files
- `GET /api/files/download/:filename` - Download file
- `DELETE /api/files/:filename` - Delete file
- `POST /api/files/share/:filename` - Create share link
- `GET /api/files/shared/:shareId` - Access shared file

### Notes Management
- `GET /api/notes` - List all notes
- `POST /api/notes` - Create/update note
- `GET /api/notes/:id` - Get specific note
- `DELETE /api/notes/:id` - Delete note

## 🚀 Deployment Options

### Heroku
\`\`\`bash
# Add buildpacks
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-secret

# Deploy
git push heroku main
\`\`\`

### Docker
\`\`\`dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
\`\`\`

### VPS/Cloud
1. Set up Node.js environment
2. Configure reverse proxy (nginx)
3. Set up SSL certificates
4. Configure environment variables
5. Set up process manager (PM2)

## 📝 License

MIT License - Feel free to modify and use as needed.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**⚠️ Security Notice**: This application includes security best practices but should be reviewed by security professionals before production deployment. Regular security audits and updates are recommended.
