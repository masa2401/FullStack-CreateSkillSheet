package com.skillsheet.exception;

import java.util.NoSuchElementException;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    // 404：リソースが見つからない
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(NoSuchElementException e) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(body);
    }

    // 410：共有リンクの期限切れ
    @ExceptionHandler(SheetExpiredException.class)
    public ResponseEntity<ProblemDetail> handleExpired(SheetExpiredException e) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.GONE, e.getMessage());
        return ResponseEntity
                .status(HttpStatus.GONE)
                .body(body);
    }

    // 400：バリデーションエラー（より詳細なメッセージを返す）
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));
        ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(body);
    }
}
