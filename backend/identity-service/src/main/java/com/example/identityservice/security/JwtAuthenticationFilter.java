package com.example.identityservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        // Allow ALL /api/auth/* EXCEPT /me which needs token
        return path.startsWith("/api/auth") && !path.startsWith("/api/auth/me");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain)
            throws ServletException, IOException {

        String token = null;

        // First try to get token from Authorization header
        final String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
        }

        // If not in header, try to get from cookie
        if (token == null && request.getCookies() != null) {
            token = Arrays.stream(request.getCookies())
                    .filter(cookie -> "jwt".equals(cookie.getName()))
                    .findFirst()
                    .map(Cookie::getValue)
                    .orElse(null);
        }

        // If no token found, continue without authentication
        if (token == null) {
            chain.doFilter(request, response);
            return;
        }

        String email;
        try {
            email = jwtUtil.extractEmail(token);
            if (jwtUtil.isTokenExpired(token)) {
                chain.doFilter(request, response);
                return;
            }
        } catch (Exception ex) {
            chain.doFilter(request, response);
            return;
        }

        var roles = jwtUtil.extractRoles(token).stream()
                .map(r -> "ROLE_" + r)
                .map(org.springframework.security.core.authority.SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        var authentication = new UsernamePasswordAuthenticationToken(
                email,
                null,
                roles
        );

        authentication.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request)
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        chain.doFilter(request, response);
    }
}
