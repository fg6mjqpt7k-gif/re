FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# H4 FIX: Run as non-root user (node user exists in node alpine images)
USER node

EXPOSE 3000

CMD ["npm", "run", "dev"]
