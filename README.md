# AI Chat

AI Chat is a full-stack chat application built with React, TypeScript, Node.js, Express, MongoDB, and an external Llama-compatible inference server.

The project is organized as a simple monorepo with separate frontend and backend applications.

## Overview

The project is designed to run locally on your own machine, as long as you have MongoDB and a compatible Llama-compatible inference server available.

## Project Structure

```text
Ai-chat/
├── api/ # Backend
│   ├── node_modules/
│   ├── folders...
│   ├── .env
│   └── package.json
│
├── web/ # Frontend
│   ├── node_modules/
│   ├── folders...
│   └── package.json
│
├── .gitignore
└── package.json
```

## Prerequisites

Before you start, make sure you have:

- Node.js 20+ and npm
- MongoDB running locally or accessible via a MongoDB URI
- A local Llama-compatible inference server that exposes:
  - `GET /health`
  - `POST /v1/chat/completions`
- A terminal window to run the frontend and backend separately

## Local Setup

### 1. Clone the Project

Clone the repository and move into the project root:

```bash
git clone <your-repo-url>
cd Ai-chat
```

### 2. Install Dependencies

Install the root dependencies:

```bash
npm install
```

Then install the backend dependencies:

```bash
cd api
npm install
cd ..
```

Install the frontend dependencies:

```bash
cd web
npm install
cd ..
```

Your project should now have dependencies installed in both `api` and `web`.

### 3. Configure the API Environment

The backend uses the `.env` file located inside the `api` folder:

```text
Ai-chat/
└── api/
    └── .env
```

Create or edit `api/.env`.

Example configuration:

```env
NODE_ENV=development
PORT=3000

MONGODB_URI=mongodb://localhost:27017/ai_chat

JWT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
JWT_EXPIRES_IN=7d

LLAMA_SERVER_URL=http://localhost:8080
LLAMA_MODEL=llama-model

AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1024
AI_CONTEXT_SIZE=8192

CORS_ORIGIN=http://localhost:5173
```

#### Environment Variable Notes

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Application environment, such as development or production. |
| `PORT` | Port on which the backend listens. |
| `MONGODB_URI` | Connection string for your MongoDB database. |
| `JWT_SECRET` | Secret used to sign JWT authentication tokens. Use a long, random value. |
| `JWT_EXPIRES_IN` | How long JWT tokens remain valid. |
| `LLAMA_SERVER_URL` | URL of your local Llama-compatible inference server. |
| `LLAMA_MODEL` | Model name recognized by your inference server. |
| `AI_TEMPERATURE` | Controls the randomness of AI responses. |
| `AI_MAX_TOKENS` | Maximum number of tokens generated in a response. |
| `AI_CONTEXT_SIZE` | Context window size used by the AI configuration. |
| `CORS_ORIGIN` | Frontend URL allowed by the backend. |

> Security: `JWT_SECRET` should be a long, random string. Use at least 32 characters in production and never commit your real `.env` file to Git.

### 4. Configure the Frontend API URL

The frontend can use the backend URL through a Vite environment variable.

Create `web/.env` and add:

```env
VITE_API_URL=http://localhost:3000
```

This tells the frontend where to send API requests.

If your frontend already has a default API URL configured in the source code, this file may not be required during local development.

## Start MongoDB

Make sure MongoDB is running before starting the application.

### Local MongoDB

For a local MongoDB installation, start MongoDB using your normal MongoDB setup.

For example:

```bash
mongod --dbpath /path/to/your/mongo-data
```

The exact command may vary depending on your operating system and MongoDB installation.

### MongoDB with Docker

You can also run MongoDB using Docker:

```bash
docker run -d \
  --name ai-chat-mongo \
  -p 27017:27017 \
  -v mongo_data:/data/db \
  mongo:7
```

The default connection string is:

```text
mongodb://localhost:27017/ai_chat
```

Make sure this matches the `MONGODB_URI` value in `api/.env`.

## Start the Llama-Compatible Inference Server

The backend expects a local inference server that provides an OpenAI-compatible chat completion API.

Make sure your model server is running at the URL configured in:

```env
LLAMA_SERVER_URL=http://localhost:8080
```

The server should provide:

- `GET http://localhost:8080/health`
- `POST http://localhost:8080/v1/chat/completions`

The exact URL and port may be different depending on your local Llama-compatible server.

If your inference server does not provide these endpoints, the frontend may load normally, but the backend will not be able to generate AI responses.

## Run the Application Locally

The frontend and backend are separate applications, so run them in separate terminals.

### Start the Backend

Open a terminal and run:

```bash
cd api
npm run dev
```

The API should be available at:

```text
http://localhost:3000
```

### Start the Frontend

Open a second terminal and run:

```bash
cd web
npm run dev
```

The Vite development server should be available at:

```text
http://localhost:5173
```

Open the frontend in your browser:

```text
http://localhost:5173
```

## Typical Local Workflow

Start the services in this order:

1. Start MongoDB
   - Make sure MongoDB is running.
2. Start the Llama-Compatible Inference Server
   - Make sure the model server is running and accessible.
3. Start the Backend

   ```bash
   cd api
   npm run dev
   ```

4. Start the Frontend
   - In a separate terminal:

   ```bash
   cd web
   npm run dev
   ```

5. Open the Application
   - Open: `http://localhost:5173`
   - Create an account or log in.
   - Start chatting with the model.

## Useful Commands

### Backend

Run the backend development server:

```bash
cd api
npm run dev
```

Run backend tests:

```bash
cd api
npm run test
```

Build the backend:

```bash
cd api
npm run build
```

### Frontend

Run the frontend development server:

```bash
cd web
npm run dev
```

Build the frontend:

```bash
cd web
npm run build
```

Preview the production frontend build:

```bash
cd web
npm run preview
```

## Project Structure

The main project directories are:

```text
Ai-chat/
│
├── api/
│   ├── node_modules/
│   ├── .env
│   ├── package.json
│   └── ...
│
├── web/
│   ├── node_modules/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── package.json
```

### `api`

The `api` directory contains the Node.js/Express backend.

It is responsible for:

- Authentication
- API endpoints
- Database communication
- MongoDB/Mongoose operations
- Chat requests
- Communication with the Llama-compatible inference server
- Backend configuration and environment variables

### `web`

The `web` directory contains the React/Vite frontend.

It is responsible for:

- User interface
- Authentication screens
- Chat interface
- API communication
- Client-side state management
- Rendering AI responses

## Environment Files

Environment files should remain local and should not be committed to Git.

The expected environment files are:

- `api/.env`
- `web/.env`

Make sure `.gitignore` includes:

```gitignore
.env
.env.*
!.env.example
```

If you provide example environment files for other developers, use:

- `api/.env.example`
- `web/.env.example`

Keep the actual `.env` files out of version control.

## Troubleshooting

### Frontend Cannot Connect to the Backend

Check that the backend is running:

```text
http://localhost:3000
```

Then verify the frontend environment variable:

```env
VITE_API_URL=http://localhost:3000
```

Also verify that the backend's CORS configuration allows:

```text
http://localhost:5173
```

### Backend Cannot Connect to MongoDB

Check that MongoDB is running and verify:

```env
MONGODB_URI=mongodb://localhost:27017/ai_chat
```

If MongoDB is running on a different host or port, update the URI accordingly.

### AI Responses Are Not Being Generated

Check that the Llama-compatible inference server is running.

Verify:

```env
LLAMA_SERVER_URL=http://localhost:8080
LLAMA_MODEL=llama-model
```

The inference server should provide:

- `GET /health`
- `POST /v1/chat/completions`

Also make sure `LLAMA_MODEL` matches the model configured on your inference server.

### Backend Fails to Start

Check that all required environment variables are present in:

```text
api/.env
```

The backend validates required environment variables on startup. If a required environment variable is missing or invalid, the API may fail to start.

## Notes

- The backend validates required environment variables on startup.
- If a required environment variable is missing, the API may fail to start.
- The frontend normally runs on `http://localhost:5173`.
- The backend normally runs on `http://localhost:3000`.
- MongoDB normally runs on port `27017`.
- The Llama-compatible inference server runs separately from the frontend and backend.
- The project is primarily intended for local development and experimentation.
- For production, use secure environment variables.
- For production deployments, use properly secured and managed MongoDB and inference services.

## Tech Stack

- React
- TypeScript
- Vite
- Node.js
- Express
- MongoDB
- Mongoose
- Redux Toolkit
- Llama-compatible inference API

## Architecture Overview

```text
┌─────────────────────┐
│                     │
│  React + Vite       │
│  Frontend           │
│                     │
│  localhost:5173     │
│                     │
└──────────┬──────────┘
           │
           │ HTTP API Requests
           ▼
┌─────────────────────┐
│                     │
│  Node.js + Express  │
│  Backend            │
│                     │
│  localhost:3000     │
│                     │
└───────┬───────┬─────┘
        │       │
        │       │ Chat Completions
        │       ▼
        │  ┌────────────────────────┐
        │  │                        │
        │  │ Llama-Compatible       │
        │  │ Inference Server       │
        │  │                        │
        │  │ localhost:8080         │
        │  │                        │
        │  └────────────────────────┘
        │
        │ Database
        ▼
┌─────────────────────┐
│                     │
│  MongoDB            │
│                     │
│  localhost:27017    │
│                     │
└─────────────────────┘
```

## Quick Start

If everything is already installed and configured, the basic startup process is:

### Terminal 1 — Backend

```bash
cd api
npm run dev
```

### Terminal 2 — Frontend

```bash
cd web
npm run dev
```

Make sure MongoDB and the Llama-compatible inference server are also running.

Then open:

```text
http://localhost:5173
```
