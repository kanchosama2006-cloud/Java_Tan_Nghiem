package com.example.caro.exception;

/** 401 - chua dang nhap hoac sai thong tin dang nhap. */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
