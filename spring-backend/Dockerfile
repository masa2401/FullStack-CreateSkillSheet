# 1. ビルドステージ (Mavenでのコンパイル・パッケージング)
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# 依存関係のキャッシュ効率化のため、まずラッパーとpom.xmlをコピー
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B

# ソースコードをコピーしてビルド（テストはスキップ）
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# 2. 実行ステージ
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# ビルドステージから生成されたJARファイルをコピー
COPY --from=build /app/target/*.jar app.jar

# Spring Bootのデフォルトポート（必要に応じて変更してください）
EXPOSE 8080

# アプリケーションの起動
ENTRYPOINT ["java", "-jar", "app.jar"]