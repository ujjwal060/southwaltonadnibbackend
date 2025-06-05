FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application to the container
COPY . .

# Expose port 8132 to the outside world
EXPOSE 8132

# Define the command to run the application
CMD ["node", "app.js"]
