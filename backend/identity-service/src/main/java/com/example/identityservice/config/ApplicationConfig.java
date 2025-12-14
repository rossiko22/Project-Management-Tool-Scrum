package com.example.identityservice.config;

import org.springframework.context.annotation.Configuration;

/**
 * Application configuration for Spring Boot 4 / Spring Security 7.
 *
 * Note: PasswordEncoder bean is now defined in PasswordEncoderConfig.java
 * to avoid duplicate bean definitions.
 */
@Configuration
public class ApplicationConfig {
    // Moved PasswordEncoder to PasswordEncoderConfig to avoid conflicts
}
