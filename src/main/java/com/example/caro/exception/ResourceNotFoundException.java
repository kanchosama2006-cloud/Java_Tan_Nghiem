package com.example.caro.exception;

/** 404 - khong tim thay du lieu. */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
