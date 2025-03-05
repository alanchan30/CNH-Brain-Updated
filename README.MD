# FastAPI-Vite Full Stack Application

This is a full-stack application using FastAPI for the backend and Vite for the frontend.

## Prerequisites

- Node.js and npm
- Python 3.x and pip
- Git

## Installation

You can install all dependencies (both frontend and backend) with a single command:

```bash
npm run setup
```

This will:
1. Install root project dependencies
2. Install Python backend dependencies
3. Install frontend Node.js dependencies

### Manual Installation (if needed)

If you prefer to install dependencies separately:

1. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

## Running the Application

### Development Mode

To run both the frontend and backend concurrently in development mode:

```bash
npm run start
```

This will start:
- Backend server at: http://localhost:8000
- Frontend dev server at: http://localhost:5173 (default Vite port)

### Running Services Separately

If you need to run the services separately:

1. Backend only:
```bash
npm run start:backend
```

2. Frontend only:
```bash
npm run start:frontend
```

## Building for Production

To build the frontend for production:

```bash
npm run build
```

To serve the built frontend:

```bash
npm run serve
```

## Project Structure

```
.
├── backend/         # FastAPI backend
├── frontend/        # Vite frontend
├── package.json     # Root package.json for project configuration
└── README.md       # This file
```
