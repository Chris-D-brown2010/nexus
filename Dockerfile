# Universal container image for AI BOS — works on Render, Railway, Fly.io, etc.
FROM node:20-slim

# better-sqlite3 needs build tools to compile its native bits
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better build caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the app
COPY . .

# Store the database on a writable path (override with DATA_DIR if mounting a disk)
ENV DATA_DIR=/app/data
ENV NODE_ENV=production

EXPOSE 3000
CMD ["npm", "start"]
