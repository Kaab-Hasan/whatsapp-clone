# WhatsApp Clone

A real-time messaging application built with Next.js, Socket.IO, and MySQL.

## Features

- User authentication (signup/login)
- 1-to-1 real-time messaging
- Group chat functionality
- Real-time communication using Socket.IO
- Dynamic routing for chat pages
- MySQL database for data persistence

## Tech Stack

- Next.js (App Router)
- TypeScript
- Socket.IO for real-time messaging
- MySQL for database
- Tailwind CSS for styling
- bcrypt for password hashing
- JWT with HTTP-only cookies for authentication

## Prerequisites

- Node.js (v18 or later)
- MySQL server

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd whatsapp-clone
```

2. Install dependencies:

```bash
npm install
```

3. Create a MySQL database:

```sql
CREATE DATABASE whatsapp_clone;
```

4. Create a `.env.local` file in the root directory with the following variables:

```
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=whatsapp_clone

# Authentication
JWT_SECRET=your_jwt_secret_key

# Socket.IO
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Initialize the database tables:

```bash
# Start the development server
npm run dev

# In a separate terminal or browser, visit:
http://localhost:3000/api/init-db
```

6. Start the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/src
├── app                   # Next.js App Router
│   ├── api               # API routes
│   │   ├── auth          # Authentication endpoints
│   │   ├── messages      # Message endpoints
│   │   └── groups        # Group chat endpoints
│   ├── chat              # Chat pages
│   │   └── [conversationId]  # Dynamic chat page
│   └── page.tsx          # Home/login page
├── components            # React components
│   ├── Sidebar.tsx       # Conversations sidebar
│   ├── ChatBox.tsx       # Chat interface
│   └── Message.tsx       # Message component
├── lib                   # Utility functions
│   ├── db.ts             # Database connection
│   └── auth.ts           # Authentication utilities
├── services              # Service layer
│   └── fetcher.ts        # API fetch wrapper
├── sockets               # Socket.IO handlers
│   ├── client.ts         # Client-side socket
│   └── server.ts         # Server-side socket
└── types                 # TypeScript types
    └── index.d.ts        # Type definitions
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - Login with existing credentials
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/auth/me` - Get current user information

### Messages

- `GET /api/messages?conversationId=123` - Get messages for a conversation
- `POST /api/messages` - Send a new message

### Conversations

- `GET /api/conversations` - Get all conversations for current user
- `GET /api/conversations/:id` - Get a specific conversation
- `POST /api/conversations` - Create a new 1-to-1 conversation

### Groups

- `GET /api/groups` - Get all group conversations
- `POST /api/groups` - Create a new group conversation

## License

MIT
