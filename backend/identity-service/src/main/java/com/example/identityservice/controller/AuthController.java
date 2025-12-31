package com.example.identityservice.controller;

import com.example.identityservice.dto.LoginRequest;
import com.example.identityservice.dto.LoginResponse;
import com.example.identityservice.dto.UserDto;
import com.example.identityservice.service.AuthService;
import com.example.identityservice.service.RabbitMQLoggerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and authorization endpoints")
public class AuthController {

    private final AuthService authService;
    private final RabbitMQLoggerService logger;

    @Value("${jwt.expiration:28800000}") // Default 8 hours in milliseconds
    private Long jwtExpiration;

    @PostMapping("/authenticate")
    @Operation(summary = "User login", description = "Authenticate user and return JWT token")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        String url = httpRequest.getRequestURI();
        logger.logInfo("Authentication attempt for user: " + request.getEmail(), url);

        try {
            LoginResponse response = authService.login(request);
            logger.logInfo("User authenticated successfully: " + request.getEmail(), url);
            return createLoginResponse(response, httpRequest, httpResponse);
        } catch (Exception e) {
            logger.logError("Authentication failed for user " + request.getEmail() + ": " + e.getMessage(), url);
            throw e;
        }
    }

    private ResponseEntity<LoginResponse> createLoginResponse(
            LoginResponse response,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        LoginResponse loginResponse = response;

        // Determine domain from request host
        String host = httpRequest.getHeader("Host");
        String domain = null;

        if (host != null) {
            if (host.startsWith("admin.local")) {
                domain = "admin.local";
            } else if (host.startsWith("team.local")) {
                domain = "team.local";
            }
        }

        // Set JWT as HttpOnly cookie with domain-specific settings
        Cookie jwtCookie = new Cookie("jwt", response.getToken());
        jwtCookie.setHttpOnly(true);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge((int) (jwtExpiration / 1000)); // Convert milliseconds to seconds

        if (domain != null) {
            jwtCookie.setDomain(domain);
        }

        // TODO: Set Secure flag in production (requires HTTPS)
        // jwtCookie.setSecure(true);

        httpResponse.addCookie(jwtCookie);

        return ResponseEntity.ok(loginResponse);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Get currently authenticated user information")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication, HttpServletRequest request) {
        String url = request.getRequestURI();
        String email = authentication.getName();
        logger.logInfo("Getting current user info: " + email, url);
        return ResponseEntity.ok(authService.getCurrentUser(email));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Logout current user (clear JWT cookie)")
    public ResponseEntity<Void> logout(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        String url = httpRequest.getRequestURI();
        logger.logInfo("User logout", url);

        // Determine domain from request host
        String host = httpRequest.getHeader("Host");
        String domain = null;

        if (host != null) {
            if (host.startsWith("admin.local")) {
                domain = "admin.local";
            } else if (host.startsWith("team.local")) {
                domain = "team.local";
            }
        }

        // Clear JWT cookie with domain-specific settings
        Cookie jwtCookie = new Cookie("jwt", null);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(0); // Expire immediately

        if (domain != null) {
            jwtCookie.setDomain(domain);
        }

        httpResponse.addCookie(jwtCookie);

        return ResponseEntity.ok().build();
    }
}
