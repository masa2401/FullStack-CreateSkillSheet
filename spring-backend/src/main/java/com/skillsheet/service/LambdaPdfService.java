package com.skillsheet.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvocationType;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.lambda.model.LambdaException;
import tools.jackson.databind.json.JsonMapper;

/**
 * Lambda（skillsheet-pdf-generator）への非同期Invokeを担当するサービス。
 * InvocationType.EVENT を使うため、呼び出し自体の成否のみを検証し、
 * PDF生成の成否は GET /api/pdf/{id}/status 側でS3の存在確認により判断する。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LambdaPdfService {

    private final LambdaClient lambdaClient;
    private final JsonMapper jsonMapper;

    @Value("${aws.lambda.pdf-function-name}")
    private String functionName;

    @Value("${app.frontend-base-url}")
    private String frontendBaseUrl;

    // 手動リトライ（regenerate）の連打防止用の簡易スロットリング
    private final ConcurrentHashMap<UUID, Instant> lastInvokedAt = new ConcurrentHashMap<>();
    private static final long MIN_RETRY_INTERVAL_SECONDS = 15;

    /** 保存直後に呼ぶ非同期生成リクエスト。失敗してもログのみで例外を上位に投げない。 */
    public void requestGenerationAsync(UUID sheetId, String userName) {
        invokeAsync(sheetId, userName);
    }

    /** 「再試行」ボタンから呼ばれる。直近のInvokeから間隔が短すぎる場合はスキップする。 */
    public boolean retryGeneration(UUID sheetId, String userName) {
        Instant now = Instant.now();
        Instant last = lastInvokedAt.get(sheetId);
        if (last != null && now.minusSeconds(MIN_RETRY_INTERVAL_SECONDS).isBefore(last)) {
            log.info("PDF再生成リクエストをスロットリングしました: sheetId={}", sheetId);
            return false;
        }
        invokeAsync(sheetId, userName);
        return true;
    }

    private void invokeAsync(UUID sheetId, String userName) {
        try {
            String resultUrl = frontendBaseUrl + "/#/result?id=" + sheetId;
            PdfGenerationPayload payload = new PdfGenerationPayload(
                    sheetId.toString(), resultUrl, userName);
            String json = jsonMapper.writeValueAsString(payload);

            InvokeRequest request = InvokeRequest.builder().functionName(functionName)
                    .invocationType(InvocationType.EVENT).payload(SdkBytes.fromString(json, StandardCharsets.UTF_8))
                    .build();

            InvokeResponse response = lambdaClient.invoke(request);
            lastInvokedAt.put(sheetId, Instant.now());

            if (response.statusCode() != 202) {
                log.warn("Lambda Invokeが想定外のステータスを返しました: sheetId={}, status={}",
                        sheetId, response.statusCode());
            }
        } catch (LambdaException e) {
            log.error("Lambda PDF生成のInvokeに失敗しました: sheetId={}", sheetId, e);
        } catch (Exception e) {
            log.error("PDF生成リクエストの送信中に予期しないエラーが発生しました: sheetId={}", sheetId, e);
        }
    }

    private record PdfGenerationPayload(String id, String url, String fileName) {
    }
}
