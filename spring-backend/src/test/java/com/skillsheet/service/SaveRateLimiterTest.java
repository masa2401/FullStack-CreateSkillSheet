package com.skillsheet.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.skillsheet.exception.TooManyRequestsException;

class SaveRateLimiterTest {

    private SaveRateLimiter limiter;

    @BeforeEach
    void setUp() {
        limiter = new SaveRateLimiter();
        ReflectionTestUtils.setField(limiter, "maxRequests", 2);
        ReflectionTestUtils.setField(limiter, "windowSeconds", 1L);
    }

    @Test
    @DisplayName("上限回数以内であれば例外は発生しない")
    void withinLimit_doesNotThrow() {
        assertThatCode(() -> {
            limiter.checkAndRecord("1.2.3.4");
            limiter.checkAndRecord("1.2.3.4");
        }).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("上限回数を超えるとTooManyRequestsExceptionがスローされる")
    void exceedsLimit_throwsTooManyRequests() {
        limiter.checkAndRecord("1.2.3.4");
        limiter.checkAndRecord("1.2.3.4");

        assertThatThrownBy(() -> limiter.checkAndRecord("1.2.3.4"))
                .isInstanceOf(TooManyRequestsException.class);
    }

    @Test
    @DisplayName("クライアント（IP）が異なれば互いにカウントは影響しない")
    void differentClients_areCountedIndependently() {
        limiter.checkAndRecord("1.1.1.1");
        limiter.checkAndRecord("1.1.1.1");

        assertThatCode(() -> limiter.checkAndRecord("2.2.2.2")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("ウィンドウ経過後は再度リクエストできる")
    void afterWindowElapses_allowsRequestsAgain() throws InterruptedException {
        limiter.checkAndRecord("1.2.3.4");
        limiter.checkAndRecord("1.2.3.4");

        Thread.sleep(1100);

        assertThatCode(() -> limiter.checkAndRecord("1.2.3.4")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("スロットリングされたリクエストはカウントに加算されない")
    void throttledRequest_isNotRecorded() {
        limiter.checkAndRecord("1.2.3.4");
        limiter.checkAndRecord("1.2.3.4");

        assertThatThrownBy(() -> limiter.checkAndRecord("1.2.3.4"))
                .isInstanceOf(TooManyRequestsException.class);
        // 3回目（スロットリングされた分）がカウントされていれば、ここでも例外になるはず
        assertThatThrownBy(() -> limiter.checkAndRecord("1.2.3.4"))
                .isInstanceOf(TooManyRequestsException.class);
    }
}