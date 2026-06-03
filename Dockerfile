# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for testing if needed)
RUN npm ci

# Copy application source code (filtered by .dockerignore)
COPY . .

# Prune devDependencies to keep the production image minimal
RUN npm prune --production

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

# Install tini for proper signal handling (PID 1)
RUN apk add --no-cache tini

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /usr/src/app

# Copy production node_modules and code from the builder stage with correct ownership
COPY --from=builder --chown=node:node /usr/src/app /usr/src/app

# Use the non-root node user for runtime security
USER node

EXPOSE 5000

# Set tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Container healthcheck using alpine's built-in wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/ || exit 1

# Start the application
CMD ["node", "server.js"]
