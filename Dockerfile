FROM node:22-alpine

WORKDIR /app

# Install ALL dependencies (devDeps required for vite/esbuild build step)
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build frontend (Vite) + bundle backend (esbuild)
RUN npm run build

# Prune devDependencies after build to keep image lean
RUN npm prune --omit=dev

# Expose port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
