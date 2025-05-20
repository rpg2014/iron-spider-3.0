# Use a slim Node.js image for the runtime
FROM node:20-slim

# Install curl for healthcheck
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# copy node_modules over
COPY node_modules/ ./node_modules/

# Install react-router-serve globally
RUN npm install -g @react-router/serve

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV USE_STREAMS=true
ENV NODE_ENV=production

# Copy only the built application files
COPY build/ ./build/
COPY public/ ./public/

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application using npx
CMD ["react-router-serve", "build/server/index.js"]
