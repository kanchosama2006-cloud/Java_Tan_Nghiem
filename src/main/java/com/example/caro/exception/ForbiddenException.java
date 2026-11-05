package com.example.caro.exception;

/** 403 - da dang nhap nhung khong du quyen. */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
