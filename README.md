# AI Chat

AI Chat is a full-stack chat application built with React, TypeScript, Node.js, Express, MongoDB, and an external Llama-compatible inference server. The project is organized as a small monorepo:

- `apps/web` — React + Vite frontend
- `apps/api` — Express + TypeScript backend

This repo is designed to run locally on your own machine, as long as you have MongoDB and a compatible Llama server available.

## Prerequisites

Before you start, make sure you have:

- Node.js 20+ and npm
- MongoDB running locally or accessible via a MongoDB URI
- A local Llama-compatible inference server that exposes:
  - `GET /health`
  - `POST /v1/chat/completions`
- A terminal window to run the frontend and backend separately

## Local setup

1. Clone the project and move into the repo root:

   ```bash
   git clone <your-repo-url>
   cd aichat
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   This installs workspace dependencies for both the frontend and API.

3. Create the API environment file:

   Copy the example file into the API app so the backend can read its config:

   ```bash
   copy .env.example apps\api\.env
   ```

   If you are using a Unix shell, use:

   ```bash
   cp .env.example apps/api/.env
   ```

   Then edit `apps/api/.env` and set values such as:

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

   Notes:
   - `JWT_SECRET` should be a long random string; it must be at least 32 characters in production.
   - `LLAMA_SERVER_URL` must point to your local Llama-compatible server.
   - `LLAMA_MODEL` should match a model name that your inference server knows.
   - `CORS_ORIGIN` should match the frontend URL, usually `http://localhost:5173` in development.

4. Configure the frontend API URL (optional for local dev):

   The frontend defaults to `http://localhost:3000` in development mode, so this is usually not required. If you want to be explicit, create `apps/web/.env` with:

   ```env
   VITE_API_URL=http://localhost:3000
   ```

## Start MongoDB

If MongoDB is not already running locally, start it before launching the app.

Example using the MongoDB service directly:

```bash
mongod --dbpath /path/to/your/mongo-data
```

You can also run MongoDB in Docker:

```bash
docker run -d --name ai-chat-mongo -p 27017:27017 -v mongo_data:/data/db mongo:7
```

## Start the Llama-compatible inference server

The backend expects a server that supports OpenAI-style chat completions.

Make sure your local model server is up and listening on the URL from `LLAMA_SERVER_URL`, for example:

```text
http://localhost:8080
```

It should respond to:

- `GET http://localhost:8080/health`
- `POST http://localhost:8080/v1/chat/completions`

If your local Llama setup does not expose those endpoints, the API will fail to generate responses even if the frontend loads correctly.

## Run the app locally

Start the API in one terminal:

```bash
npm run dev:api
```

This runs the backend at:

```text
http://localhost:3000
```

Start the frontend in another terminal:

```bash
npm run dev:web
```

This runs the Vite app at:

```text
http://localhost:5173
```

Open `http://localhost:5173` in your browser.

## Typical local workflow

1. Start MongoDB
2. Start your local Llama inference server
3. Start the backend (`npm run dev:api`)
4. Start the frontend (`npm run dev:web`)
5. Create an account or log in
6. Start chatting with the model

## Useful commands

Run the API tests:

```bash
npm run test --workspace=apps/api
```

Run the frontend build:

```bash
npm run build --workspace=apps/web
```

Run the full project build:

```bash
npm run build
```

## Notes

- The backend validates required environment variables on startup. If a value is missing, the server will fail fast with a clear error.
- In development, the frontend is expected to talk to the backend at `http://localhost:3000` unless you explicitly override it.
- This app is built for local development and experimentation; for production, you would replace the local MongoDB and inference-server addresses with hosted services and secure environment values.

## Tech stack

- React
- TypeScript
- Vite
- Node.js
- Express
- MongoDB / Mongoose
- Redux Toolkit
- Llama-compatible inference API
