# Use a Node.js base image
FROM node:16-alpine 

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock (or package-lock.json) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install
# Copy the rest of the application code to the working directory
COPY . .
RUN npm run build
RUN npx prisma generate
# Expose the port your Nest.js application is running on
EXPOSE 3000
ENV DATABASE_URL="postgres://user:password@postgres:5432/db"
ENV PORT=3000
ENV REDIS=6379
# Start the Nest.js application
CMD [ "node", "dist/main" ]