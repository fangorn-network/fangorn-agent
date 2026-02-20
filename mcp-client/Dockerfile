FROM node:22

RUN apt-get update && apt-get install -y git

RUN npm install -g pnpm

WORKDIR /app

COPY ../x402f x402f

COPY fangorn-agent/mcp-client/package*.json ./
RUN pnpm install

COPY fangorn-agent/mcp-client/tsconfig.json ./
COPY fangorn-agent/mcp-client/src/ ./src/

RUN npm run build

EXPOSE 3001

CMD ["node", "build/mcpServer.js"]