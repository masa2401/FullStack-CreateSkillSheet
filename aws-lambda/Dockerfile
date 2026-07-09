# ─── ビルドステージ：TypeScript → JavaScript へトランスパイル ───
FROM node:24-slim AS builder

RUN apt-get update && apt-get install -y unzip

ENV PUPPETEER_CACHE_DIR=/build/.cache/puppeteer

WORKDIR /build

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

RUN npm ci --omit=dev


# ─── 実行ステージ：Lambda用ベースイメージ ───
FROM public.ecr.aws/lambda/nodejs:24

# Chrome for Testing（puppeteerが自動取得するフルビルド）実行に必要な共有ライブラリ + 日本語フォント
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
    libXrandr \
    libXScrnSaver \
    mesa-libgbm \
    nss \
    fontconfig \
    google-noto-sans-cjk-jp-fonts \
    && fc-cache -fv \
    && dnf clean all

ENV PUPPETEER_CACHE_DIR=/opt/puppeteer-cache

WORKDIR ${LAMBDA_TASK_ROOT}

COPY --from=builder /build/dist ./
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package.json ./
COPY --from=builder /build/.cache/puppeteer /opt/puppeteer-cache

CMD ["index.handler"]