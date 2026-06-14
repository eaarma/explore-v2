package com.explore.app.shared;

import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

@RestControllerAdvice
public class ValidationExceptionHandler {

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleConstraintViolation(ConstraintViolationException exception) {
        return buildBadRequestBody("Validation failed");
    }

    @ExceptionHandler({
            IllegalArgumentException.class,
            MethodArgumentNotValidException.class,
            BindException.class,
            HttpMessageNotReadableException.class,
            MissingServletRequestParameterException.class,
            MissingServletRequestPartException.class,
            MethodArgumentTypeMismatchException.class
    })
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleBadRequestExceptions(Exception exception) {
        return buildBadRequestBody(resolveMessage(exception));
    }

    private Map<String, Object> buildBadRequestBody(String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", HttpStatus.BAD_REQUEST.getReasonPhrase());
        body.put("message", message);
        return body;
    }

    private String resolveMessage(Exception exception) {
        if (exception instanceof MethodArgumentNotValidException
                || exception instanceof BindException) {
            return "Validation failed";
        }

        if (exception instanceof HttpMessageNotReadableException) {
            return "Request body is invalid";
        }

        if (exception instanceof MissingServletRequestParameterException missingParameterException) {
            return missingParameterException.getParameterName() + " parameter is required";
        }

        if (exception instanceof MissingServletRequestPartException missingPartException) {
            return missingPartException.getRequestPartName() + " part is required";
        }

        if (exception instanceof MethodArgumentTypeMismatchException mismatchException) {
            return mismatchException.getName() + " has an invalid value";
        }

        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            return "Bad request";
        }

        return message;
    }
}
