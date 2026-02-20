FROM node:22-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY package*.json ./
RUN pnpm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# stdin/stdout must be kept open for the chat loop
CMD ["node", "build/llmAgent.js"]