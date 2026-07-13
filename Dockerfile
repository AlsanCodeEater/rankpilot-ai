FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies needed for prisma and other native modules
RUN apk add --no-cache openssl python3 make g++

# Copy package configuration
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --include=dev

# Copy the rest of the application
COPY . .

# Generate Prisma client for alpine
RUN npx prisma generate

# Build the Remix application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Expose the default port
EXPOSE 3000

# Set production environment
ENV NODE_ENV="production"
ENV PORT=3000

# Start the application using docker-start script (runs migrations then starts remix)
CMD ["npm", "run", "docker-start"]
