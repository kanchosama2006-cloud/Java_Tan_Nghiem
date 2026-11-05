package com.example.caro.exception;

/** 400 - yeu cau khong hop le (vi du nuoc di sai luat). */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
