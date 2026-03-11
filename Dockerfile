# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Setup the Node backend
FROM node:20-alpine
WORKDIR /app

# The backend dependencies are the same package file
COPY package*.json ./
# Install only production dependencies
RUN npm install --omit=dev

# Copy backend files
COPY server.js ./

# Copy built frontend files from Stage 1 into a specific directory for the backend to serve
COPY --from=frontend-builder /app/dist ./dist

# Create a data directory for the SQLite DB to live in so we can mount a volume to it
RUN mkdir -p /app/data

# Tell the node app (server.js need modifying) to use this directory for DB
ENV DB_PATH=/app/data/database.sqlite

# Expose the API port
EXPOSE 3001

# Start the backend server
CMD ["npm", "run", "backend"]
