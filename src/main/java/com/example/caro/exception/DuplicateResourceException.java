package com.example.caro.exception;

/** 409 - du lieu bi trung (vi du ten dang nhap da ton tai). */
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
