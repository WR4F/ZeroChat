FROM node:15.6.0-slim

# Get the dependencies ready
RUN apt-get -y update \
    && apt-get install git -y \
    && rm -rf /root/.cache/pip/* \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Define WORKDIR
WORKDIR /zerochat

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the source files
COPY . .

# Expose the port
EXPOSE 80

# Start the container
ENTRYPOINT ["npm"]
CMD ["run", "start"]

