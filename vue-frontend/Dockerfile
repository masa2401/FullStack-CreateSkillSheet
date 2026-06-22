FROM node:24.16.0-alpine

WORKDIR /app

# 依存関係のキャッシュを利用するため、先にパッケージファイルをコピー
COPY package*.json ./

RUN npm install

# ソースコードのコピー
COPY . .

# Viteの開発サーバー（5173ポート）を開放
EXPOSE 5173

# ホストからのアクセスを許可するため --host を付与
CMD ["npm", "run", "dev", "--", "--host"]