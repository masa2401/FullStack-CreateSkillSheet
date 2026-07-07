# ─── ビルドステージ：TypeScript → JavaScript へトランスパイル ───
FROM node:24-slim AS builder

WORKDIR /build

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

# 本番実行に必要な依存関係だけを別途インストールしておく
# （devDependencies を含まないクリーンな node_modules を作るため）
RUN npm ci --omit=dev


# ─── 実行ステージ：Lambda用ベースイメージ ───
FROM public.ecr.aws/lambda/nodejs:24

# @sparticuz/chromium が実行時に必要とする共有ライブラリをインストール
RUN dnf install -y \
    atk \
    cups-libs \
    gtk3 \
    pango \
    alsa-lib \
    at-spi2-atk \
    libXcomposite \
    libXcursor \
    libXdamage \
    libXext \
    libXi \
    libXtst \
    && dnf clean all

WORKDIR ${LAMBDA_TASK_ROOT}

# ビルドステージから成果物だけをコピー（.ts や devDependencies は含まれない）
COPY --from=builder /build/dist ./
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package.json ./

# Lambdaが呼び出すハンドラー（dist/index.js の handler）
CMD ["index.handler"]