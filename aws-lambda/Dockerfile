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


FROM node:24-slim AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN npm run build


FROM public.ecr.aws/lambda/nodejs:24

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