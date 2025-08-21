FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Inject Vite env at build-time so import.meta.env.VITE_API_URL is baked into the bundle
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV HOST=0.0.0.0
COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "--port", "5173"]


