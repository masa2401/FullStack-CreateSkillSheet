package com.skillsheet.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.skillsheet.exception.TooManyRequestsException;

/**
 * スキルシート新規作成（POST /api/sheets）に対する簡易スロットリング。
 *
 * シート作成は必ずLambdaでのPDF生成（コスト発生源）を無条件で伴うため、
 * 同一クライアント（IPアドレス単位）からの過度な連続作成を防ぐ目的で導入する。
 * フロントエンド側のUI制御（連続入力の抑制等）はあくまでクライアント側の
 * 制御に過ぎず、API直叩きでの連打を防げないため、サーバー側の最終防衛ラインとして機能する。
 *
 * インメモリのスライディングウィンドウ方式。単一インスタンス運用（現状のRailwayデプロイ）を
 * 前提としており、複数インスタンス構成に拡張する場合はRedis等の共有ストアへの置き換えが必要。
 * （PdfController/LambdaPdfServiceの再試行スロットリングと同じ設計方針に揃えている）
 */
@Component
public class SaveRateLimiter {

    @Value("${sheet.save.rate-limit.max-requests:20}")
    private int maxRequests;

    @Value("${sheet.save.rate-limit.window-seconds:600}")
    private long windowSeconds;

    private final ConcurrentHashMap<String, Deque<Instant>> history = new ConcurrentHashMap<>();

    /**
     * 直近のウィンドウ内でのリクエスト数が上限を超えていれば{@link TooManyRequestsException}を投げる。
     * 上限内であれば今回のリクエストを記録して正常終了する。
     */
    public void checkAndRecord(String clientKey) {
        Instant now = Instant.now();
        Duration window = Duration.ofSeconds(windowSeconds);

        history.compute(clientKey, (key, existing) -> {
            Deque<Instant> timestamps = existing != null ? existing : new ArrayDeque<>();

            while (!timestamps.isEmpty() && Duration.between(timestamps.peekFirst(), now).compareTo(window) > 0) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= maxRequests) {
                long retryAfterSeconds = window.minus(Duration.between(timestamps.peekFirst(), now)).getSeconds();
                throw new TooManyRequestsException(
                        "スキルシートの作成リクエストが上限に達しました。しばらく時間をおいて再度お試しください",
                        Math.max(retryAfterSeconds, 1));
            }

            timestamps.addLast(now);
            return timestamps;
        });
    }
}
