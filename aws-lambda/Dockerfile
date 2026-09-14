# ─── 依存ステージ：本番依存と Chrome for Testing を取得する。
#     package-lock.json が変わらない限り再実行されないため、
#     ソースや tsconfig の変更で Chrome が再ダウンロードされることがない。 ───
FROM node:24-slim AS deps

# @puppeteer/browsers は yauzl を任意の peer dependency として扱い、
# 未インストール時は系統の unzip で Chrome の zip を展開する。削除しないこと。
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_CACHE_DIR=/build/.cache/puppeteer

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --omit=dev


# ─── ビルドステージ：TypeScript → JavaScript へトランスパイル。
#     tsc しか使わないため --ignore-scripts を付け、
#     deps ステージと二重に Chrome を取得することを避ける。 ───
FROM node:24-slim AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN npm run build


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
COPY --from=deps /build/node_modules ./node_modules
COPY --from=deps /build/package.json ./
COPY --from=deps /build/.cache/puppeteer /opt/puppeteer-cache

CMD ["index.handler"]