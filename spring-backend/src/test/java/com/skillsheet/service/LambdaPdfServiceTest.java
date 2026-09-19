package com.skillsheet.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class LambdaPdfServiceTest {

    private LambdaPdfService service;

    @BeforeEach
    void setUp() {
        // 記録の削除だけを検証するため、Lambda クライアントと JsonMapper は使わない
        service = new LambdaPdfService(null, null);
    }

    @Test
    @DisplayName("定期削除：スロットリングの間隔（15秒）を過ぎた記録は削除される")
    void removeExpiredInvocationRecords_removesOldRecords() {
        UUID sheetId = UUID.randomUUID();
        Instant now = Instant.now();
        lastInvokedAt().put(sheetId, now.minusSeconds(16));

        service.removeExpiredInvocationRecordsAt(now);

        assertThat(lastInvokedAt()).doesNotContainKey(sheetId);
    }

    @Test
    @DisplayName("定期削除：スロットリングの間隔内の記録は削除されない")
    void removeExpiredInvocationRecords_keepsRecentRecords() {
        UUID sheetId = UUID.randomUUID();
        Instant now = Instant.now();
        lastInvokedAt().put(sheetId, now.minusSeconds(5));

        service.removeExpiredInvocationRecordsAt(now);

        assertThat(lastInvokedAt()).containsKey(sheetId);
    }

    @SuppressWarnings("unchecked")
    private Map<UUID, Instant> lastInvokedAt() {
        return (Map<UUID, Instant>) ReflectionTestUtils.getField(service, "lastInvokedAt");
    }
}
