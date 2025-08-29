FROM node:20-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
USER app
EXPOSE 8080
CMD ["node","server.js"]
