# --- Stage 1: build the frontend ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: runtime ---
FROM node:20-alpine
WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

COPY server ./server
COPY --from=build /app/dist ./dist

ENV PORT=4000
ENV DATA_DIR=/data
VOLUME ["/data"]
EXPOSE 4000

CMD ["node", "server/index.js"]
