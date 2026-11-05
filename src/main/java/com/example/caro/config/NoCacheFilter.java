package com.example.caro.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Filter vo hieu hoa cache trinh duyet (BFCache - Back-Forward Cache)
 * cho cac trang HTML va cac API de ngan chan quay lai trang sau khi dang xuat.
 */
@Component
//tao moi file voi thu tu cao nhat de filter nay duoc thuc hien truoc cac filter khac
@Order(Ordered.HIGHEST_PRECEDENCE)
public class NoCacheFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (response instanceof HttpServletResponse httpResponse && request instanceof HttpServletRequest httpRequest) {
            String uri = httpRequest.getRequestURI();

            // Ap dung Cache-Control chan cache cho cac trang HTML, route goc, hoac API
            if (uri.endsWith(".html") || uri.equals("/") || uri.startsWith("/api/")) {
                httpResponse.setHeader("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
                httpResponse.setHeader("Pragma", "no-cache");
                httpResponse.setDateHeader("Expires", 0);
            }
        }
        chain.doFilter(request, response);
    }
}
