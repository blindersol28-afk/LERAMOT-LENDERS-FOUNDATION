FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy all source files
COPY . .

# Build frontend (Vite) + bundle backend (esbuild)
RUN npm run build

# Expose port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
