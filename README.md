# Doc Sign Application

A full-stack digital document signing application built with modern web technologies.

## Project Structure

```
SignDocProject/
├── backend/          # Node.js backend API
├── frontend/         # React frontend application
└── README.md         # This file
```

## Features

- Digital document signing
- User authentication and authorization
- Document management
- Email notifications
- Real-time updates with Redis caching
- MongoDB database integration

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **Redis** (required for caching and session management)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/vanshikaShrma/signatureDashboard.git
cd SignDocProject
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the backend root directory:

```env
MONGO_CONNECTION_STRING=mongodb://localhost:27017/signature
CURRENT_SERVER_URL=http://localhost:3000
INTERNAL_REQUEST_TOKEN=your_secret_token_here
REDIS_PASSWORD=your_redis_password
NODE_ENV=local
FRONTEND_URL=http://localhost:2001
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_AUTH_USER=your_email@ethereal.email
EMAIL_AUTH_PASS=your_email_password
```

Run database migrations (if applicable):

```bash
npm run migrate
```

Start the backend development server:

```bash
npm run dev
```

The backend API will be accessible at `http://localhost:3000`

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the frontend root directory:

```env
VITE_BACKEND_URL=http://localhost:3000
```

Start the frontend development server:

```bash
npm run dev
```

The frontend application will be accessible at `http://localhost:2001`

## Environment Variables

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_CONNECTION_STRING` | MongoDB connection string | `mongodb://localhost:27017/signature` |
| `CURRENT_SERVER_URL` | Backend server URL | `http://localhost:3000` |
| `INTERNAL_REQUEST_TOKEN` | Secret token for internal requests | `your_secret_token` |
| `REDIS_PASSWORD` | Redis server password | `your_redis_password` |
| `NODE_ENV` | Application environment | `local`, `development`, `production` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:2001` |
| `EMAIL_HOST` | Email server host | `smtp.ethereal.email` |
| `EMAIL_PORT` | Email server port | `587` |
| `EMAIL_AUTH_USER` | Email authentication username | `user@ethereal.email` |
| `EMAIL_AUTH_PASS` | Email authentication password | `your_password` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `http://localhost:3000` |

## Production Build

### Backend Production Build

```bash
cd backend
npm run build
npm start
```

### Frontend Production Build

```bash
cd frontend
npm run build
```

The built files will be in the `dist/` directory and can be served by any static file server.

## Development Commands

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Database Setup

1. **MongoDB**: Ensure MongoDB is running on your system or configure a cloud MongoDB instance
2. **Redis**: Install and start Redis server for caching and session management

### Redis Installation

**Windows:**
```bash
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

## Architecture

- **Frontend**: React with Vite for fast development and building
- **Backend**: Node.js with Express.js framework
- **Database**: MongoDB for document storage
- **Cache**: Redis for session management and caching
- **Email**: SMTP integration for notifications

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000 (backend) and 2001 (frontend) are available
2. **MongoDB connection**: Verify MongoDB is running and connection string is correct
3. **Redis connection**: Ensure Redis server is running
4. **Environment variables**: Double-check all required environment variables are set

### Support

If you encounter any issues, please:
1. Check the console logs for error messages
2. Verify all environment variables are correctly set
3. Ensure all prerequisites are installed and running
4. Create an issue in the repository with detailed error information
