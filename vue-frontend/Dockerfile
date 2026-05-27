FROM node:20-alpine

WORKDIR /app

# 依存関係の定義だけを先にコピーしてインストール
COPY package*.json ./
RUN npm install

# 開発サーバーのポートを開放
EXPOSE 5173

# 開発サーバーを起動（Viteの場合。Vue CLIなら npm run serve）
CMD ["npm", "run", "dev", "--", "--host"]